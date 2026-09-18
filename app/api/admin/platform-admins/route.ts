import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(120),
  role: z.literal("SUPER_ADMIN"),
});

export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const body = await req.json().catch(() => null);
    const input = schema.parse(body);

    const admin = getAdminSupabase();

    // Find profile by email
    const { data: profile } = await admin.from("profiles").select("id, email").ilike("email", input.email).maybeSingle();
    if (!profile) throw err("NOT_FOUND", "Profil introuvable — l'utilisateur doit d'abord créer son compte.");

    const { data: existing } = await admin.from("platform_admins").select("user_id").eq("user_id", (profile as { id: string }).id).maybeSingle();
    if (existing) throw err("CONFLICT", "Cet utilisateur est déjà super admin.");

    const { error } = await admin.from("platform_admins").insert({ user_id: (profile as { id: string }).id, role: "SUPER_ADMIN" } as never);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      action: "platform_admin.added",
      entity: "platform_admin",
      entityId: (profile as { id: string }).id,
      metadata: { email: input.email, role: "SUPER_ADMIN" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
