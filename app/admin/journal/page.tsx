import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState, inputCls, selectCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { adminBtnCls } from "@/components/admin/ui";
import { formatDateTimeFr, timeAgoFr, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Tone per audit action (presentation only — the action string is unchanged). */
function actionTone(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("remove") || a.includes("suspend")) return "red";
  if (a.includes("create") || a.includes("publish") || a.includes("activate")) return "green";
  if (a.includes("update") || a.includes("status") || a.includes("patch")) return "blue";
  if (a.includes("support") || a.includes("impersonat")) return "purple";
  return "gray";
}

export default async function AdminJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; store?: string; q?: string }>;
}) {
  await getAdminContext();
  const { action, store, q } = await searchParams;
  const admin = getAdminSupabase();

  const [{ data: audits }, { data: stores }, { data: profiles }] = await Promise.all([
    admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("stores").select("id, name, slug").is("deleted_at", null),
    admin.from("profiles").select("id, email").limit(200),
  ]);

  const storeRows = (stores ?? []) as Array<{ id: string; name: string; slug: string }>;
  const storeMap = new Map(storeRows.map((s) => [s.id, s]));
  const profileMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((p) => [p.id, p.email]));

  const all = (audits ?? []) as Array<Record<string, unknown>>;
  let rows = all;
  if (action) rows = rows.filter((r) => (r.action as string).includes(action));
  if (store) rows = rows.filter((r) => r.store_id === store);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => `${r.action} ${r.entity} ${r.entity_id}`.toLowerCase().includes(needle));
  }

  const filtered = Boolean(action || store || q);

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="history"
        title="Journal / Audit"
        subtitle={`${rows.length} entrée(s) sur ${all.length} (limite 200) — actor, tenant, action, entité, before/after, support_session_id.`}
      >
        <Link href="/admin/support" className={adminBtnCls("secondary", "md")}>
          <Icon name="lifeBuoy" size={15} />
          Sessions support
        </Link>
      </PageHeader>

      <Card className="p-3">
        <form className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative lg:w-64">
            <Icon name="store" size={15} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
            <select name="store" defaultValue={store ?? ""} aria-label="Filtrer par site" className={cn(selectCls, "ps-9")}>
              <option value="">Tous les sites</option>
              {storeRows.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-0 lg:w-56">
            <Icon name="zap" size={15} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
            <input
              name="action"
              defaultValue={action ?? ""}
              placeholder="Action (ex : store.)"
              aria-label="Filtrer par action"
              className={cn(inputCls, "fx-num ps-9")}
            />
          </div>

          <div className="relative min-w-0 lg:flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Recherche (action, entité, id)"
              aria-label="Rechercher dans le journal"
              className={cn(inputCls, "ps-9")}
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" className={adminBtnCls("primary", "md", "flex-1 lg:flex-none")}>
              <Icon name="filter" size={15} />
              Filtrer
            </button>
            {filtered ? (
              <Link href="/admin/journal" className={adminBtnCls("secondary", "md")}>
                <Icon name="refresh" size={15} />
                Réinitialiser
              </Link>
            ) : null}
          </div>
        </form>

        {filtered ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs">
            <span className="font-semibold text-slate-400">Filtres actifs :</span>
            {store ? <Badge tone="violet" size="sm">{storeMap.get(store)?.name ?? "Site sélectionné"}</Badge> : null}
            {action ? <Badge tone="blue" size="sm" >{action}</Badge> : null}
            {q ? <Badge tone="gray" size="sm">« {q} »</Badge> : null}
          </div>
        ) : null}
      </Card>

      <Card className="mt-4 overflow-hidden">
        <CardHeader icon="history" title="Entrées du journal" subtitle="Actions sensibles — marchand et plateforme">
          <Badge tone={rows.length > 0 ? "blue" : "gray"} size="sm">{rows.length}</Badge>
        </CardHeader>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="history" size={24} />}
            title="Aucune entrée"
            text={
              filtered
                ? "Aucune entrée ne correspond à ces filtres."
                : "Les actions sensibles (marchand + plateforme) apparaîtront ici."
            }
            action={
              filtered ? (
                <Link href="/admin/journal" className={adminBtnCls("secondary", "md")}>
                  <Icon name="refresh" size={15} />
                  Réinitialiser les filtres
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Table
            head={
              <>
                <Th>Quand</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Entité</Th>
                <Th>Site</Th>
                <Th>Support</Th>
              </>
            }
          >
            {rows.map((a) => (
              <tr key={a.id as string} className="fx-row">
                <Td className="text-xs text-slate-500 whitespace-nowrap" title={formatDateTimeFr(a.created_at as string)}>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" size={11} className="text-slate-400" />
                    {timeAgoFr(a.created_at as string)}
                  </span>
                </Td>
                <Td className="text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="user" size={12} className="text-slate-400" />
                    {profileMap.get(a.actor_user_id as string) ?? (a.actor_user_id as string)?.slice(0, 8) ?? "—"}
                  </span>
                </Td>
                <Td>
                  <Badge tone={actionTone(a.action as string)} size="sm">
                    <span className="fx-num">{a.action as string}</span>
                  </Badge>
                </Td>
                <Td className="text-xs text-slate-600">
                  <span className="font-medium">{a.entity as string}</span>
                  <span className="fx-num ms-1 text-slate-400">· {(a.entity_id as string)?.slice(0, 8) ?? "—"}</span>
                </Td>
                <Td className="text-xs text-slate-600">
                  {a.store_id ? (storeMap.get(a.store_id as string)?.name ?? (a.store_id as string).slice(0, 8)) : "—"}
                </Td>
                <Td className="fx-num text-xs text-slate-400">{(a.support_session_id as string)?.slice(0, 8) ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
