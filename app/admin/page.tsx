import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getPlatformStats } from "@/lib/admin/stats";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, CardHeader, Stat, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/ui/icons";
import { adminBtnCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS: Array<{ href: string; title: string; text: string; icon: IconName; external?: boolean }> = [
  { href: "/admin/sites/nouveau", title: "Créer un site", text: "Choisir un template et préparer un nouveau client.", icon: "plus" },
  { href: "/admin/sites", title: "Mes sites", text: "Ouvrir, modifier, publier ou dépanner une boutique.", icon: "store" },
  { href: "/admin/templates", title: "Templates", text: "Voir les modèles disponibles pour les prochains sites.", icon: "palette" },
  { href: "/preview", title: "Prévisualiser", text: "Comparer les templates sans toucher aux données clients.", icon: "eye", external: true },
];

export default async function AdminOverviewPage() {
  await getAdminContext();
  const stats = await getPlatformStats();
  const errorCount = stats.storesWithErrors.length;

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="shield"
        title="Mon espace de production"
        subtitle="Créer un site, ouvrir une boutique existante et vérifier l'essentiel sans chercher dans dix menus."
      >
        <Link href="/admin/sites/nouveau" className={adminBtnCls("primary", "md")}>
          <Icon name="plus" size={15} />
          Nouveau site
        </Link>
        <Link href="/admin/sites" className={adminBtnCls("secondary", "md")}>
          <Icon name="store" size={15} />
          Voir les sites
        </Link>
      </PageHeader>

      {errorCount > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Icon name="alert" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-800">
              {errorCount} site{errorCount > 1 ? "s" : ""} avec des erreurs sur les 7 derniers jours
            </p>
            <p className="mt-0.5 text-xs text-red-700/80">Ouvrez le détail technique ci-dessous ou la page Santé système pour diagnostiquer.</p>
          </div>
          <Link href="/admin/sante" className={adminBtnCls("danger", "sm")}>
            Santé système
            <Icon name="arrowRight" size={13} />
          </Link>
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Icon name="checkCircle" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-800">Aucune erreur signalée sur les 7 derniers jours</p>
            <p className="mt-0.5 text-xs text-emerald-700/80">Les événements système restent consultables dans les détails techniques.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sites" value={stats.stores.total} hint={`${stats.stores.active} actifs · ${stats.stores.draft} brouillons`} tone="primary" icon="store" href="/admin/sites" />
        <Stat label="Clients" value={stats.organizations} hint={`${stats.users} comptes`} icon="users" href="/admin/clients" />
        <Stat label="Commandes" value={stats.orders.total} hint={`${stats.orders.delivered} livrées`} icon="receipt" href="/admin/commandes" />
        <Stat label="CA boutiques" value={formatDA(stats.orders.gmv_cents)} hint="Valeur brute des commandes" tone="good" icon="cash" />
      </div>

      <section className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Actions rapides</h2>
            <p className="mt-1 text-sm text-slate-500">Les quatre actions que vous utiliserez le plus souvent.</p>
          </div>
          <Link href="/admin/sites" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900">
            Tous les sites
            <Icon name="chevronRight" size={13} />
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100 transition group-hover:bg-violet-600 group-hover:text-white">
                <Icon name={action.icon} size={17} />
              </span>
              <h3 className="mt-4 flex items-center gap-1.5 text-sm font-bold text-slate-900 group-hover:text-violet-700">
                {action.title}
                {action.external ? <Icon name="external" size={12} className="text-slate-400" /> : null}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{action.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <details className="group mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon name="sliders" size={16} />
            </span>
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
                Détails techniques
                {errorCount > 0 ? <Badge tone="red" size="sm">{errorCount} erreur(s)</Badge> : null}
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Erreurs, audit et événements système — utiles seulement pour diagnostiquer un problème.
              </p>
            </div>
          </div>
          <Icon name="chevronDown" size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
        </summary>

        <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-2">
          <Card>
            <CardHeader icon="alert" title="Sites avec erreurs (7 jours)">
              <Badge tone={errorCount > 0 ? "red" : "green"} size="sm">{errorCount}</Badge>
            </CardHeader>
            {errorCount === 0 ? (
              <EmptyState compact icon={<Icon name="checkCircle" size={22} />} title="Aucune erreur récente" text="Rien à diagnostiquer pour l'instant." />
            ) : (
              <Table head={<><Th>Site</Th><Th>Erreur</Th><Th>Quand</Th></>}>
                {stats.storesWithErrors.map((e, i) => (
                  <tr key={`${e.id}-${i}`} className="fx-row">
                    <Td>
                      <Link href={`/admin/sites/${e.id}`} className="font-semibold text-slate-900 transition hover:text-violet-700">
                        {e.name}
                      </Link>
                    </Td>
                    <Td className="max-w-xs">
                      <p className="truncate text-sm text-slate-600" title={e.error}>{e.error}</p>
                    </Td>
                    <Td className="text-slate-500 whitespace-nowrap" title={formatDateTimeFr(e.created_at)}>{timeAgoFr(e.created_at)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader icon="history" title="Activité récente" subtitle="Actions sensibles journalisées">
              <Link href="/admin/journal" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900">
                Journal
                <Icon name="chevronRight" size={12} />
              </Link>
            </CardHeader>
            {stats.recentAudits.length === 0 ? (
              <EmptyState compact icon={<Icon name="history" size={22} />} title="Aucune activité" text="Les actions sensibles apparaîtront ici." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.recentAudits.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon name="shield" size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="fx-num block truncate text-xs font-semibold text-slate-700">{a.action}</span>
                      {a.store_name ? <span className="block truncate text-xs text-slate-400">{a.store_name}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{timeAgoFr(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader icon="zap" title="Derniers événements système">
              <Link href="/admin/sante" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900">
                Santé système
                <Icon name="chevronRight" size={12} />
              </Link>
            </CardHeader>
            {stats.recentEvents.length === 0 ? (
              <EmptyState compact icon={<Icon name="zap" size={22} />} title="Aucun événement récent" />
            ) : (
              <Table head={<><Th>Niveau</Th><Th>Message</Th><Th>Site</Th><Th>Quand</Th></>}>
                {stats.recentEvents.slice(0, 10).map((e) => (
                  <tr key={e.id} className="fx-row">
                    <Td>
                      <Badge
                        tone={e.level === "error" ? "red" : e.level === "warning" ? "amber" : "gray"}
                        dot
                        size="sm"
                      >
                        {e.level}
                      </Badge>
                    </Td>
                    <Td className="max-w-md">
                      <p className="truncate text-sm text-slate-600" title={e.message}>{e.message}</p>
                    </Td>
                    <Td className="text-slate-500">{e.store_name ?? "—"}</Td>
                    <Td className="text-slate-500 whitespace-nowrap">{timeAgoFr(e.created_at)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      </details>

      <p className="mt-6 text-center text-xs text-slate-400">
        Toutes les actions de cette zone sont journalisées et attribuées à votre compte.
      </p>
    </>
  );
}
