import Link from "next/link";
import { getAdminStores } from "@/lib/admin/stores";
import { getTemplate } from "@/lib/templates/defaults";
import { formatDA, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { adminBtnCls } from "@/components/admin/button-class";
import { SitesFilter } from "@/components/admin/sites-filter";
import { SiteActions, STATUS_LABEL, STATUS_TONE } from "@/components/admin/site-actions";
import type { StoreStatus } from "@/components/admin/site-actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  ecommerce: "E-commerce",
  single_product: "Produit unique (COD)",
  portfolio: "Portfolio",
};

const DOMAIN_STATUS: Record<string, { label: string; tone: string; icon: "checkCircle" | "clock" | "alert" }> = {
  verified: { label: "vérifié", tone: "green", icon: "checkCircle" },
  pending: { label: "en attente", tone: "amber", icon: "clock" },
  failed: { label: "échec", tone: "red", icon: "alert" },
};

export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const all = await getAdminStores();

  const rows = all.filter((s) => {
    if (status && s.status !== status) return false;
    if (q) {
      const hay = `${s.name} ${s.slug} ${s.owner_email ?? ""} ${s.organization_name ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const counts: Record<string, number> = { "": all.length };
  for (const s of all) counts[s.status] = (counts[s.status] ?? 0) + 1;
  const brokenTotal = all.filter((s) => s.broken_integrations > 0).length;

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="store"
        title="Sites"
        subtitle={`${all.length} site(s) sur la plateforme${brokenTotal > 0 ? ` · ${brokenTotal} avec intégration(s) en erreur` : ""}`}
      >
        <Link href="/admin/sites/nouveau" className={adminBtnCls("primary", "md")}>
          <Icon name="plus" size={15} />
          Nouveau site
        </Link>
      </PageHeader>

      <SitesFilter q={q} status={status} counts={counts} />

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            {rows.length === all.length
              ? `${all.length} site(s)`
              : `${rows.length} résultat(s) sur ${all.length}`}
            {q ? <span className="ms-1 font-normal text-slate-400">pour « {q} »</span> : null}
          </p>
          {brokenTotal > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <Icon name="alert" size={13} />
              {brokenTotal} site(s) à surveiller
            </span>
          ) : null}
        </div>

        {rows.length === 0 ? (
          all.length === 0 ? (
            <EmptyState
              icon={<Icon name="store" size={24} />}
              title="Aucun site pour l'instant"
              text="Créez le premier site client : choisissez un template, un slug et un propriétaire."
              action={
                <Link href="/admin/sites/nouveau" className={adminBtnCls("primary", "md")}>
                  <Icon name="plus" size={15} />
                  Créer un site
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={<Icon name="search" size={24} />}
              title="Aucun site ne correspond"
              text="Modifiez la recherche ou réinitialisez les filtres pour voir tous les sites."
              action={
                <Link href="/admin/sites" className={adminBtnCls("secondary", "md")}>
                  <Icon name="refresh" size={15} />
                  Réinitialiser les filtres
                </Link>
              }
            />
          )
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <Table
                head={
                  <>
                    <Th>Site</Th>
                    <Th>Client</Th>
                    <Th>Type / Template</Th>
                    <Th>Domaine</Th>
                    <Th>Commandes / CA</Th>
                    <Th>Intégrations</Th>
                    <Th className="text-right">Actions</Th>
                  </>
                }
              >
                {rows.map((s) => {
                  const tpl = getTemplate(s.template_key);
                  const domain = s.domain_status ? DOMAIN_STATUS[s.domain_status] ?? null : null;
                  return (
                    <tr key={s.id} className="fx-row">
                      <Td>
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-700 ring-1 ring-inset ring-violet-100">
                            {s.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <Link href={`/admin/sites/${s.id}`} className="block truncate font-semibold text-slate-900 transition hover:text-violet-700">
                              {s.name}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                              <span className="fx-num">/{s.slug}</span>
                              <Badge tone={STATUS_TONE[s.status as StoreStatus]} dot size="sm">
                                {STATUS_LABEL[s.status as StoreStatus]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="truncate text-sm font-medium text-slate-700">{s.organization_name ?? "—"}</div>
                        {s.owner_email ? (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <Icon name="mail" size={11} />
                            <span className="truncate">{s.owner_email}</span>
                          </div>
                        ) : (
                          <div className="mt-0.5 text-xs text-slate-400">Aucun propriétaire</div>
                        )}
                      </Td>
                      <Td>
                        <div className="text-sm text-slate-700">{TYPE_LABEL[s.website_type] ?? s.website_type}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Icon name="palette" size={11} />
                          <span className="truncate">{tpl?.name ?? s.template_key}</span>
                        </div>
                      </Td>
                      <Td>
                        {s.domain ? (
                          <>
                            <div className="fx-num truncate text-xs font-medium text-slate-700">{s.domain}</div>
                            {domain ? (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <Icon name={domain.icon} size={11} className={domain.tone === "green" ? "text-emerald-500" : domain.tone === "amber" ? "text-amber-500" : "text-red-500"} />
                                {domain.label}
                              </div>
                            ) : (
                              <div className="mt-0.5 text-xs text-slate-400">{s.domain_status ?? "—"}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-slate-400">
                            <span className="fx-num">/{s.slug}</span> (sous-domaine)
                          </div>
                        )}
                      </Td>
                      <Td>
                        <div className="fx-num text-sm font-semibold text-slate-800">{s.orders_count} cmd.</div>
                        <div className="fx-num mt-0.5 text-xs text-slate-400">CA {formatDA(s.gmv_cents)}</div>
                      </Td>
                      <Td>
                        <div className="text-sm text-slate-700">
                          <span className="fx-num font-semibold">{s.integrations}</span> active(s)
                        </div>
                        {s.broken_integrations > 0 ? (
                          <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                            <Icon name="alert" size={11} />
                            {s.broken_integrations} en erreur
                          </div>
                        ) : null}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.last_activity_at ? (
                            <span className="hidden items-center gap-1 text-xs text-slate-400 xl:inline-flex" title="Dernière activité">
                              <Icon name="clock" size={11} />
                              {timeAgoFr(s.last_activity_at)}
                            </span>
                          ) : null}
                          <Link
                            href={`/admin/sites/${s.id}`}
                            className={adminBtnCls("secondary", "sm")}
                          >
                            <Icon name="pencil" size={13} />
                            Modifier
                          </Link>
                          <SiteActions store={s} />
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {rows.map((s) => {
                const tpl = getTemplate(s.template_key);
                const domain = s.domain_status ? DOMAIN_STATUS[s.domain_status] ?? null : null;
                return (
                  <li key={s.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-700 ring-1 ring-inset ring-violet-100">
                        {s.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/sites/${s.id}`} className="block truncate text-sm font-bold text-slate-900">
                          {s.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone={STATUS_TONE[s.status as StoreStatus]} dot size="sm">
                            {STATUS_LABEL[s.status as StoreStatus]}
                          </Badge>
                          <span className="fx-num text-xs text-slate-400">/{s.slug}</span>
                        </div>
                      </div>
                      <SiteActions store={s} />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <dt className="text-slate-400">Client</dt>
                        <dd className="mt-0.5 truncate font-semibold text-slate-700">{s.organization_name ?? "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <dt className="text-slate-400">Commandes</dt>
                        <dd className="fx-num mt-0.5 font-semibold text-slate-700">{s.orders_count} · {formatDA(s.gmv_cents)}</dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <dt className="text-slate-400">Domaine</dt>
                        <dd className="fx-num mt-0.5 truncate font-medium text-slate-700">
                          {s.domain ?? `/${s.slug}`}
                          {domain ? <span className="ms-1 text-slate-400">({domain.label})</span> : null}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <dt className="text-slate-400">Intégrations</dt>
                        <dd className="mt-0.5 font-medium text-slate-700">
                          <span className="fx-num">{s.integrations}</span> active(s)
                          {s.broken_integrations > 0 ? (
                            <span className="ms-1 font-semibold text-red-600">· {s.broken_integrations} KO</span>
                          ) : null}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{tpl?.name ?? s.template_key}</span>
                      <Link href={`/admin/sites/${s.id}`} className={adminBtnCls("secondary", "sm")}>
                        <Icon name="pencil" size={13} />
                        Modifier
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
