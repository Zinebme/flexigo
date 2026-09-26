import { Suspense } from "react";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { listOrders } from "@/lib/dashboard/orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { WILAYAS } from "@/lib/algeria/wilayas";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { OrderFilters } from "@/components/dashboard/order-filters";
import { OrderExportButton } from "@/components/dashboard/order-export-button";
import { ShipButton } from "@/components/dashboard/ship-button";
import { OrderStatusSelect } from "@/components/dashboard/order-status-select";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { providerCapabilities } from "@/lib/providers/shipping";
import { can } from "@/lib/types";

const STATUS_TONE: Record<string, string> = {
  new: "blue", to_confirm: "amber", confirmed: "blue", postponed: "gray", no_answer: "gray",
  preparation: "purple", shipped: "purple", in_transit: "purple", at_office: "amber",
  out_for_delivery: "amber", delivered: "green", returned: "red",
  delivery_failed: "red", cancelled_customer: "red", cancelled_store: "red",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await getMerchantContext();
  const qs = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const admin = getAdminSupabase();
  const [{ data: productRows }, { data: integrations }] = await Promise.all([
    admin.from("products").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("name"),
    admin.from("shipping_integrations").select("provider_key").eq("store_id", ctx.store.id).eq("is_active", true).limit(1),
  ]);
  const configuredProvider = integrations?.[0]?.provider_key ?? "manual";
  const activeProvider = configuredProvider === "manual" || providerCapabilities(configuredProvider).automaticShipments ? configuredProvider : "manual";

  const orders = await listOrders(ctx.store.id, {
    status: first(qs.status),
    wilaya_code: first(qs.wilaya) ? Number(first(qs.wilaya)) : undefined,
    from: first(qs.from),
    to: first(qs.to),
    q: first(qs.q),
    product_id: first(qs.product),
  });

  const total = orders.reduce((s, o) => {
    if (o.status === "cancelled_customer" || o.status === "cancelled_store" || o.status === "returned") return s;
    return s + o.total_cents;
  }, 0);

  return (
    <>
      <PageHeader title="Commandes" subtitle={`${orders.length} commandes · ${formatDA(total)} en valeur (hors annulées)`}>
        <Suspense>
          <OrderExportButton />
        </Suspense>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Statuts rapides">
        {([{ label: "Toutes", value: "" }, { label: "Nouvelles", value: "new" }, { label: "À confirmer", value: "to_confirm" }, { label: "Confirmées", value: "confirmed" }, { label: "En livraison", value: "shipped" }, { label: "Livrées", value: "delivered" }] as const).map((tab) => (
          <Link key={tab.value} href={tab.value ? `/dashboard/commandes?status=${tab.value}` : "/dashboard/commandes"} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${((first(qs.status) ?? "") === tab.value) ? "bg-rose-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-700"}`}>{tab.label}</Link>
        ))}
      </div>

      <Suspense>
        <OrderFilters
          statuses={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
          wilayas={WILAYAS}
          products={productRows ?? []}
        />
      </Suspense>

      <Card className="mt-4 overflow-hidden border-slate-100 shadow-sm">
        {orders.length === 0 ? (
          <EmptyState icon="📦" title="Aucune commande" text="Ajustez les filtres ou revenez après vos premières ventes." />
        ) : (
          <Table head={<><Th>N°</Th><Th>Client</Th><Th>Produit(s)</Th><Th>Wilaya / Commune</Th><Th>Livraison</Th><Th>Total</Th><Th>Statut</Th><Th>Créée</Th><Th>Actions</Th></>}>
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-slate-50">
                <Td className="font-semibold text-rose-700">{o.order_number}</Td>
                <Td>
                  <div className="font-medium text-slate-800">{o.full_name}</div>
                  <div className="text-xs text-slate-400">{o.phone}</div>
                </Td>
                <Td className="max-w-52 text-slate-700">{o.product_names.join(", ") || "—"}</Td>
                <Td>
                  <div className="text-slate-700">{o.wilaya}</div>
                  <div className="text-xs text-slate-400">{o.commune}</div>
                </Td>
                <Td className="text-slate-600">
                  {o.delivery_type === "office" ? `🏢 ${o.office ?? "Bureau"}` : "🏠 Domicile"}
                </Td>
                <Td className="font-semibold text-slate-900">{formatDA(o.total_cents)}</Td>
                <Td>
                  {can(ctx.role, "orders.manage") ? <OrderStatusSelect orderId={o.id} currentStatus={o.status} /> : <Badge tone={STATUS_TONE[o.status] ?? "gray"}>{ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}</Badge>}
                </Td>
                <Td className="text-slate-500" title={formatDateTimeFr(o.created_at)}>{timeAgoFr(o.created_at)}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/commandes/${o.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-700">Voir</Link>
                    {can(ctx.role, "orders.manage") && <Link href={`/dashboard/commandes/${o.id}#modifier`} className="text-xs font-semibold text-rose-600 hover:underline">Modifier</Link>}
                    {can(ctx.role,"orders.ship")&&!o.has_shipment&&!(["shipped","in_transit","delivered","returned","cancelled_customer","cancelled_store"].includes(o.status))&&<ShipButton orderId={o.id} providerKey={activeProvider} enabled compact />}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
