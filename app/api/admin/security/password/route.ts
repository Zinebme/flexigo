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
    if (!rate.ok) return NextResponse.redirect(new URL("/admin/parametres?security=too-many-attempts", request.url), 303);

    const formData = await request.formData();
    const parsed = bodySchema.safeParse({
      nonce: formData.get("nonce"),
      password: formData.get("password"),
      confirmation: formData.get("confirmation"),
    });
    if (!parsed.success) {
      return NextResponse.redirect(new URL("/admin/parametres?security=invalid-password", request.url), 303);
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.updateUser({
      email: ctx.user.email,
      password: parsed.data.password,
      nonce: parsed.data.nonce,
    });
    if (error) {
      console.error("[flexigo:auth] password update failed:", error.message);
      return NextResponse.redirect(new URL("/admin/parametres?security=invalid-code", request.url), 303);
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

    return NextResponse.redirect(new URL("/login?passwordChanged=1", request.url), 303);
  } catch (error) {
    return toErrorResponse(error);
  }
}
