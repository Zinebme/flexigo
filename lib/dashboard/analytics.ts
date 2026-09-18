/**
 * Merchant analytics (server-side, scoped to one store).
 * GMV is the GROSS value of orders — it is NOT platform revenue and is
 * labelled as such everywhere it is shown.
 */
import { getAdminSupabase } from "../supabase/admin";
import type { OrderRow, ProductRow, OrderItemRow } from "../supabase/database.types";
import { ORDER_TERMINAL_STATUSES } from "../types";
import { WILAYAS } from "../algeria/wilayas";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  orders: number;
  gmv_cents: number;
}

export interface Analytics {
  gmv_cents: number; // all non-cancelled orders (gross)
  delivered_cents: number;
  orders_total: number;
  delivered_count: number;
  orders_30d: number;
  daily: DailyPoint[]; // last 30 days
  byStatus: Array<{ status: string; count: number; gmv_cents: number }>;
  topProducts: Array<{ name: string; units: number; revenue_cents: number }>;
  topWilayas: Array<{ code: number; name: string; orders: number; gmv_cents: number }>;
  lowStock: Array<{ name: string; stock: number }>;
  delivered_ratio: number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getAnalytics(storeId: string): Promise<Analytics> {
  const admin = getAdminSupabase();
  const { data: orders } = await admin
    .from("orders")
    .select("*")
    .eq("store_id", storeId);
  const os = (orders ?? []) as OrderRow[];

  const cancelled = (s: string) =>
    ORDER_TERMINAL_STATUSES.includes(s as (typeof ORDER_TERMINAL_STATUSES)[number]) || s === "cancelled_customer" || s === "cancelled_store";

  const now = new Date();
  const dayMap = new Map<string, { orders: number; gmv_cents: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dayMap.set(dayKey(d), { orders: 0, gmv_cents: 0 });
  }

  let gmv_cents = 0;
  let delivered_cents = 0;
  let orders_30d = 0;
  const statusAgg = new Map<string, { count: number; gmv_cents: number }>();

  for (const o of os) {
    const isCancelled = cancelled(o.status);
    if (!isCancelled) gmv_cents += o.total_cents;
    if (o.status === "delivered") delivered_cents += o.total_cents;
    const created = new Date(o.created_at);
    if (now.getTime() - created.getTime() <= 30 * 86400000) orders_30d++;

    const key = dayKey(created);
    const bucket = dayMap.get(key);
    if (bucket && !isCancelled) {
      bucket.orders++;
      bucket.gmv_cents += o.total_cents;
    }

    const s = statusAgg.get(o.status) ?? { count: 0, gmv_cents: 0 };
    s.count++;
    if (!isCancelled) s.gmv_cents += o.total_cents;
    statusAgg.set(o.status, s);
  }

  const daily: DailyPoint[] = [...dayMap.entries()].map(([date, v]) => ({ date, orders: v.orders, gmv_cents: v.gmv_cents }));

  // Top products by revenue (from order_items, non-cancelled orders only).
  const activeIds = new Set(os.filter((o) => !cancelled(o.status)).map((o) => o.id));
  const activeIdList = [...activeIds];
  const itemBuckets: OrderItemRow[] = [];
  for (let i = 0; i < activeIdList.length; i += 500) {
    const chunk = activeIdList.slice(i, i + 500);
    const { data: chunkItems } = await admin
      .from("order_items")
      .select("product_name, quantity, line_total_cents, order_id")
      .in("order_id", chunk);
    itemBuckets.push(...((chunkItems ?? []) as OrderItemRow[]));
  }
  const prodAgg = new Map<string, { units: number; revenue_cents: number }>();
  for (const it of itemBuckets) {
    if (!activeIds.has(it.order_id)) continue;
    const p = prodAgg.get(it.product_name) ?? { units: 0, revenue_cents: 0 };
    p.units += it.quantity;
    p.revenue_cents += it.line_total_cents;
    prodAgg.set(it.product_name, p);
  }
  const topProducts = [...prodAgg.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, 8);

  // Top wilayas.
  const wilAgg = new Map<number, { orders: number; gmv_cents: number }>();
  for (const o of os) {
    if (cancelled(o.status)) continue;
    const w = wilAgg.get(o.wilaya_code) ?? { orders: 0, gmv_cents: 0 };
    w.orders++;
    w.gmv_cents += o.total_cents;
    wilAgg.set(o.wilaya_code, w);
  }
  const topWilayas = [...wilAgg.entries()]
    .map(([code, v]) => ({ code, name: WILAYAS.find((w) => w.code === code)?.name ?? `Wilaya ${code}`, ...v }))
    .sort((a, b) => b.gmv_cents - a.gmv_cents)
    .slice(0, 8);

  // Low stock.
  const { data: products } = await admin
    .from("products")
    .select("name, stock, low_stock_threshold")
    .eq("store_id", storeId)
    .is("deleted_at", null);
  const lowStock = ((products ?? []) as Array<Pick<ProductRow, "name" | "stock" | "low_stock_threshold">>)
    .filter((p) => p.stock <= p.low_stock_threshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)
    .map((p) => ({ name: p.name, stock: p.stock }));

  const deliveredCount = os.filter((o) => o.status === "delivered").length;

  return {
    gmv_cents,
    delivered_cents,
    orders_total: os.length,
    delivered_count: deliveredCount,
    orders_30d,
    daily,
    byStatus: [...statusAgg.entries()].map(([status, v]) => ({ status, ...v })).sort((a, b) => b.count - a.count),
    topProducts,
    topWilayas,
    lowStock,
    delivered_ratio: os.length > 0 ? deliveredCount / os.length : 0,
  };
}
