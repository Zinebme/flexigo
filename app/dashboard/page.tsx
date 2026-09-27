import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { can } from "@/lib/types";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, CardHeader, CardFooter, Stat, Table, Th, Td, EmptyState, Alert, Button, rowCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { BarChart } from "@/components/dashboard/bar-chart";
import { ORDER_STATUS_TONE, OrderStatusBadge } from "@/components/order-status";

/** Static colour map — Tailwind must see full class names at build time. */
const BAR_COLOR: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  amber: "bg-amber-400",
  green: "bg-emerald-500",
  red: "bg-red-500",
  gray: "bg-slate-300",
};

export default async function DashboardHome() {
  const ctx = await getMerchantContext();
  const s = await getDashboardStats(ctx.store.id);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const total14 = s.daily.reduce((sum, d) => sum + d.total, 0);
  const orders14 = s.daily.reduce((sum, d) => sum + d.count, 0);
  const maxStatus = Math.max(1, ...s.byStatus.map((b) => b.count));
  const stockAlerts = s.lowStockCount + s.outOfStockCount;
  const canManageProducts = can(ctx.role, "products.manage");

  return (
    <>
      <PageHeader
        eyebrow={today}
        title="Bonjour 👋"
        subtitle={`Vue d'ensemble de ${ctx.store.name} — ${s.productsCount} produits · ${s.customersCount} clients`}
      >
        <Button href={`/s/${ctx.store.slug}`} external icon="external" tone="secondary">
          Voir la boutique
        </Button>
        {canManageProducts ? (
          <Button href="/dashboard/produits/nouveau" icon="plus" tone="secondary">
            Nouveau produit
          </Button>
        ) : null}
        <Button href="/dashboard/commandes" icon="receipt" tone="primary">
          Commandes
        </Button>
      </PageHeader>

      {s.newOrders > 0 ? (
        <Alert
          tone="info"
          className="mb-4"
          title={`${s.newOrders} nouvelle${s.newOrders > 1 ? "s" : ""} commande${s.newOrders > 1 ? "s" : ""} à traiter`}
          action={
            <Link
              href="/dashboard/commandes?status=new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Traiter maintenant
              <Icon name="arrowRight" size={13} />
            </Link>
          }
        >
          Confirmez-les rapidement : le taux de livraison dépend de la réactivité sur les premières heures.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Nouvelles commandes"
          value={s.newOrders}
          hint="à traiter"
          icon="receipt"
          tone={s.newOrders > 0 ? "primary" : "default"}
          href="/dashboard/commandes?status=new"
        />
        <Stat
          label="Commandes en cours"
          value={s.activeOrders}
          hint="en préparation / transit"
          icon="truck"
          href="/dashboard/commandes"
        />
        <Stat
          label="CA cumulé"
          value={s.gmvLabel}
          hint={`${s.delivered30d} livrées sur 30 j · hors annulées`}
          icon="wallet"
          tone="good"
          href="/dashboard/statistiques"
        />
        <Stat
          label="Alertes stock"
          value={stockAlerts}
          hint={`${s.outOfStockCount} rupture · ${s.lowStockCount} faible`}
          icon="package"
          tone={stockAlerts > 0 ? "warn" : "good"}
          href="/dashboard/inventaire"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Chiffre d'affaires — 14 derniers jours"
            subtitle="Commandes non annulées (DA)"
            icon="chart"
          >
            <Link href="/dashboard/statistiques" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
              Statistiques
              <Icon name="arrowRight" size={14} />
            </Link>
          </CardHeader>
          <div className="px-5 py-5">
            {orders14 === 0 ? (
              <EmptyState
                compact
                icon={<Icon name="chart" size={22} />}
                title="Pas encore de ventes sur 14 jours"
                text="Vos revenus quotidiens apparaîtront dès la première commande."
              />
            ) : (
              <BarChart
                data={s.daily.map((d) => ({
                  label: d.label,
                  value: d.total,
                  title: `${d.label} — ${formatDA(d.total)} (${d.count} cmd)`,
                }))}
                formatValue={(v) => formatDA(v)}
              />
            )}
          </div>
          <CardFooter>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Icon name="cash" size={14} className="text-slate-400" />
              Total 14 j
              <span className="fx-num text-sm font-bold text-slate-900">{formatDA(total14)}</span>
            </div>
            <div className="text-xs text-slate-400">
              {orders14} commande{orders14 > 1 ? "s" : ""} · moyenne {formatDA(Math.round(total14 / 14))}/jour
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader title="Répartition par statut" subtitle="Cliquez pour filtrer les commandes" icon="filter" />
          {s.byStatus.length === 0 ? (
            <EmptyState compact icon={<Icon name="inbox" size={22} />} title="Aucune commande" text="Vos commandes clients apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.byStatus.map((b) => {
                const tone = ORDER_STATUS_TONE[b.status] ?? "gray";
                return (
                  <li key={b.status}>
                    <Link
                      href={`/dashboard/commandes?status=${b.status}`}
                      className="group flex items-center gap-3 px-5 py-2.5 transition hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-slate-700 group-hover:text-slate-900">{b.label}</span>
                          <span className="fx-num shrink-0 text-sm font-bold text-slate-900">{b.count}</span>
                        </span>
                        <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <span
                            className={`block h-full rounded-full ${BAR_COLOR[tone] ?? BAR_COLOR.gray}`}
                            style={{ width: `${Math.max(4, (b.count / maxStatus) * 100)}%` }}
                          />
                        </span>
                      </span>
                      <Icon name="chevronRight" size={15} className="shrink-0 text-slate-300 transition group-hover:text-slate-500 rtl:rotate-180" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Dernières commandes" subtitle="Les 8 commandes les plus récentes" icon="receipt">
          <Link href="/dashboard/commandes" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
            Tout voir
            <Icon name="arrowRight" size={14} />
          </Link>
        </CardHeader>
        {s.recentOrders.length === 0 ? (
          <EmptyState
            icon={<Icon name="inbox" size={22} />}
            title="Aucune commande"
            text="Vos commandes clients apparaîtront ici dès la première vente."
            action={
              <Button href={`/s/${ctx.store.slug}`} external icon="external">
                Partager ma boutique
              </Button>
            }
          />
        ) : (
          <Table
            head={
              <>
                <Th>N°</Th>
                <Th>Client</Th>
                <Th className="hidden md:table-cell">Wilaya</Th>
                <Th align="right">Total</Th>
                <Th>Statut</Th>
                <Th className="hidden sm:table-cell">Reçue</Th>
                <Th />
              </>
            }
          >
            {s.recentOrders.map((o) => (
              <tr key={o.id} className={rowCls}>
                <Td>
                  <Link href={`/dashboard/commandes/${o.id}`} className="fx-num font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                    {o.order_number}
                  </Link>
                </Td>
                <Td>
                  <div className="truncate font-medium text-slate-800">{o.full_name}</div>
                  <div className="fx-num text-xs text-slate-400">{o.phone}</div>
                </Td>
                <Td className="hidden text-slate-600 md:table-cell">{o.wilaya}</Td>
                <Td align="right" className="fx-num font-semibold text-slate-900">
                  {formatDA(o.total_cents)}
                </Td>
                <Td>
                  <OrderStatusBadge status={o.status} size="sm" />
                </Td>
                <Td className="hidden text-slate-500 sm:table-cell" title={formatDateTimeFr(o.created_at)}>
                  {timeAgoFr(o.created_at)}
                </Td>
                <Td align="right">
                  <Link
                    href={`/dashboard/commandes/${o.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Ouvrir
                    <Icon name="chevronRight" size={14} className="rtl:rotate-180" />
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {stockAlerts > 0 ? (
        <Card className="mt-6">
          <CardHeader
            title="Stock à surveiller"
            subtitle={`${s.outOfStockCount} produit(s) en rupture · ${s.lowStockCount} sous le seuil d'alerte`}
            icon="package"
          >
            <Button href="/dashboard/inventaire" icon="clipboard" size="sm">
              Gérer l&apos;inventaire
            </Button>
          </CardHeader>
          <div className="px-5 py-4">
            <Alert tone={s.outOfStockCount > 0 ? "warning" : "neutral"} icon="alert">
              Un produit en rupture ne peut plus être commandé sur votre boutique. Ajustez le stock ou désactivez
              temporairement la fiche.
            </Alert>
          </div>
        </Card>
      ) : null}
    </>
  );
}
