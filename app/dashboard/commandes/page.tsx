import { Suspense } from "react";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { listOrders, countOrdersByStatus } from "@/lib/dashboard/orders";
import { can, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/types";
import { WILAYAS } from "@/lib/algeria/wilayas";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, EmptyState, LinkTabs, Button, IconButton, rowCls } from "@/components/ui";
import { Icon, type IconName } from "@/components/ui/icons";
import { OrderFilters } from "@/components/dashboard/order-filters";
import { OrderExportButton } from "@/components/dashboard/order-export-button";
import { OrderQuickStatus } from "@/components/dashboard/order-quick-status";
import { ORDER_STATUS_STAGE, ORDER_STAGE_LABELS, type OrderStage } from "@/components/order-status";
import type { OrderRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const STAGE_ORDER: OrderStage[] = ["todo", "delivery", "done", "problem"];
const PAGE_LIMIT = 200;

function stageStatuses(stage: OrderStage): string[] {
  return ORDER_STATUSES.filter((s) => ORDER_STATUS_STAGE[s] === stage);
}

/** Call / WhatsApp shortcuts — same targets as the order detail page. */
function ContactActions({ phone }: { phone: string }) {
  const digits = phone.replace(/[^0-9]/g, "");
  return (
    <span className="inline-flex items-center gap-0.5">
      <a
        href={`tel:+${digits}`}
        title="Appeler le client"
        aria-label="Appeler le client"
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
      >
        <Icon name="phone" size={14} />
      </a>
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noreferrer"
        title="Écrire sur WhatsApp"
        aria-label="Écrire sur WhatsApp"
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
      >
        <Icon name="message" size={14} />
      </a>
    </span>
  );
}

function DeliveryCell({ order }: { order: OrderRow }) {
  const icon: IconName = order.delivery_type === "office" ? "building" : "home";
  return (
    <span className="flex items-start gap-2">
      <Icon name={icon} size={15} className="mt-0.5 text-slate-400" />
      <span className="min-w-0">
        <span className="block truncate text-slate-700">{order.wilaya}</span>
        <span className="block truncate text-xs text-slate-400">
          {order.delivery_type === "office" ? `Bureau ${order.office ?? ""}`.trim() : order.commune}
        </span>
      </span>
    </span>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await getMerchantContext();
  const qs = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const status = first(qs.status);
  const stageParam = first(qs.stage);
  const stage = STAGE_ORDER.includes(stageParam as OrderStage) ? (stageParam as OrderStage) : undefined;
  const hasFilters = Boolean(status || stage || first(qs.wilaya) || first(qs.from) || first(qs.to) || first(qs.q));

  const [orders, statusCounts] = await Promise.all([
    listOrders(ctx.store.id, {
      status,
      statuses: stage ? stageStatuses(stage) : undefined,
      wilaya_code: first(qs.wilaya) ? Number(first(qs.wilaya)) : undefined,
      from: first(qs.from),
      to: first(qs.to),
      q: first(qs.q),
    }, PAGE_LIMIT),
    countOrdersByStatus(ctx.store.id),
  ]);

  const canManage = can(ctx.role, "orders.manage");
  const total = orders.reduce((s, o) => {
    if (o.status === "cancelled_customer" || o.status === "cancelled_store" || o.status === "returned") return s;
    return s + o.total_cents;
  }, 0);

  const totalAll = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const countOf = (st: OrderStage) => stageStatuses(st).reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);

  function tabHref(next?: OrderStage) {
    const p = new URLSearchParams();
    for (const key of ["q", "wilaya", "from", "to"] as const) {
      const v = first(qs[key]);
      if (v) p.set(key, v);
    }
    if (next) p.set("stage", next);
    const s = p.toString();
    return s ? `/dashboard/commandes?${s}` : "/dashboard/commandes";
  }

  return (
    <>
      <PageHeader
        icon="receipt"
        title="Commandes"
        subtitle={`${orders.length} affichée${orders.length > 1 ? "s" : ""} · ${formatDA(total)} en valeur (hors annulées et retours)`}
      >
        <Button href="/dashboard/commandes?status=new" icon="filter" tone="secondary" size="sm">
          À traiter
        </Button>
        <Suspense>
          <OrderExportButton />
        </Suspense>
      </PageHeader>

      <div className="mb-3">
        <LinkTabs
          items={[
            { href: tabHref(), label: "Toutes", count: totalAll, active: !status && !stage },
            ...STAGE_ORDER.map((st) => ({
              href: tabHref(st),
              label: ORDER_STAGE_LABELS[st],
              count: countOf(st),
              active: !status && stage === st,
            })),
          ]}
        />
      </div>

      <Suspense>
        <OrderFilters
          statuses={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
          wilayas={WILAYAS}
        />
      </Suspense>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-600">
            <span className="fx-num font-bold text-slate-900">{orders.length}</span> commande{orders.length > 1 ? "s" : ""}
            {status ? ` · statut « ${ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status} »` : null}
          </p>
          {orders.length >= PAGE_LIMIT ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon name="info" size={13} />
              Les {PAGE_LIMIT} plus récentes — affinez les filtres ou exportez en CSV
            </p>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Icon name="inbox" size={22} />}
            title={hasFilters ? "Aucune commande ne correspond à ces filtres" : "Aucune commande pour le moment"}
            text={
              hasFilters
                ? "Élargissez la période ou réinitialisez les filtres pour voir plus de résultats."
                : "Dès qu'un client valide un panier, sa commande apparaît ici en temps réel."
            }
            action={
              hasFilters ? (
                <Button href="/dashboard/commandes" icon="refresh">
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button href={`/s/${ctx.store.slug}`} external icon="external">
                  Voir ma boutique
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden lg:block">
              <Table
                sticky
                head={
                  <>
                    <Th>Commande</Th>
                    <Th>Client</Th>
                    <Th>Livraison</Th>
                    <Th align="right">Total</Th>
                    <Th>Statut</Th>
                    <Th align="right" />
                  </>
                }
              >
                {orders.map((o) => (
                  <tr key={o.id} className={rowCls}>
                    <Td>
                      <Link
                        href={`/dashboard/commandes/${o.id}`}
                        className="fx-num font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      <div className="mt-0.5 text-xs text-slate-400" title={formatDateTimeFr(o.created_at)}>
                        {timeAgoFr(o.created_at)}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-800">{o.full_name}</div>
                          <div className="fx-num text-xs text-slate-400">{o.phone}</div>
                        </div>
                        <ContactActions phone={o.phone} />
                      </div>
                    </Td>
                    <Td>
                      <DeliveryCell order={o} />
                    </Td>
                    <Td align="right" className="fx-num font-semibold whitespace-nowrap text-slate-900">
                      {formatDA(o.total_cents)}
                    </Td>
                    <Td>
                      <OrderQuickStatus orderId={o.id} status={o.status} canManage={canManage} orderNumber={o.order_number} />
                    </Td>
                    <Td align="right">
                      <IconButton
                        icon="chevronRight"
                        label={`Ouvrir la commande ${o.order_number}`}
                        href={`/dashboard/commandes/${o.id}`}
                        tone="ghost"
                        size={32}
                        className="rtl:-scale-x-100"
                      />
                    </Td>
                  </tr>
                ))}
              </Table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {orders.map((o) => (
                <li key={o.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/dashboard/commandes/${o.id}`} className="min-w-0">
                      <span className="fx-num block font-bold text-slate-900">{o.order_number}</span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-slate-700">{o.full_name}</span>
                    </Link>
                    <OrderQuickStatus orderId={o.id} status={o.status} canManage={canManage} orderNumber={o.order_number} />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    <span className="fx-num inline-flex items-center gap-1.5">
                      <Icon name="phone" size={13} className="text-slate-400" />
                      {o.phone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name={o.delivery_type === "office" ? "building" : "home"} size={13} className="text-slate-400" />
                      {o.wilaya}
                      {o.delivery_type === "office" && o.office ? ` · ${o.office}` : ` · ${o.commune}`}
                    </span>
                    <span className="inline-flex items-center gap-1.5" title={formatDateTimeFr(o.created_at)}>
                      <Icon name="clock" size={13} className="text-slate-400" />
                      {timeAgoFr(o.created_at)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="fx-num text-base font-extrabold text-slate-900">{formatDA(o.total_cents)}</span>
                    <span className="flex items-center gap-1">
                      <ContactActions phone={o.phone} />
                      <Button href={`/dashboard/commandes/${o.id}`} size="sm" iconRight="chevronRight">
                        Ouvrir
                      </Button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {orders.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Icon name="info" size={13} />
          Astuce : cliquez sur le statut d&apos;une commande pour le changer sans ouvrir la fiche.
        </p>
      ) : null}

    </>
  );
}
