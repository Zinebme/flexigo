/**
 * Store list data for the platform admin (one query per dimension, no N+1).
 * Aggregates orders, owner contact, primary domain and integrations per store.
 */
import { getAdminSupabase } from "../supabase/admin";
import { ORDER_TERMINAL_STATUSES } from "../types";
import type { OrderStatus } from "../types";

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "suspended" | "archived";
  website_type: "ecommerce" | "single_product" | "portfolio";
  template_key: string;
  language: string;
  created_at: string;
  owner_email: string | null;
  organization_name: string | null;
  domain: string | null;
  domain_status: string | null;
  orders_count: number;
  gmv_cents: number;
  last_order_at: string | null;
  last_activity_at: string | null;
  integrations: number;
  broken_integrations: number;
}

const TERMINAL = (s: string) => s === "cancelled_customer" || s === "cancelled_store" || ORDER_TERMINAL_STATUSES.includes(s as OrderStatus);

export async function getAdminStores(): Promise<AdminStore[]> {
  const admin = getAdminSupabase();

  const [storesRes, membersRes, domainsRes, ordersRes, shippingRes, marketingRes, sheetsRes, whatsappRes, orgsRes] = await Promise.all([
    admin.from("stores").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    admin.from("store_members").select("store_id, user_id, role, status").eq("role", "OWNER").eq("status", "active"),
    admin.from("domains").select("*").eq("is_primary", true),
    admin.from("orders").select("store_id, status, total_cents, created_at"),
    admin.from("shipping_integrations").select("store_id, status"),
    admin.from("marketing_integrations").select("store_id, is_active"),
    admin.from("google_sheet_integrations").select("store_id, is_active, last_status, last_error"),
    admin.from("whatsapp_integrations").select("store_id, status"),
    admin.from("organizations").select("id, name"),
  ]);

  const stores = (storesRes.data ?? []) as Array<Record<string, unknown>>;
  const members = (membersRes.data ?? []) as Array<{ store_id: string; user_id: string }>;
  const domains = (domainsRes.data ?? []) as Array<Record<string, unknown>>;
  const orders = (ordersRes.data ?? []) as Array<{ store_id: string; status: string; total_cents: number; created_at: string }>;
  const shipping = (shippingRes.data ?? []) as Array<{ store_id: string; status: string }>;
  const marketing = (marketingRes.data ?? []) as Array<{ store_id: string; is_active: boolean }>;
  const sheets = (sheetsRes.data ?? []) as Array<{ store_id: string; is_active: boolean; last_status: string | null; last_error: string | null }>;
  const whatsapp = (whatsappRes.data ?? []) as Array<{ store_id: string; status: string }>;
  const orgs = (orgsRes.data ?? []) as Array<{ id: string; name: string }>;

  // Owner emails
  const ownerIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } =
    ownerIds.length > 0
      ? await admin.from("profiles").select("id, email").in("id", ownerIds)
      : { data: [] };
  const emails = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((p) => [p.id, p.email]));

  const orgMap = new Map(orgs.map((o) => [o.id, o.name]));
  const domainMap = new Map(domains.map((d) => [d.store_id as string, d]));

  // Order aggregates
  const orderAgg = new Map<string, { count: number; gmv: number; last: string }>();
  for (const o of orders) {
    const cur = orderAgg.get(o.store_id) ?? { count: 0, gmv: 0, last: "" };
    cur.count += 1;
    if (!TERMINAL(o.status)) cur.gmv += o.total_cents;
    if (o.created_at > cur.last) cur.last = o.created_at;
    orderAgg.set(o.store_id, cur);
  }

  // Integration aggregates: count active/configured integrations and flag
  // broken ones (shipping error, sheets failure, whatsapp error).
  const integAgg = new Map<string, { total: number; broken: number }>();
  const bump = (storeId: string, active: boolean, broken: boolean) => {
    const cur = integAgg.get(storeId) ?? { total: 0, broken: 0 };
    if (active) cur.total += 1;
    if (broken) cur.broken += 1;
    integAgg.set(storeId, cur);
  };
  for (const i of shipping) bump(i.store_id, i.status !== "unconfigured", i.status === "error");
  for (const m of marketing) bump(m.store_id, m.is_active, false);
  for (const g of sheets) bump(g.store_id, g.is_active, g.last_status === "failure" || g.last_error !== null);
  for (const w of whatsapp) bump(w.store_id, w.status === "connected", w.status === "error");

  // Last activity: newest of orders + audit logs for that store (audit queried once).
  const { data: audits } = await admin
    .from("audit_logs")
    .select("store_id, created_at")
    .not("store_id", "is", null)
    .order("created_at", { ascending: false });
  const auditLast = new Map<string, string>();
  for (const a of (audits ?? []) as Array<{ store_id: string; created_at: string }>) {
    if (!auditLast.has(a.store_id)) auditLast.set(a.store_id, a.created_at);
  }

  return stores.map((s) => {
    const id = s.id as string;
    const orderAggRow = orderAgg.get(id);
    const integRow = integAgg.get(id);
    const domain = domainMap.get(id);
    const orgId = s.organization_id as string | undefined;
    return {
      id,
      name: s.name as string,
      slug: s.slug as string,
      status: s.status as AdminStore["status"],
      website_type: s.website_type as AdminStore["website_type"],
      template_key: (s.template_key as string) ?? "ecommerce-modern",
      language: (s.language as string) ?? "fr",
      created_at: s.created_at as string,
      owner_email: emails.get(members.find((m) => m.store_id === id)?.user_id ?? "") ?? null,
      organization_name: orgId ? (orgMap.get(orgId) ?? null) : null,
      domain: (domain?.hostname as string | undefined) ?? null,
      domain_status: (domain?.status as string | undefined) ?? null,
      orders_count: orderAggRow?.count ?? 0,
      gmv_cents: orderAggRow?.gmv ?? 0,
      last_order_at: orderAggRow?.last || null,
      last_activity_at: auditLast.get(id) ?? orderAggRow?.last ?? null,
      integrations: integRow?.total ?? 0,
      broken_integrations: integRow?.broken ?? 0,
    };
  });
}
