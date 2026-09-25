import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getServerSupabase } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { hit, clientIpFromHeaders } from "@/lib/rate-limit";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const passwordSchema = z.string()
  .min(12)
  .max(200)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z0-9]/);

const bodySchema = z.object({
  nonce: z.string().regex(/^\d{6}$/),
  password: passwordSchema,
  confirmation: z.string().max(200),
}).refine((value) => value.password === value.confirmation, { path: ["confirmation"] });

export async function POST(request: Request) {
  try {
    const ctx = await getAdminContext();
    const rate = hit(`admin-password-change:${ctx.user.id}`, 5, 15 * 60 * 1000);
    if (!rate.ok) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Vérifiez le code et les critères du nouveau mot de passe." },
        { status: 400 },
      );
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.updateUser({
      email: ctx.user.email,
      password: parsed.data.password,
      nonce: parsed.data.nonce,
    });
    if (error) {
      console.error("[flexigo:auth] password update failed:", error.message);
      return NextResponse.json(
        { error: "Le code est invalide ou a expiré. Demandez un nouveau code." },
        { status: 400 },
      );
    }

    await logAudit({
      actorId: ctx.user.id,
      action: "security.password_changed",
      entity: "auth_user",
      entityId: ctx.user.id,
      ip: clientIpFromHeaders(request.headers),
      metadata: { method: "email_reauthentication" },
    });

    const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
    if (signOutError) console.error("[flexigo:auth] global sign-out failed:", signOutError.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
