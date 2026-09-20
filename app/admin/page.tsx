import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getPlatformStats } from "@/lib/admin/stats";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, CardHeader, Stat, Table, Th, Td, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/admin/sites/nouveau", title: "Créer un site", text: "Choisir un template et préparer un nouveau client.", icon: "+" },
  { href: "/admin/sites", title: "Mes sites", text: "Ouvrir, modifier, publier ou dépanner une boutique.", icon: "▣" },
  { href: "/admin/templates", title: "Templates", text: "Voir les modèles disponibles pour les prochains sites.", icon: "◇" },
  { href: "/preview", title: "Prévisualiser", text: "Comparer les templates sans toucher aux données clients.", icon: "◫", external: true },
];

export default async function AdminOverviewPage() {
  await getAdminContext();
  const stats = await getPlatformStats();

  return (
    <>
      <PageHeader
        title="Mon espace de production"
        subtitle="Créer un site, ouvrir une boutique existante et vérifier l'essentiel sans chercher dans dix menus."
      >
        <Link href="/admin/sites/nouveau" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
          + Nouveau site
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sites" value={stats.stores.total} hint={`${stats.stores.active} actifs · ${stats.stores.draft} brouillons`} tone="primary" />
        <Stat label="Clients" value={stats.organizations} hint={`${stats.users} comptes`} />
        <Stat label="Commandes" value={stats.orders.total} hint={`${stats.orders.delivered} livrées`} />
        <Stat label="CA boutiques" value={formatDA(stats.orders.gmv_cents)} hint="Valeur brute des commandes" tone="good" />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-bold text-slate-900">Actions rapides</h2>
        <p className="mt-1 text-sm text-slate-500">Les quatre actions que tu utiliseras le plus souvent.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-lg font-bold text-violet-700">{action.icon}</span>
              <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-violet-700">{action.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{action.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <details className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Détails techniques</h2>
            <p className="mt-1 text-xs text-slate-500">Erreurs, audit et événements système — utiles seulement quand tu dois diagnostiquer un problème.</p>
          </div>
          <span className="text-slate-400">⌄</span>
        </summary>

        <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Sites avec erreurs (7 jours)" />
            {stats.storesWithErrors.length === 0 ? (
              <p className="p-4 text-sm text-emerald-600">Aucune erreur récente.</p>
            ) : (
              <Table head={<><Th>Site</Th><Th>Erreur</Th><Th>Quand</Th></>}>
                {stats.storesWithErrors.map((e, i) => (
                  <tr key={i}>
                    <Td><Link href={`/admin/sites/${e.id}`} className="font-medium text-blue-600 hover:underline">{e.name}</Link></Td>
                    <Td className="max-w-xs"><p className="truncate text-sm text-slate-600" title={e.error}>{e.error}</p></Td>
                    <Td className="whitespace-nowrap text-slate-500" title={formatDateTimeFr(e.created_at)}>{timeAgoFr(e.created_at)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Activité récente" />
            {stats.recentAudits.length === 0 ? (
              <EmptyState icon="•" title="Aucune activité" text="Les actions sensibles apparaîtront ici." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.recentAudits.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-500">{a.action}</span>
                      {a.store_name && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{a.store_name}</span>}
                    </span>
                    <span className="whitespace-nowrap text-xs text-slate-400">{timeAgoFr(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Derniers événements système" />
            {stats.recentEvents.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">Aucun événement récent.</p>
            ) : (
              <Table head={<><Th>Niveau</Th><Th>Message</Th><Th>Site</Th><Th>Quand</Th></>}>
                {stats.recentEvents.slice(0, 10).map((e) => (
                  <tr key={e.id}>
                    <Td><Badge tone={e.level === "error" ? "red" : e.level === "warning" ? "amber" : "gray"}>{e.level}</Badge></Td>
                    <Td className="max-w-md"><p className="truncate text-sm text-slate-600" title={e.message}>{e.message}</p></Td>
                    <Td className="text-slate-500">{e.store_name ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-slate-500">{timeAgoFr(e.created_at)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      </details>
    </>
  );
}
