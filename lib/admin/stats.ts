/**
 * Platform-wide metrics for the Super Admin dashboard.
 *
 * IMPORTANT: "CA global" (GMV) is the gross value of orders across client
 * stores. It is NOT platform revenue and is labelled as such in the UI.
 */
import { getAdminSupabase } from "../supabase/admin";
import type { StoreRow, OrderRow } from "../supabase/database.types";
import { ORDER_TERMINAL_STATUSES } from "../types";
import type { OrderStatus } from "../types";

export interface PlatformStats {
  stores: {
    total: number;
    active: number;
    draft: number;
    suspended: number;
    archived: number;
  };
  organizations: number;
  orders: {
    total: number;
    delivered: number;
    gmv_cents: number; // gross across stores — NOT platform revenue
    delivered_cents: number;
  };
  users: number;
  recentAudits: Array<{
    id: string;
    action: string;
    entity: string;
    store_name: string | null;
    actor_email: string | null;
    created_at: string;
  }>;
  recentEvents: Array<{
    id: string;
    category: string;
    level: string;
    message: string;
    store_name: string | null;
    created_at: string;
  }>;
  storesWithErrors: Array<{ id: string; name: string; slug: string; error: string; created_at: string }>;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = getAdminSupabase();

  const [storesRes, orgsRes, ordersRes, usersRes, auditsRes, eventsRes, errEventsRes] = await Promise.all([
    admin.from("stores").select("*").is("deleted_at", null),
    admin.from("organizations").select("id"),
    admin.from("orders").select("*"),
    admin.from("profiles").select("id"),
    admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8),
    admin.from("system_events").select("*").order("created_at", { ascending: false }).limit(8),
    admin
      .from("system_events")
      .select("*")
      .eq("level", "error")
      .gt("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const stores = (storesRes.data ?? []) as StoreRow[];
  const orders = (ordersRes.data ?? []) as OrderRow[];
  const auditRows = (auditsRes.data ?? []) as Array<Record<string, unknown>>;
  const actorIds = [...new Set(auditRows.map((a) => a.actor_user_id).filter((v): v is string => typeof v === "string"))];
  const { data: actorProfiles } =
    actorIds.length > 0 ? await admin.from("profiles").select("id, email").in("id", actorIds) : { data: [] };
  const actorEmails = new Map(((actorProfiles ?? []) as Array<{ id: string; email: string | null }>).map((p) => [p.id, p.email]));

  const isCancelled = (s: string) =>
    s === "cancelled_customer" || s === "cancelled_store" || ORDER_TERMINAL_STATUSES.includes(s as OrderStatus);

  let gmv_cents = 0;
  let delivered_cents = 0;
  let delivered = 0;
  for (const o of orders) {
    if (!isCancelled(o.status)) gmv_cents += o.total_cents;
    if (o.status === "delivered") {
      delivered++;
      delivered_cents += o.total_cents;
    }
  }

  const storeNames = new Map(stores.map((s) => [s.id, s.name]));

  // Store names for audit/event rows.
  const mapName = (storeId: unknown) => (typeof storeId === "string" ? (storeNames.get(storeId) ?? null) : null);

  return {
    stores: {
      total: stores.length,
      active: stores.filter((s) => s.status === "active").length,
      draft: stores.filter((s) => s.status === "draft").length,
      suspended: stores.filter((s) => s.status === "suspended").length,
      archived: stores.filter((s) => s.status === "archived").length,
    },
    organizations: (orgsRes.data ?? []).length,
    orders: { total: orders.length, delivered, gmv_cents, delivered_cents },
    users: (usersRes.data ?? []).length,
    recentAudits: auditRows.map((a) => ({
      id: a.id as string,
      action: a.action as string,
      entity: a.entity as string,
      store_name: mapName(a.store_id),
      actor_email: typeof a.actor_user_id === "string" ? (actorEmails.get(a.actor_user_id) ?? null) : null,
      created_at: a.created_at as string,
    })),
    recentEvents: ((eventsRes.data ?? []) as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as string,
      category: e.category as string,
      level: e.level as string,
      message: e.message as string,
      store_name: mapName(e.store_id),
      created_at: e.created_at as string,
    })),
    storesWithErrors: ((errEventsRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((e) => typeof e.store_id === "string")
      .slice(0, 10)
      .map((e) => ({
        id: (e.store_id as string),
        name: storeNames.get(e.store_id as string) ?? "—",
        slug: stores.find((s) => s.id === e.store_id)?.slug ?? "—",
        error: e.message as string,
        created_at: e.created_at as string,
      })),
  };
}
