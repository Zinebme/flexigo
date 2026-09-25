/**
 * Audit logging for sensitive actions.
 *
 * - Only sensitive operations are recorded (order status changes, price
 *   changes, deletions, settings/integration/domain changes, permission
 *   changes, support sessions, repairs, publish/restore).
 * - Secrets are scrubbed from metadata before insert.
 * - The table is NOT accessible from client sessions (no RLS policies);
 *   it is read exclusively by Super Admin server-side routes.
 */
import { getAdminSupabase } from "./supabase/admin";

export type AuditAction =
  | "order.status_changed"
  | "order.created"
  | "order.note"
  | "price.changed"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "stock.adjusted"
  | "category.changed"
  | "customer.updated"
  | "client.created"
  | "client.updated"
  | "client.suspended"
  | "client.deleted"
  | "store.settings_changed"
  | "store.settings_repaired"
  | "store.status_changed"
  | "store.created"
  | "store.duplicated"
  | "store.soft_deleted"
  | "store.appearance_changed"
  | "store.repair_checked"
  | "store.regenerated"
  | "page.published"
  | "page.restored"
  | "page.updated"
  | "page.regenerated"
  | "review.moderated"
  | "faq.changed"
  | "shipping.zone_changed"
  | "integration.changed"
  | "integration.tested"
  | "integration.reset"
  | "integration.disconnected"
  | "shipment.sent"
  | "domain.created"
  | "domain.added"
  | "domain.updated"
  | "domain.verified"
  | "domain.deleted"
  | "domain.removed"
  | "domain.primary_changed"
  | "team.member_added"
  | "team.member_role_changed"
  | "team.member_removed"
  | "team.access_link_generated"
  | "support.session_started"
  | "support.session_ended"
  | "support.action"
  | "repair.executed"
  | "admin.user_viewed"
  | "platform_admin.added"
  | "platform_admin.removed"
  | "security.password_changed"
  | "export.data";

/** Recursively redact values that look like credentials. */
function scrub(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.startsWith("fxenc1.")) return "[redacted-secret]";
    if (/^(eyJ|sk-|AIza)/.test(value) && value.length > 20) return "[redacted-token]";
    return value.length > 500 ? value.slice(0, 500) + "…" : value;
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/(token|secret|password|key|credential|authorization)/i.test(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = scrub(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export interface AuditInput {
  actorId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  storeId?: string | null;
  metadata?: Record<string, unknown>;
  supportSessionId?: string | null;
  ip?: string | null;
}

/**
 * Record an audit entry. Failures are logged (never silently swallowed) but
 * do not break the underlying operation.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const admin = getAdminSupabase();
    const { error } = await admin.from("audit_logs").insert({
      actor_user_id: input.actorId,
      store_id: input.storeId ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ? (scrub(input.metadata) as Record<string, unknown>) : null,
      support_session_id: input.supportSessionId ?? null,
      ip: input.ip ?? null,
    });
    if (error) {
      console.error("[flexigo:audit] insert failed:", error.message);
    }
  } catch (e) {
    console.error("[flexigo:audit] unexpected failure:", e);
  }
}

/** Record a system event (errors, integration failures) for health pages. */
export async function logSystemEvent(input: {
  storeId?: string | null;
  category: "error" | "warning" | "integration" | "domain" | "system";
  level: "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = getAdminSupabase();
    const { error } = await admin.from("system_events").insert({
      store_id: input.storeId ?? null,
      category: input.category,
      level: input.level,
      message: input.message.slice(0, 500),
      details: input.details ? (scrub(input.details) as Record<string, unknown>) : null,
    });
    if (error) console.error("[flexigo:system] insert failed:", error.message);
  } catch (e) {
    console.error("[flexigo:system] unexpected failure:", e);
  }
}
