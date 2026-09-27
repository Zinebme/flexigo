import { notFound } from "next/navigation";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getOrderDetail } from "@/lib/dashboard/orders";
import { can, ORDER_STATUS_LABELS } from "@/lib/types";
import { cn, formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardFooter,
  Table,
  Th,
  Td,
  PageHeader,
  Button,
  Alert,
  DataRow,
  EmptyState,
  rowCls,
} from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { CopyButton } from "@/components/ui/copy-button";
import { OrderEditForm } from "@/components/dashboard/order-edit-form";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { providerCapabilities } from "@/lib/providers/shipping";
import { ShipButton } from "@/components/dashboard/ship-button";
import { PrintButton } from "@/components/dashboard/print-button";
import { OrderStatusBadge, statusDotClass } from "@/components/order-status";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getMerchantContext();
  const detail = await getOrderDetail(ctx.store.id, id);
  if (!detail) notFound();
  const { order, items, history, shipment } = detail;

  const canStatus = can(ctx.role, "orders.manage");
  const canShip = can(ctx.role, "orders.ship");
  const alreadyShipped = order.status === "shipped" || order.status === "in_transit" || !!shipment;
  const { data: activeCarrier } = await getAdminSupabase()
    .from("shipping_integrations")
    .select("provider_key")
    .eq("store_id", ctx.store.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const configuredProvider = activeCarrier?.provider_key ?? "manual";
  const providerKey =
    configuredProvider === "manual" || providerCapabilities(configuredProvider).automaticShipments ? configuredProvider : "manual";
  const digits = order.phone.replace(/[^0-9]/g, "");
  const wa = `https://wa.me/${digits}`;
  const tel = `tel:+${digits}`;
  const isOffice = order.delivery_type === "office";
  const tracking = shipment?.tracking_number ?? order.tracking_number;
  const originRows = [
    { label: "Source", value: order.source },
    { label: "UTM source", value: order.utm_source },
    { label: "UTM campagne", value: order.utm_campaign },
    { label: "UTM medium", value: order.utm_medium },
    { label: "Référent", value: order.referrer },
  ].filter((r) => Boolean(r.value));

  return (
    <>
      <PageHeader
        backHref="/dashboard/commandes"
        backLabel="Toutes les commandes"
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={12} />
            {timeAgoFr(order.created_at)}
          </span>
        }
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="fx-num">Commande {order.order_number}</span>
            <CopyButton value={order.order_number} label="le numéro de commande" />
          </span>
        }
        subtitle={`${formatDateTimeFr(order.created_at)} · ${items.length} article${items.length > 1 ? "s" : ""} · ${formatDA(order.total_cents)}`}
      >
        <PrintButton />
        <Button href={tel} tone="secondary" size="sm" icon="phone">
          Appeler
        </Button>
        <Button href={wa} external tone="secondary" size="sm" icon="message">
          WhatsApp
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ---------------------------------------------------------- main --- */}
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          <Card className="fx-print-flat">
            <CardHeader
              title="Articles commandés"
              subtitle={`${items.reduce((s, it) => s + it.quantity, 0)} pièce(s) au total`}
              icon="package"
            />
            <Table
              head={
                <>
                  <Th>Produit</Th>
                  <Th align="center">Qté</Th>
                  <Th align="right">Prix unit.</Th>
                  <Th align="right">Sous-total</Th>
                </>
              }
            >
              {items.map((it) => (
                <tr key={it.id} className={rowCls}>
                  <Td>
                    <div className="font-medium text-slate-800">{it.product_name}</div>
                    {it.variant_name ? <div className="mt-0.5 text-xs text-slate-500">{it.variant_name}</div> : null}
                    {it.selected_options && Object.keys(it.selected_options).length > 0 ? (
                      <div className="mt-0.5 text-xs text-slate-500">
                        {Object.entries(it.selected_options)
                          .map(([label, values]) => `${label} : ${values.join(", ")}`)
                          .join(" · ")}
                      </div>
                    ) : null}
                  </Td>
                  <Td align="center" className="fx-num text-slate-700">
                    {it.quantity}
                  </Td>
                  <Td align="right" className="fx-num text-slate-600">
                    {formatDA(it.unit_price_cents)}
                  </Td>
                  <Td align="right" className="fx-num font-semibold text-slate-900">
                    {formatDA(it.line_total_cents)}
                  </Td>
                </tr>
              ))}
            </Table>
            <div className="space-y-1.5 border-t border-slate-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total</span>
                <span className="fx-num">{formatDA(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Livraison {isOffice ? "(bureau)" : "(domicile)"}</span>
                <span className="fx-num">{formatDA(order.shipping_fee_cents)}</span>
              </div>
              {order.discount_cents > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise</span>
                  <span className="fx-num">− {formatDA(order.discount_cents)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-bold text-slate-900">Total à encaisser (COD)</span>
                <span className="fx-num text-xl font-extrabold text-slate-900">{formatDA(order.total_cents)}</span>
              </div>
            </div>
          </Card>

          {/* Order editing — ported from the order-management branch (PATCH /api/dashboard/orders/[id]) */}
          <Card id="modifier" className="scroll-mt-24 fx-no-print">
            <CardHeader title="Modifier la commande" subtitle="Coordonnées, adresse, statut et note interne" icon="pencil" />
            {canStatus ? (
              <OrderEditForm key={`${order.status}-${order.updated_at}`} order={order} />
            ) : (
              <div className="p-5">
                <Alert tone="neutral" icon="lock" title="Modification réservée aux gestionnaires">
                  Votre rôle permet de consulter cette commande sans la modifier.
                </Alert>
              </div>
            )}
          </Card>

          <Card className="fx-print-flat">
            <CardHeader
              title="Notes internes"
              subtitle="Visibles uniquement par votre équipe — horodatées et signées"
              icon="fileText"
            >
              {order.internal_notes ? (
                <CopyButton value={order.internal_notes} label="les notes" />
              ) : null}
            </CardHeader>
            {order.internal_notes ? (
              <div className="px-5 py-4">
                <pre className="fx-scroll max-h-64 overflow-auto rounded-lg bg-amber-50/60 p-3.5 text-sm leading-6 whitespace-pre-wrap text-slate-700 ring-1 ring-amber-100 ring-inset">
                  {order.internal_notes}
                </pre>
              </div>
            ) : (
              <EmptyState
                compact
                icon={<Icon name="fileText" size={22} />}
                title="Aucune note pour l'instant"
                text={canStatus ? "Ajoutez une note dans le panneau « Statut » à droite." : "Seuls les gestionnaires peuvent ajouter des notes."}
              />
            )}
          </Card>

          <Card className="fx-print-flat">
            <CardHeader
              title="Traçabilité du statut"
              subtitle={`${history.length} changement${history.length > 1 ? "s" : ""} enregistré${history.length > 1 ? "s" : ""}`}
              icon="history"
            />
            {history.length === 0 ? (
              <EmptyState
                compact
                icon={<Icon name="history" size={22} />}
                title="Aucun changement de statut"
                text="Chaque transition apparaîtra ici avec son auteur et son horodatage."
              />
            ) : (
              <ol className="relative space-y-4 px-5 py-5 ps-9">
                <span className="absolute inset-y-5 start-[19px] w-px bg-slate-200" aria-hidden="true" />
                {history.map((h, index) => {
                  const latest = index === history.length - 1;
                  return (
                    <li key={h.id} className="relative">
                      <span
                        className={cn(
                          "absolute top-1 -start-[26px] flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white",
                          statusDotClass(h.to_status),
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800">
                          {h.from_status ? (
                            <span className="text-slate-400">
                              {ORDER_STATUS_LABELS[h.from_status as keyof typeof ORDER_STATUS_LABELS] ?? h.from_status}
                              {" → "}
                            </span>
                          ) : null}
                          <span className={cn("font-semibold", latest && "text-slate-900")}>
                            {ORDER_STATUS_LABELS[h.to_status as keyof typeof ORDER_STATUS_LABELS] ?? h.to_status}
                          </span>
                          {latest ? (
                            <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                              dernier
                            </span>
                          ) : null}
                        </p>
                        {h.note ? (
                          <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 whitespace-pre-wrap text-slate-600">
                            {h.note}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-400" title={formatDateTimeFr(h.created_at)}>
                          {formatDateTimeFr(h.created_at)} · {timeAgoFr(h.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        {/* ----------------------------------------------------------- side --- */}
        <div className="fx-scroll order-1 space-y-4 lg:order-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <Card className="fx-no-print">
            <CardHeader title="Statut & suivi" icon="sliders">
              <OrderStatusBadge status={order.status} />
            </CardHeader>
            <div className="px-5 py-4">
              {canStatus ? (
                <a
                  href="#modifier"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  <Icon name="pencil" size={15} className="text-slate-400" />
                  Modifier la commande
                </a>
              ) : (
                <Alert tone="neutral" icon="lock" title="Lecture seule">
                  Votre rôle permet de consulter cette commande sans la modifier.
                </Alert>
              )}
            </div>
            {canShip && !alreadyShipped ? (
              <CardFooter className="flex-col items-stretch gap-2">
                <ShipButton orderId={order.id} providerKey={providerKey} enabled />
              </CardFooter>
            ) : null}
            {alreadyShipped ? (
              <CardFooter className="flex-col items-stretch gap-2">
                <dl className="w-full divide-y divide-slate-200/70">
                  <DataRow label="Transporteur">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="truck" size={14} className="text-slate-400" />
                      {order.shipping_provider ?? shipment?.provider_key ?? "—"}
                    </span>
                  </DataRow>
                  {tracking ? (
                    <DataRow label="N° de suivi">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-xs">{tracking}</span>
                        <CopyButton value={tracking} label="le numéro de suivi" size={13} />
                      </span>
                    </DataRow>
                  ) : null}
                  {shipment?.provider_shipment_id ? (
                    <DataRow label="Réf. transporteur">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-xs">{shipment.provider_shipment_id}</span>
                        <CopyButton value={shipment.provider_shipment_id} label="la référence" size={13} />
                      </span>
                    </DataRow>
                  ) : null}
                  {shipment?.last_synced_at ? (
                    <DataRow label="Dernière synchro">
                      <span className="text-xs text-slate-500">{timeAgoFr(shipment.last_synced_at)}</span>
                    </DataRow>
                  ) : null}
                </dl>
              </CardFooter>
            ) : null}
          </Card>

          <Card className="fx-print-flat">
            <CardHeader title="Client" icon="user">
              {order.customer_id ? (
                <Link
                  href={`/dashboard/clients?q=${encodeURIComponent(order.normalized_phone)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Fiche client
                  <Icon name="chevronRight" size={13} className="rtl:rotate-180" />
                </Link>
              ) : null}
            </CardHeader>
            <div className="px-5 py-4">
              <div className="text-sm font-bold text-slate-900">{order.full_name}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={tel}
                  className="fx-num inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Icon name="phone" size={14} className="text-slate-400" />
                  {order.phone}
                </a>
                <CopyButton value={order.phone} label="le téléphone" />
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Icon name="message" size={14} />
                  WhatsApp
                </a>
              </div>
            </div>
          </Card>

          <Card className="fx-print-flat">
            <CardHeader title="Livraison" icon={isOffice ? "building" : "home"} />
            <dl className="divide-y divide-slate-100 px-5 py-2">
              <DataRow label="Mode">
                {isOffice ? "Retrait en bureau" : "Livraison à domicile"}
              </DataRow>
              {isOffice ? <DataRow label="Bureau">{order.office ?? "Bureau à confirmer"}</DataRow> : null}
              {order.address ? <DataRow label="Adresse">{order.address}</DataRow> : null}
              <DataRow label="Commune">{order.commune}</DataRow>
              <DataRow label="Wilaya">
                <span className="inline-flex items-center gap-1.5">
                  <span className="fx-num rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {String(order.wilaya_code).padStart(2, "0")}
                  </span>
                  {order.wilaya}
                </span>
              </DataRow>
              <DataRow label="Frais de livraison">
                <span className="fx-num">{formatDA(order.shipping_fee_cents)}</span>
              </DataRow>
            </dl>
          </Card>

          {originRows.length > 0 ? (
            <Card className="fx-print-flat">
              <CardHeader title="Origine de la commande" icon="trendingUp" />
              <dl className="divide-y divide-slate-100 px-5 py-2">
                {originRows.map((row) => (
                  <DataRow key={row.label} label={row.label}>
                    <span className="break-all font-medium text-slate-700">{row.value}</span>
                  </DataRow>
                ))}
              </dl>
            </Card>
          ) : null}

          <Card className="fx-print-flat">
            <CardHeader title="Informations" icon="info" />
            <dl className="divide-y divide-slate-100 px-5 py-2">
              <DataRow label="Identifiant">
                <span className="inline-flex items-center gap-1">
                  <span className="font-mono text-xs text-slate-500">{order.id.slice(0, 8)}</span>
                  <CopyButton value={order.id} label="l'identifiant" size={13} />
                </span>
              </DataRow>
              <DataRow label="Créée">
                <span className="text-xs" title={formatDateTimeFr(order.created_at)}>
                  {formatDateTimeFr(order.created_at)}
                </span>
              </DataRow>
              <DataRow label="Dernière mise à jour">
                <span className="text-xs" title={formatDateTimeFr(order.updated_at)}>
                  {timeAgoFr(order.updated_at)}
                </span>
              </DataRow>
              <DataRow label="Paiement">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="cash" size={14} className="text-slate-400" />
                  À la livraison
                </span>
              </DataRow>
            </dl>
          </Card>

          <Link
            href="/dashboard/commandes"
            className="fx-no-print flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <Icon name="arrowLeft" size={15} className="rtl:rotate-180" />
            Retour à la liste des commandes
          </Link>
        </div>
      </div>
    </>
  );
}
