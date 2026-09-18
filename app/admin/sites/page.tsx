import Link from "next/link";
import { getAdminStores } from "@/lib/admin/stores";
import { getTemplate } from "@/lib/templates/defaults";
import { formatDA, timeAgoFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { SitesFilter } from "@/components/admin/sites-filter";
import { SiteActions, STATUS_LABEL } from "@/components/admin/site-actions";
import type { StoreStatus } from "@/components/admin/site-actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  ecommerce: "E-commerce",
  single_product: "Produit unique (COD)",
  portfolio: "Portfolio",
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

  return (
    <>
      <PageHeader title="Sites" subtitle={`${all.length} site(s) sur la plateforme`}>
        <Link href="/admin/sites/nouveau" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
          + Nouveau site
        </Link>
      </PageHeader>

      <SitesFilter q={q} status={status} />

      <Card className="mt-4">
        {rows.length === 0 ? (
          <EmptyState icon="🌐" title="Aucun site" text="Aucun site ne correspond à ces filtres." />
        ) : (
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
              return (
                <tr key={s.id} className="transition hover:bg-slate-50">
                  <Td>
                    <Link href={`/admin/sites/${s.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                      {s.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono">/{s.slug}</span>
                      <Badge tone={s.status === "active" ? "green" : s.status === "suspended" ? "amber" : s.status === "archived" ? "red" : "gray"}>
                        {STATUS_LABEL[s.status as StoreStatus]}
                      </Badge>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-slate-700">{s.organization_name ?? "—"}</div>
                    <div className="text-xs text-slate-400">{s.owner_email ?? "—"}</div>
                  </Td>
                  <Td>
                    <div className="text-sm text-slate-700">{TYPE_LABEL[s.website_type] ?? s.website_type}</div>
                    <div className="text-xs text-slate-400">{tpl?.name ?? s.template_key}</div>
                  </Td>
                  <Td>
                    {s.domain ? (
                      <>
                        <div className="truncate font-mono text-xs text-slate-600">{s.domain}</div>
                        <div className="text-xs text-slate-400">{s.domain_status === "verified" ? "✅ vérifié" : s.domain_status === "pending" ? "⏳ en attente" : "❌ échec"}</div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400">
                        <span className="font-mono">/{s.slug}</span> (sous-domaine)
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-slate-700">{s.orders_count} cmd.</div>
                    <div className="text-xs text-slate-400">CA {formatDA(s.gmv_cents)}</div>
                  </Td>
                  <Td>
                    <div className="text-sm text-slate-700">{s.integrations} active(s)</div>
                    {s.broken_integrations > 0 && (
                      <div className="text-xs font-medium text-red-600">⚠ {s.broken_integrations} en erreur</div>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.last_activity_at && (
                        <span className="hidden text-xs text-slate-400 xl:inline" title="Dernière activité">
                          {timeAgoFr(s.last_activity_at)}
                        </span>
                      )}
                      <SiteActions store={s} />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
