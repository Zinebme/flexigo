import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string; slug: string }>).map((s) => [s.id, s]));
  const profileMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((p) => [p.id, p.email]));

  let rows = (audits ?? []) as Array<Record<string, unknown>>;
  if (action) rows = rows.filter((r) => (r.action as string).includes(action));
  if (store) rows = rows.filter((r) => r.store_id === store);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => `${r.action} ${r.entity} ${r.entity_id}`.toLowerCase().includes(needle));
  }

  return (
    <>
      <PageHeader title="Journal / Audit" subtitle={`${rows.length} entrées (limite 200) — actor, tenant, action, entity, safe before/after, support_session_id`} />

      <Card className="p-4">
        <form className="flex flex-wrap gap-2">
          <select name="store" defaultValue={store ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">Tous les sites</option>
            {(stores ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input name="action" defaultValue={action ?? ""} placeholder="Filtre action (ex: store.)" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input name="q" defaultValue={q ?? ""} placeholder="Recherche" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filtrer</button>
        </form>
      </Card>

      <Card className="mt-4">
        {rows.length === 0 ? (
          <EmptyState icon="📜" title="Aucune entrée" text="Les actions sensibles (marchand + plateforme) apparaîtront ici." />
        ) : (
          <Table head={<><Th>Quand</Th><Th>Actor</Th><Th>Action</Th><Th>Entité</Th><Th>Site</Th><Th>Support</Th></>}>
            {rows.map((a) => (
              <tr key={a.id as string} className="hover:bg-slate-50">
                <Td className="whitespace-nowrap text-xs text-slate-500" title={formatDateTimeFr(a.created_at as string)}>{timeAgoFr(a.created_at as string)}</Td>
                <Td className="text-xs text-slate-600">{profileMap.get(a.actor_user_id as string) ?? (a.actor_user_id as string)?.slice(0, 8) ?? "—"}</Td>
                <Td><Badge tone="gray">{a.action as string}</Badge></Td>
                <Td className="text-xs text-slate-600">{a.entity as string} · {(a.entity_id as string)?.slice(0, 8) ?? "—"}</Td>
                <Td className="text-xs text-slate-600">{a.store_id ? (storeMap.get(a.store_id as string)?.name ?? (a.store_id as string).slice(0, 8)) : "—"}</Td>
                <Td className="font-mono text-xs text-slate-400">{(a.support_session_id as string)?.slice(0, 8) ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
