import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, CardHeader, Stat, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { BarChart } from "@/components/dashboard/bar-chart";

const STATUS_TONE: Record<string, string> = {
  new: "blue",
  to_confirm: "amber",
  confirmed: "blue",
  preparation: "purple",
  shipped: "purple",
  in_transit: "purple",
  at_office: "amber",
  out_for_delivery: "amber",
  delivered: "green",
  returned: "red",
  delivery_failed: "red",
  no_answer: "gray",
  postponed: "gray",
  cancelled_customer: "red",
  cancelled_store: "red",
};

export default async function DashboardHome() {
  const ctx = await getMerchantContext();
  const s = await getDashboardStats(ctx.store.id);

  return (
    <>
      <PageHeader title={`Bonjour 👋`} subtitle={`Vue d'ensemble de ${ctx.store.name}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Nouvelles commandes" value={s.newOrders} hint="à traiter" tone={s.newOrders > 0 ? "primary" : "default"} />
        <Stat label="Commandes en cours" value={s.activeOrders} hint="en préparation / transit" />
        <Stat label="CA cumulé (livrées & en cours)" value={s.gmvLabel} hint={`${s.delivered30d} livrées sur 30 j`} tone="good" />
        <Stat
          label="Alertes stock"
          value={s.lowStockCount + s.outOfStockCount}
          hint={`${s.outOfStockCount} rupture · ${s.lowStockCount} faible`}
          tone={s.outOfStockCount + s.lowStockCount > 0 ? "warn" : "good"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Chiffre d'affaires — 14 derniers jours" subtitle="Commandes non annulées (DA)" />
          <div className="p-5">
            <BarChart data={s.daily.map((d) => ({ label: d.label, value: d.total, title: `${d.label} — ${formatDA(d.total)} (${d.count} cmd)` }))} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Par statut" subtitle={`${s.productsCount} produits · ${s.customersCount} clients`} />
          <div className="space-y-2 p-5">
            {s.byStatus.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune commande pour le moment.</p>
            ) : (
              s.byStatus.map((b) => (
                <div key={b.status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{b.label}</span>
                  <Badge tone={STATUS_TONE[b.status] ?? "gray"}>{b.count}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Dernières commandes" subtitle="Les 8 commandes les plus récentes">
          <Link href="/dashboard/commandes" className="text-sm font-semibold text-blue-600 hover:underline">
            Tout voir →
          </Link>
        </CardHeader>
        {s.recentOrders.length === 0 ? (
          <EmptyState icon="📦" title="Aucune commande" text="Vos commandes clients apparaîtront ici." />
        ) : (
          <Table head={<><Th>N°</Th><Th>Client</Th><Th>Wilaya</Th><Th>Total</Th><Th>Statut</Th><Th>Reçue</Th><Th /></>}>
            {s.recentOrders.map((o) => (
              <tr key={o.id} className="transition hover:bg-slate-50">
                <Td className="font-semibold text-slate-900">{o.order_number}</Td>
                <Td>
                  <div className="font-medium text-slate-800">{o.full_name}</div>
                  <div className="text-xs text-slate-400">{o.phone}</div>
                </Td>
                <Td className="text-slate-600">{o.wilaya}</Td>
                <Td className="font-semibold text-slate-900">{formatDA(o.total_cents)}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[o.status] ?? "gray"}>{ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}</Badge>
                </Td>
                <Td className="text-slate-500" title={formatDateTimeFr(o.created_at)}>{timeAgoFr(o.created_at)}</Td>
                <Td>
                  <Link href={`/dashboard/commandes/${o.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                    Ouvrir
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
