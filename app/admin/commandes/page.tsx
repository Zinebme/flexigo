import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState, inputCls, selectCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { OrderStatusBadge } from "@/components/order-status";
import { adminBtnCls } from "@/components/admin/ui";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDA, formatDateTimeFr, timeAgoFr, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; status?: string; q?: string }>;
}) {
  await getAdminContext();
  const { store: storeFilter, status, q } = await searchParams;
  const admin = getAdminSupabase();

  const [{ data: orders }, { data: stores }] = await Promise.all([
    admin.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("stores").select("id, name, slug").is("deleted_at", null),
  ]);

  const storeRows = (stores ?? []) as Array<{ id: string; name: string; slug: string }>;
  const storeMap = new Map(storeRows.map((s) => [s.id, s]));

  const all = (orders ?? []) as Array<Record<string, unknown>>;
  let rows = all;
  if (storeFilter) rows = rows.filter((r) => r.store_id === storeFilter);
  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => `${r.order_number} ${r.full_name} ${r.phone}`.toLowerCase().includes(needle));
  }

  const filtered = Boolean(storeFilter || status || q);

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="receipt"
        title="Commandes plateforme"
        subtitle={`${rows.length} commande(s) affichée(s) — limite 200, filtrez par site ou statut.`}
      >
        <Link href="/admin/sites" className={adminBtnCls("secondary", "md")}>
          <Icon name="store" size={15} />
          Sites
        </Link>
      </PageHeader>

      <Card className="p-3">
        <form className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 lg:max-w-xs lg:flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="N° commande, client ou téléphone"
              aria-label="Rechercher une commande"
              className={cn(inputCls, "ps-9")}
            />
          </div>

          <div className="relative lg:w-64">
            <Icon name="store" size={15} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
            <select
              name="store"
              defaultValue={storeFilter ?? ""}
              aria-label="Filtrer par site"
              className={cn(selectCls, "ps-9")}
            >
              <option value="">Tous les sites</option>
              {storeRows.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <select
            name="status"
            defaultValue={status ?? ""}
            aria-label="Filtrer par statut"
            className={cn(selectCls, "lg:w-52")}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button type="submit" className={adminBtnCls("primary", "md", "flex-1 lg:flex-none")}>
              <Icon name="filter" size={15} />
              Filtrer
            </button>
            {filtered ? (
              <Link href="/admin/commandes" className={adminBtnCls("secondary", "md")}>
                <Icon name="refresh" size={15} />
                Réinitialiser
              </Link>
            ) : null}
          </div>
        </form>

        {filtered ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs">
            <span className="font-semibold text-slate-400">Filtres actifs :</span>
            {storeFilter ? (
              <Badge tone="violet" size="sm">{storeMap.get(storeFilter)?.name ?? "Site sélectionné"}</Badge>
            ) : null}
            {status ? (
              <Badge tone="blue" size="sm">{ORDER_STATUS_LABELS[status as OrderStatus] ?? status}</Badge>
            ) : null}
            {q ? <Badge tone="gray" size="sm">« {q} »</Badge> : null}
          </div>
        ) : null}
      </Card>

      <Card className="mt-4 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="receipt" size={24} />}
            title="Aucune commande"
            text={
              filtered
                ? "Aucune commande ne correspond à ces filtres."
                : "Aucune commande n'a encore été passée sur la plateforme."
            }
            action={
              filtered ? (
                <Link href="/admin/commandes" className={adminBtnCls("secondary", "md")}>
                  <Icon name="refresh" size={15} />
                  Réinitialiser les filtres
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table
                head={
                  <>
                    <Th>Commande</Th>
                    <Th>Site</Th>
                    <Th>Client</Th>
                    <Th>Total</Th>
                    <Th>Statut</Th>
                    <Th>Reçue</Th>
                    <Th className="text-right" />
                  </>
                }
              >
                {rows.map((o) => {
                  const st = storeMap.get(o.store_id as string);
                  return (
                    <tr key={o.id as string} className="fx-row">
                      <Td>
                        <span className="fx-num font-bold text-slate-900">{o.order_number as string}</span>
                      </Td>
                      <Td>
                        <div className="truncate font-medium text-slate-700">{st?.name ?? "—"}</div>
                        <div className="fx-num text-xs text-slate-400">/{st?.slug ?? "—"}</div>
                      </Td>
                      <Td>
                        <div className="truncate font-medium text-slate-800">{o.full_name as string}</div>
                        <div className="fx-num mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Icon name="phone" size={11} />
                          {o.phone as string}
                          <span className="text-slate-300">·</span>
                          <Icon name="pin" size={11} />
                          {o.wilaya as string}
                        </div>
                      </Td>
                      <Td>
                        <span className="fx-num font-bold text-slate-900">{formatDA(o.total_cents as number)}</span>
                      </Td>
                      <Td>
                        <OrderStatusBadge status={o.status as string} size="sm" />
                      </Td>
                      <Td className="text-slate-500" title={formatDateTimeFr(o.created_at as string)}>
                        {timeAgoFr(o.created_at as string)}
                      </Td>
                      <Td className="text-right">
                        <Link href={`/admin/sites/${o.store_id as string}`} className={adminBtnCls("secondary", "sm")}>
                          <Icon name="store" size={13} />
                          Site
                        </Link>
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            </div>

            <ul className="divide-y divide-slate-100 lg:hidden">
              {rows.map((o) => {
                const st = storeMap.get(o.store_id as string);
                return (
                  <li key={o.id as string} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="fx-num text-sm font-bold text-slate-900">{o.order_number as string}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {o.full_name as string} · <span className="fx-num">{o.phone as string}</span>
                        </div>
                      </div>
                      <OrderStatusBadge status={o.status as string} size="sm" short />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{st?.name ?? "—"}</span>
                        <span className="fx-num ms-1 text-slate-400">/{st?.slug ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="fx-num text-sm font-bold text-slate-900">{formatDA(o.total_cents as number)}</span>
                        <Link
                          href={`/admin/sites/${o.store_id as string}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
                          title="Ouvrir le site"
                        >
                          <Icon name="chevronRight" size={15} />
                        </Link>
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-400" title={formatDateTimeFr(o.created_at as string)}>
                      Reçue {timeAgoFr(o.created_at as string)} · {o.wilaya as string}
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
