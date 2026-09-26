import { notFound } from "next/navigation";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getOrderDetail } from "@/lib/dashboard/orders";
import { can } from "@/lib/types";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { Card, CardHeader, Table, Th, Td, Badge, PageHeader } from "@/components/ui";
import { OrderEditForm } from "@/components/dashboard/order-edit-form";
import { ShipButton } from "@/components/dashboard/ship-button";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { providerCapabilities } from "@/lib/providers/shipping";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  new: "blue", to_confirm: "amber", confirmed: "blue", postponed: "gray", no_answer: "gray",
  preparation: "purple", shipped: "purple", in_transit: "purple", at_office: "amber",
  out_for_delivery: "amber", delivered: "green", returned: "red",
  delivery_failed: "red", cancelled_customer: "red", cancelled_store: "red",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getMerchantContext();
  const detail = await getOrderDetail(ctx.store.id, id);
  if (!detail) notFound();
  const { order, items, history, shipment } = detail;

  const canStatus = can(ctx.role, "orders.manage");
  const canShip = can(ctx.role, "orders.ship");
  const alreadyShipped = order.status === "shipped" || order.status === "in_transit" || !!shipment;
  const { data: activeCarrier } = await getAdminSupabase().from("shipping_integrations")
    .select("provider_key").eq("store_id", ctx.store.id).eq("is_active", true).limit(1).maybeSingle();
  const configuredProvider = activeCarrier?.provider_key ?? "manual";
  const providerKey = configuredProvider === "manual" || providerCapabilities(configuredProvider).automaticShipments ? configuredProvider : "manual";
  const wa = `https://wa.me/${order.phone.replace(/[^0-9]/g, "")}`;
  const tel = `tel:+${order.phone.replace(/[^0-9]/g, "")}`;

  return (
    <>
      <PageHeader
        title={`Commande ${order.order_number}`}
        subtitle={`Créée ${timeAgoFr(order.created_at)} · ${formatDateTimeFr(order.created_at)}`}
      >
        <Link href="/dashboard/commandes" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          ← Toutes les commandes
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Articles" />
            <Table head={<><Th>Produit</Th><Th>Qté</Th><Th>Prix unit.</Th><Th>Sous-total</Th></>}>
              {items.map((it) => (
                <tr key={it.id}>
                  <Td>
                    <div className="font-medium text-slate-800">{it.product_name}</div>
                    {it.variant_name && <div className="text-xs text-slate-400">{it.variant_name}</div>}
                    {it.selected_options && Object.keys(it.selected_options).length > 0 && <div className="text-xs text-slate-500">{Object.entries(it.selected_options).map(([label, values]) => `${label}: ${values.join(", ")}`).join(" · ")}</div>}
                  </Td>
                  <Td>{it.quantity}</Td>
                  <Td className="text-slate-600">{formatDA(it.unit_price_cents)}</Td>
                  <Td className="font-semibold text-slate-900">{formatDA(it.line_total_cents)}</Td>
                </tr>
              ))}
            </Table>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600"><span>Sous-total</span><span>{formatDA(order.subtotal_cents)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Livraison</span><span>{formatDA(order.shipping_fee_cents)}</span></div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-slate-600"><span>Remise</span><span>− {formatDA(order.discount_cents)}</span></div>
              )}
              <div className="flex justify-between pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatDA(order.total_cents)}</span></div>
            </div>
          </Card>

          <Card>
            <div id="modifier"><CardHeader title="Modifier la commande" subtitle="Coordonnées, adresse, statut et note interne" /></div>
            {canStatus ? <OrderEditForm order={order} /> : <p className="p-5 text-sm text-slate-500">Modification réservée aux gestionnaires.</p>}
            {order.internal_notes ? (
              <div className="border-t border-slate-100 p-5"><h3 className="mb-2 text-sm font-semibold text-slate-700">Notes précédentes</h3><p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{order.internal_notes}</p></div>
            ) : (
              null
            )}
          </Card>

          <Card>
            <CardHeader title="Traçabilité du statut" />
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun changement.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800">
                        {h.from_status && <span className="text-slate-400">{ORDER_STATUS_LABELS[h.from_status as OrderStatus] ?? h.from_status} → </span>}
                        <span className="font-semibold">{ORDER_STATUS_LABELS[h.to_status as OrderStatus] ?? h.to_status}</span>
                      </p>
                      {h.note && <p className="whitespace-pre-wrap text-sm text-slate-500">{h.note}</p>}
                      <p className="text-xs text-slate-400">{formatDateTimeFr(h.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Statut</h3>
              <Badge tone={STATUS_TONE[order.status] ?? "gray"}>{ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}</Badge>
            </div>
            {canShip && !alreadyShipped && (
              <ShipButton orderId={order.id} providerKey={providerKey} enabled />
            )}
            {alreadyShipped && (
              <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
                <p className="font-semibold">Suivi de l’expédition</p>
                {shipment?.provider_shipment_id && <p className="mt-1">Réf. transporteur : <span className="font-mono">{shipment.provider_shipment_id}</span></p>}
                {order.tracking_number && <p>N° de suivi : <span className="font-mono">{order.tracking_number}</span></p>}
                {order.shipping_provider && <p>Transporteur : {order.shipping_provider}</p>}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Client" />
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-400">Nom</dt><dd className="font-medium text-slate-800">{order.full_name}</dd></div>
              <div><dt className="text-slate-400">Téléphone</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  <a className="font-semibold text-rose-600" href={tel}>{order.phone}</a>
                  <a className="text-emerald-600" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
                </dd>
              </div>
              <div><dt className="text-slate-400">Livraison</dt>
                <dd className="font-medium text-slate-800">
                  {order.delivery_type === "office" ? `🏢 ${order.office ?? "Bureau à confirmer"} — ${order.commune}, ${order.wilaya}` : `🏠 ${order.address ?? ""}, ${order.commune}, ${order.wilaya}`}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Origine" />
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-400">Source</dt><dd className="font-medium text-slate-800">{order.source ?? "boutique"}</dd></div>
              {order.utm_source && <div><dt className="text-slate-400">UTM source</dt><dd className="font-medium text-slate-800">{order.utm_source}</dd></div>}
              {order.utm_campaign && <div><dt className="text-slate-400">UTM campagne</dt><dd className="font-medium text-slate-800">{order.utm_campaign}</dd></div>}
              {order.utm_medium && <div><dt className="text-slate-400">UTM medium</dt><dd className="font-medium text-slate-800">{order.utm_medium}</dd></div>}
              {order.referrer && <div><dt className="text-slate-400">Référent</dt><dd className="break-all font-medium text-slate-800">{order.referrer}</dd></div>}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
