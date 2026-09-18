import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext, SUPPORT_COOKIE } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ store_id: z.string().uuid() });

/**
 * Start a SILENT support session (SUPER_ADMIN only).
 *
 * - The client is NEVER notified (no email, no in-app signal, no popup).
 * - A row is inserted in support_sessions and the session id is set as an
 *   httpOnly cookie; the merchant dashboard then renders for that store with
 *   a role equivalent to MANAGER and records the session id on EVERY action.
 * - Starting the session is itself audited (action + ip + target store).
 */
export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const input = bodySchema.parse(await req.json().catch(() => null));

    const admin = getAdminSupabase();
    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("id, name, status")
      .eq("id", input.store_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (storeError) throw storeError;
    if (!store) throw err("NOT_FOUND", "Site introuvable");
    if (store.status === "archived") throw err("FORBIDDEN", "Ce site est archivé.");

    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "").split(",")[0]?.trim() || null;

    // Close any still-open session of this admin (one impersonation at a time).
    await admin
      .from("support_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("admin_user_id", ctx.user.id)
      .is("ended_at", null);

    const { data: session, error: sessError } = await admin
      .from("support_sessions")
      .insert({ admin_user_id: ctx.user.id, store_id: input.store_id, ip })
      .select("id")
      .single();
    if (sessError) throw sessError;

    void logAudit({
      actorId: ctx.user.id,
      storeId: input.store_id,
      action: "support.session_started",
      entity: "support_session",
      entityId: (session as { id: string }).id,
      ip,
      metadata: { store_name: store.name, by: "platform_admin", silent: true },
    });

    const res = NextResponse.json({ ok: true, store_id: input.store_id });
    res.cookies.set(SUPPORT_COOKIE, (session as { id: string }).id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours max
    });
    return res;
  } catch (e) {
    return toErrorResponse(e);
  }
}
