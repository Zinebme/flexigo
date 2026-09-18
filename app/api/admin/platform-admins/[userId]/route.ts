import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const ctx = await getAdminContext();

    if (userId === ctx.user.id) throw err("FORBIDDEN", "Vous ne pouvez pas retirer vos propres droits super-admin.");

    const admin = getAdminSupabase();

    const { data: pa } = await admin.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
    if (!pa) throw err("NOT_FOUND", "Super admin introuvable.");

    // Ensure at least one super admin remains
    const { data: all } = await admin.from("platform_admins").select("user_id");
    if ((all ?? []).length <= 1) throw err("FORBIDDEN", "Impossible de retirer le dernier super-admin.");

    const { error } = await admin.from("platform_admins").delete().eq("user_id", userId);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      action: "platform_admin.removed",
      entity: "platform_admin",
      entityId: userId,
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
