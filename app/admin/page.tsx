import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getPlatformStats } from "@/lib/admin/stats";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, CardHeader, Stat, Table, Th, Td, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await getAdminContext();
  const stats = await getPlatformStats();

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        subtitle="État de la plateforme en temps réel — données recalculées côté serveur."
      >
        <Link href="/admin/sites/nouveau" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
          + Créer un site
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sites" value={stats.stores.total} hint={`${stats.stores.active} actifs · ${stats.stores.draft} brouillons · ${stats.stores.suspended} suspendus`} tone="primary" />
        <Stat label="Clients (organisations)" value={stats.organizations} hint={`${stats.users} comptes utilisateurs`} />
        <Stat label="Commandes (tous sites)" value={stats.orders.total} hint={`${stats.orders.delivered} livrées`} />
        <Stat
          label="CA global (tous sites)"
          value={formatDA(stats.orders.gmv_cents)}
          hint="Valeur brute des commandes clients — ce n'est pas un revenu de la plateforme"
          tone="good"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sites avec erreurs (7 derniers jours)" subtitle="Événements d'erreur journalisés par site" />
          {stats.storesWithErrors.length === 0 ? (
            <p className="p-4 text-sm text-emerald-600">✅ Aucune erreur récente.</p>
          ) : (
            <Table head={<><Th>Site</Th><Th>Erreur</Th><Th>Quand</Th></>}>
              {stats.storesWithErrors.map((e, i) => (
                <tr key={i} className="transition hover:bg-slate-50">
                  <Td>
                    <Link href={`/admin/sites/${e.id}`} className="font-medium text-blue-600 hover:underline">{e.name}</Link>
                    <div className="text-xs text-slate-400">/{e.slug}</div>
                  </Td>
                  <Td className="max-w-xs">
                    <p className="truncate text-sm text-slate-600" title={e.error}>{e.error}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-slate-500" title={formatDateTimeFr(e.created_at)}>{timeAgoFr(e.created_at)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Activité récente (audit)" />
          {stats.recentAudits.length === 0 ? (
            <EmptyState icon="📜" title="Aucune activité" text="Les actions sensibles des marchands et de la plateforme apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recentAudits.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-slate-500">{a.action}</span>
                    {a.store_name && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{a.store_name}</span>}
                    {a.actor_email && <span className="ml-2 text-xs text-slate-400">par {a.actor_email}</span>}
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-400" title={formatDateTimeFr(a.created_at)}>{timeAgoFr(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Derniers événements système" subtitle="Journal interne (visible uniquement par l'administrateur)" />
          {stats.recentEvents.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Aucun événement récent.</p>
          ) : (
            <Table head={<><Th>Niveau</Th><Th>Catégorie</Th><Th>Message</Th><Th>Site</Th><Th>Quand</Th></>}>
              {stats.recentEvents.map((e) => (
                <tr key={e.id} className="transition hover:bg-slate-50">
                  <Td>
                    <Badge tone={e.level === "error" ? "red" : e.level === "warning" ? "amber" : "gray"}>{e.level}</Badge>
                  </Td>
                  <Td className="text-slate-600">{e.category}</Td>
                  <Td className="max-w-md">
                    <p className="truncate text-sm text-slate-600" title={e.message}>{e.message}</p>
                  </Td>
                  <Td className="text-slate-500">{e.store_name ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-slate-500" title={formatDateTimeFr(e.created_at)}>{timeAgoFr(e.created_at)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
