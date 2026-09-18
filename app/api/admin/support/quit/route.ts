import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminContext, SUPPORT_COOKIE } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Quit the current support session (SUPER_ADMIN only).
 * Ends the session (ended_at) and clears the cookie. Audited.
 */
export async function POST() {
  try {
    const ctx = await getAdminContext();

    // Find the admin's active session from the cookie (never trust the
    // payload itself — the row must exist, belong to this admin, be open).
    const admin = getAdminSupabase();
    const cookieValue = (await cookies()).get(SUPPORT_COOKIE)?.value ?? null;

    if (cookieValue) {
      const { data: session } = await admin
        .from("support_sessions")
        .select("id, store_id")
        .eq("id", cookieValue)
        .eq("admin_user_id", ctx.user.id)
        .is("ended_at", null)
        .maybeSingle();

      if (session) {
        const { error } = await admin
          .from("support_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", session.id);
        if (error) throw error;

        await logAudit({
          actorId: ctx.user.id,
          storeId: session.store_id,
          action: "support.session_ended",
          entity: "support_session",
          entityId: session.id,
          metadata: { by: "platform_admin" },
        });
      }
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SUPPORT_COOKIE);
    return res;
  } catch (e) {
    return toErrorResponse(e);
  }
}
