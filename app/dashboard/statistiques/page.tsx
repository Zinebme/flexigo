import { getMerchantContext } from "@/lib/auth/merchant-context";
import { can } from "@/lib/types";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDA, formatDateFr } from "@/lib/utils";
import { getAnalytics } from "@/lib/dashboard/analytics";
import { PageHeader, Card, CardHeader, Stat, Table, Th, Td, EmptyState, Badge } from "@/components/ui";
import { BarChart } from "@/components/dashboard/bar-chart";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const ctx = await getMerchantContext();
  if (!can(ctx.role, "stats.view")) {
    return (
      <>
        <PageHeader title="Statistiques" />
        <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de voir les statistiques." />
      </>
    );
  }

  const a = await getAnalytics(ctx.store.id);

  return (
    <>
      <PageHeader title="Statistiques" subtitle="Performance de votre site — données recalculées côté serveur." />

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        💡 Le <span className="font-semibold">CA (GMV)</span> ci-dessous est le montant total de vos commandes clients.
        Ce n'est <span className="font-semibold">pas</span> un revenu de la plateforme.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="CA total (non annulé)" value={formatDA(a.gmv_cents)} hint="Brut, toutes commandes" tone="primary" />
        <Stat label="CA livré" value={formatDA(a.delivered_cents)} hint={`${a.delivered_count} commandes livrées`} tone="good" />
        <Stat label="Commandes (30 j)" value={a.orders_30d} hint={`${a.orders_total} au total`} />
        <Stat label="Taux de livraison" value={`${Math.round(a.delivered_ratio * 100)} %`} hint="Livrées / total" tone={a.delivered_ratio >= 0.6 ? "good" : "warn"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Commandes par jour (30 jours)" />
          <BarChart data={a.daily.map((d) => ({ label: formatDateFr(d.date).slice(0, 5), value: d.orders }))} />
        </Card>
        <Card>
          <CardHeader title="Valeur des commandes par jour (30 jours)" />
          <BarChart data={a.daily.map((d) => ({ label: formatDateFr(d.date).slice(0, 5), value: Math.round(d.gmv_cents / 100) }))} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Commandes par statut" />
          <Table head={<><Th>Statut</Th><Th>Nombre</Th><Th>Valeur</Th></>}>
            {a.byStatus.map((s) => (
              <tr key={s.status}>
                <Td className="font-medium text-slate-800">{ORDER_STATUS_LABELS[s.status as OrderStatus] ?? s.status}</Td>
                <Td><Badge tone="gray">{s.count}</Badge></Td>
                <Td className="text-slate-600">{formatDA(s.gmv_cents)}</Td>
              </tr>
            ))}
            {a.byStatus.length === 0 && (
              <tr><Td colSpan={3} className="text-slate-400">Aucune commande.</Td></tr>
            )}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Meilleurs produits (revenu)" />
          {a.topProducts.length === 0 ? (
            <EmptyState icon="📊" title="Pas encore de données" text="Les meilleurs produits apparaîtront après vos premières ventes." />
          ) : (
            <Table head={<><Th>Produit</Th><Th>Vendus</Th><Th>Revenu</Th></>}>
              {a.topProducts.map((p, i) => (
                <tr key={i}>
                  <Td className="font-medium text-slate-800">{p.name}</Td>
                  <Td>{p.units}</Td>
                  <Td className="font-semibold text-slate-900">{formatDA(p.revenue_cents)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Meilleures wilayas (revenu)" />
          {a.topWilayas.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Aucune donnée.</p>
          ) : (
            <Table head={<><Th>Wilaya</Th><Th>Commandes</Th><Th>CA</Th></>}>
              {a.topWilayas.map((w) => (
                <tr key={w.code}>
                  <Td className="font-medium text-slate-800">{w.name}</Td>
                  <Td>{w.orders}</Td>
                  <Td className="font-semibold text-slate-900">{formatDA(w.gmv_cents)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Stock faible / rupture" />
          {a.lowStock.length === 0 ? (
            <p className="p-4 text-sm text-emerald-600">✅ Aucun produit en stock faible.</p>
          ) : (
            <Table head={<><Th>Produit</Th><Th>Stock</Th></>}>
              {a.lowStock.map((p, i) => (
                <tr key={i}>
                  <Td className="font-medium text-slate-800">{p.name}</Td>
                  <Td><Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Rupture" : p.stock}</Badge></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
