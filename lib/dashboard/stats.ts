/**
 * Merchant dashboard statistics. All queries are scoped to the resolved
 * store (server-side) — the caller already passed getMerchantContext().
 * Uses the service client so the merchant sees their own store's data
 * regardless of RLS (defensive double-scope by store_id).
 */
import { getAdminSupabase } from "../supabase/admin";
import type { OrderRow } from "../supabase/database.types";
import { ORDER_TERMINAL_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "../types";

export interface DashboardStats {
  newOrders: number;
  activeOrders: number;
  gmvCents: number;
  gmvLabel: string;
  delivered30d: number;
  productsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  customersCount: number;
  recentOrders: Array<OrderRow & { items_count?: number }>;
  byStatus: Array<{ status: OrderStatus; label: string; count: number }>;
  daily: Array<{ day: string; label: string; total: number; count: number }>;
}

function fmtDA(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR")} DA`;
}

export async function getDashboardStats(storeId: string): Promise<DashboardStats> {
  const admin = getAdminSupabase();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const d30 = new Date(Date.now() - 30 * 864e5).toISOString();

  const [ordersRes, productsRes, customersRes] = await Promise.all([
    admin.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(500),
    admin.from("products").select("stock, low_stock_threshold, is_active").eq("store_id", storeId).is("deleted_at", null),
    admin.from("customers").select("id").eq("store_id", storeId),
  ]);

  const all = (ordersRes.data ?? []) as OrderRow[];
  const cancelled = (s: string) => s === "cancelled_customer" || s === "cancelled_store";

  const newOrders = all.filter((o) => o.status === "new").length;
  const activeOrders = all.filter(
    (o) => !ORDER_TERMINAL_STATUSES.includes(o.status as OrderStatus) && o.status !== "new",
  ).length;
  const gmvCents = all.filter((o) => !cancelled(o.status) && o.status !== "returned").reduce((s, o) => s + o.total_cents, 0);
  const delivered30d = all.filter((o) => o.status === "delivered" && o.created_at >= d30).length;

  const prods = (productsRes.data ?? []) as Array<{ stock: number; low_stock_threshold: number | null; is_active: boolean }>;
  const lowStockCount = prods.filter((p) => p.is_active && p.stock > 0 && p.low_stock_threshold != null && p.stock <= p.low_stock_threshold).length;
  const outOfStockCount = prods.filter((p) => p.is_active && p.stock <= 0).length;

  // by status
  const byStatus = (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[])
    .map((status) => ({
      status,
      label: ORDER_STATUS_LABELS[status],
      count: all.filter((o) => o.status === status).length,
    }))
    .filter((x) => x.count > 0);

  // last 14 days totals
  const daily: DashboardStats["daily"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const rows = all.filter((o) => o.created_at >= d.toISOString() && o.created_at < next.toISOString() && !cancelled(o.status));
    daily.push({
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      total: rows.reduce((s, o) => s + o.total_cents, 0),
      count: rows.length,
    });
  }

  return {
    newOrders,
    activeOrders,
    gmvCents,
    gmvLabel: fmtDA(gmvCents),
    delivered30d,
    productsCount: prods.length,
    lowStockCount,
    outOfStockCount,
    customersCount: (customersRes.data ?? []).length,
    recentOrders: all.slice(0, 8) as DashboardStats["recentOrders"],
    byStatus,
    daily,
  };
}
