/**
 * Silent support impersonation.
 *
 * A Super Admin can open a logged support session for a store, then use the
 * merchant dashboard in that store's context WITHOUT knowing the client's
 * password. Guarantees:
 * - Only verified SUPER_ADMIN users can start a session (server-side check).
 * - Every session is recorded in support_sessions (start/end, admin, store, IP).
 * - Every action performed while the session is open is written to
 *   audit_logs with the support_session_id.
 * - The merchant receives NO notification (by design — "silent" support),
 *   but the full history is visible to Super Admin in Journal / Audit.
 * - The session is single-use to the admin who started it and auto-bound to
 *   that store.
 */
import { getAdminSupabase } from "../supabase/admin";
import { logAudit } from "../audit";
import { clientIpFromHeaders } from "../rate-limit";
import { err } from "../errors";
import type { SupportSessionRow } from "../supabase/database.types";

export async function startSupportSession(
  adminUserId: string,
  storeId: string,
  headers: Headers,
): Promise<SupportSessionRow> {
  const admin = getAdminSupabase();

  const { data: store, error: storeError } = await admin
    .from("stores")
    .select("id, name")
    .eq("id", storeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (storeError || !store) throw err("NOT_FOUND", "Site introuvable.");

  const { data: session, error } = await admin
    .from("support_sessions")
    .insert({ admin_user_id: adminUserId, store_id: storeId, ip: clientIpFromHeaders(headers) })
    .select()
    .single();
  if (error) throw err("UPSTREAM_ERROR", "Impossible de démarrer la session d'assistance.");

  await logAudit({
    actorId: adminUserId,
    storeId,
    action: "support.session_started",
    entity: "store",
    entityId: storeId,
    supportSessionId: session.id,
    metadata: { store_name: store.name },
  });

  return session;
}

export async function endSupportSession(
  sessionId: string,
  adminUserId: string,
): Promise<void> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("support_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("admin_user_id", adminUserId)
    .is("ended_at", null)
    .select()
    .maybeSingle();
  if (error) throw err("UPSTREAM_ERROR", "Impossible de terminer la session.");
  if (data) {
    await logAudit({
      actorId: adminUserId,
      storeId: data.store_id,
      action: "support.session_ended",
      entity: "store",
      entityId: data.store_id,
      supportSessionId: sessionId,
      metadata: { duration_seconds: Math.round((Date.now() - new Date(data.started_at).getTime()) / 1000) },
    });
  }
}

/** Fetch an open session owned by the given admin (cookie re-validation). */
export async function getOpenSupportSession(
  sessionId: string,
  adminUserId: string,
): Promise<SupportSessionRow | null> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("support_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("admin_user_id", adminUserId)
    .is("ended_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data;
}
