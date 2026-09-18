/**
 * Platform health aggregation for the Super Admin "Santé système" page.
 * Everything is read server-side with the service client; merchants never
 * see these diagnostics.
 */
import { getAdminSupabase } from "./supabase/admin";

export interface StoreHealth {
  storeId: string;
  name: string;
  slug: string;
  status: string;
  lastOrderAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  unverifiedDomains: string[];
  failingIntegrations: string[];
}

export interface PlatformHealth {
  sitesOk: number;
  sitesWithErrors: number;
  databaseOk: boolean;
  lastOrderAt: string | null;
  lastMerchantLoginAt: string | null;
  stores: StoreHealth[];
  recentErrors: Array<{ id: string; storeName: string | null; message: string; level: string; created_at: string }>;
  failedSyncs: Array<{ id: string; storeName: string | null; integration_type: string; message: string | null; created_at: string }>;
  unverifiedDomains: Array<{ hostname: string; storeName: string | null; status: string }>;
  generatedAt: string;
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const admin = getAdminSupabase();
  const now = new Date().toISOString();

  const [storesRes, errorsRes, syncsRes, domainsRes, loginRes] = await Promise.all([
    admin.from("stores").select("id, name, slug, status").is("deleted_at", null).order("name"),
    admin.from("system_events").select("id, store_id, message, level, created_at").eq("level", "error").order("created_at", { ascending: false }).limit(15),
    admin.from("integration_logs").select("id, store_id, integration_type, message, created_at").eq("status", "failure").order("created_at", { ascending: false }).limit(15),
    admin.from("domains").select("hostname, store_id, status").eq("status", "pending").is("deleted_at", null).limit(30),
    admin.from("profiles").select("last_login_at").not("last_login_at", "is", null).order("last_login_at", { ascending: false }).limit(1),
  ]);

  let lastOrderAt: string | null = null;
  if (storesRes.data?.length) {
    const ids = storesRes.data.map((s) => s.id);
    const { data: orderRows } = await admin
      .from("orders")
      .select("created_at")
      .in("store_id", ids)
      .order("created_at", { ascending: false })
      .limit(1);
    lastOrderAt = orderRows?.[0]?.created_at ?? null;
  }

  const stores: StoreHealth[] = (storesRes.data ?? []).map((s) => ({
    storeId: s.id,
    name: s.name,
    slug: s.slug,
    status: s.status,
    lastOrderAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    unverifiedDomains: [],
    failingIntegrations: [],
  }));
  const byId = new Map(stores.map((s) => [s.storeId, s]));

  for (const e of errorsRes.data ?? []) {
    const s = e.store_id ? byId.get(e.store_id) : null;
    if (s && (!s.lastErrorAt || e.created_at > s.lastErrorAt)) {
      s.lastErrorAt = e.created_at;
      s.lastErrorMessage = e.message;
    }
  }
  for (const d of domainsRes.data ?? []) {
    const s = d.store_id ? byId.get(d.store_id) : null;
    if (s) s.unverifiedDomains.push(d.hostname);
  }

  // Failing integrations (status = 'error' or recent sync failure)
  if (storesRes.data?.length) {
    const ids = storesRes.data.map((s) => s.id);
    const [shipRes, sheetsRes] = await Promise.all([
      admin.from("shipping_integrations").select("store_id, provider_key, status").in("store_id", ids).eq("status", "error"),
      admin.from("google_sheet_integrations").select("store_id, last_status").in("store_id", ids).eq("last_status", "failure"),
    ]);
    for (const r of shipRes.data ?? []) {
      byId.get(r.store_id)?.failingIntegrations.push(`Livraison (${r.provider_key})`);
    }
    for (const r of sheetsRes.data ?? []) {
      byId.get(r.store_id)?.failingIntegrations.push("Google Sheets");
    }
  }

  const storeName = (id: string | null) => (id ? byId.get(id)?.name ?? null : null);

  return {
    sitesOk: stores.filter((s) => !s.lastErrorAt).length,
    sitesWithErrors: stores.filter((s) => !!s.lastErrorAt).length,
    databaseOk: !storesRes.error,
    lastOrderAt,
    lastMerchantLoginAt: loginRes.data?.[0]?.last_login_at ?? null,
    stores,
    recentErrors: (errorsRes.data ?? []).map((e) => ({
      id: e.id,
      storeName: storeName(e.store_id),
      message: e.message,
      level: e.level,
      created_at: e.created_at,
    })),
    failedSyncs: (syncsRes.data ?? []).map((e) => ({
      id: e.id,
      storeName: storeName(e.store_id),
      integration_type: e.integration_type,
      message: e.message,
      created_at: e.created_at,
    })),
    unverifiedDomains: (domainsRes.data ?? []).map((d) => ({
      hostname: d.hostname,
      storeName: storeName(d.store_id),
      status: d.status,
    })),
    generatedAt: now,
  };
}
