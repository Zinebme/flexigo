/**
 * Merchant order queries (server-side, always scoped to the store).
 */
import { getAdminSupabase } from "../supabase/admin";
import type { OrderItemRow, OrderRow, OrderStatusHistoryRow } from "../supabase/database.types";

export interface OrderFilters {
  status?: string;
  wilaya_code?: number;
  from?: string; // ISO date
  to?: string; // ISO date
  q?: string; // name / phone / order number
}

export async function listOrders(storeId: string, f: OrderFilters, limit = 200) {
  const admin = getAdminSupabase();
  let q = admin.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(limit);
  if (f.status) q = q.eq("status", f.status);
  if (f.wilaya_code) q = q.eq("wilaya_code", f.wilaya_code);
  if (f.from) q = q.gte("created_at", f.from);
  if (f.to) q = q.lte("created_at", new Date(`${f.to}T23:59:59.999Z`).toISOString());
  if (f.q) {
    // Sanitize for the PostgREST or() filter (no commas/parens allowed).
    const needle = f.q.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    if (needle) q = q.or(`full_name.ilike.%${needle}%,phone.ilike.%${needle}%,normalized_phone.ilike.%${needle}%,order_number.ilike.%${needle}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

export async function getOrderDetail(storeId: string, orderId: string) {
  const admin = getAdminSupabase();
  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;

  const [{ data: items }, { data: history }, { data: shipment }] = await Promise.all([
    admin.from("order_items").select("*").eq("order_id", orderId),
    admin.from("order_status_history").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
    admin.from("shipments").select("*").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1),
  ]);
  const sh = (shipment ?? [])[0] as Record<string, unknown> | undefined;
  return {
    order: order as OrderRow,
    items: (items ?? []) as OrderItemRow[],
    history: (history ?? []) as OrderStatusHistoryRow[],
    shipment: sh
      ? {
          id: sh.id as string,
          provider_key: sh.provider_key as string,
          provider_shipment_id: (sh.provider_shipment_id as string | null) ?? null,
          tracking_number: (sh.tracking_number as string | null) ?? null,
          status: sh.status as string,
          last_synced_at: (sh.last_synced_at as string | null) ?? null,
        }
      : null,
  };
}
