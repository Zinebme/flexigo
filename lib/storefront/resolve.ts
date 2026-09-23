/**
 * Store resolution: hostname → store (custom domains) and slug → store.
 * Used by the proxy (tenant routing) and storefront layouts.
 *
 * A small in-memory cache (30 s) keeps per-request DB lookups cheap while
 * staying consistent for status changes. Caches are per-process; that is
 * acceptable for routing metadata (documented in README — for multi-node
 * deployments, bump or invalidate via FLEXIGO_PLATFORM_HOSTS + short TTL).
 */
import { getAdminSupabase } from "../supabase/admin";
import type { StoreRow } from "../supabase/database.types";
import { isSupabaseConfigured } from "../supabase/config";

export interface ResolvedStore {
  id: string;
  slug: string;
  name: string;
  status: StoreRow["status"];
  website_type: StoreRow["website_type"];
  template_key: string;
  language: StoreRow["language"];
  currency: string;
}

const CACHE_TTL_MS = 30_000;
const slugCache = new Map<string, { value: ResolvedStore | null; expires: number }>();
const hostCache = new Map<string, { value: ResolvedStore | null; expires: number }>();

function cached<T>(map: Map<string, { value: T; expires: number }>, key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = map.get(key);
  if (hit && hit.expires > now) return Promise.resolve(hit.value);
  return load().then((value) => {
    map.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
    if (map.size > 5000) map.clear();
    return value;
  });
}

async function mapStore(row: StoreRow): Promise<ResolvedStore | null> {
  if (!row || row.deleted_at) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    website_type: row.website_type,
    template_key: row.template_key,
    language: row.language,
    currency: row.currency,
  };
}

export async function resolveStoreBySlug(slug: string): Promise<ResolvedStore | null> {
  if (!isSupabaseConfigured()) return null;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  return cached(slugCache, slug, async () => {
    const admin = getAdminSupabase();
    const { data } = await admin
      .from("stores")
      .select("id, organization_id, slug, name, status, website_type, template_key, language, currency, deleted_at")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    if (data.organization_id) {
      const { data: organization } = await admin.from("organizations").select("status").eq("id", data.organization_id).is("deleted_at", null).maybeSingle();
      if (!organization || organization.status !== "active") return null;
    }
    return mapStore(data as unknown as StoreRow);
  });
}

export async function resolveStoreByHost(host: string): Promise<ResolvedStore | null> {
  if (!isSupabaseConfigured()) return null;
  const cleanHost = host.toLowerCase().trim();
  if (!/^[a-z0-9.-]{4,253}$/.test(cleanHost)) return null;
  return cached(hostCache, cleanHost, async () => {
    const admin = getAdminSupabase();
    const { data: domain } = await admin
      .from("domains")
      .select("store_id")
      .eq("hostname", cleanHost)
      .eq("status", "verified")
      .is("deleted_at", null)
      .maybeSingle();
    if (!domain) return null;
    const { data: store } = await admin
      .from("stores")
      .select("id, organization_id, slug, name, status, website_type, template_key, language, currency, deleted_at")
      .eq("id", domain.store_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!store) return null;
    if (store.organization_id) {
      const { data: organization } = await admin.from("organizations").select("status").eq("id", store.organization_id).is("deleted_at", null).maybeSingle();
      if (!organization || organization.status !== "active") return null;
    }
    return mapStore(store as unknown as StoreRow);
  });
}

/** Force-cache invalidation (called after publish/status/domain changes). */
export function invalidateStoreCaches(): void {
  slugCache.clear();
  hostCache.clear();
}
