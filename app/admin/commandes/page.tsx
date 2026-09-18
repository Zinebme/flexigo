import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string; slug: string }>).map((s) => [s.id, s]));

  let rows = (orders ?? []) as Array<Record<string, unknown>>;
  if (storeFilter) rows = rows.filter((r) => r.store_id === storeFilter);
  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => `${r.order_number} ${r.full_name} ${r.phone}`.toLowerCase().includes(needle));
  }

  return (
    <>
      <PageHeader title="Commandes plateforme" subtitle={`${rows.length} commandes (limite 200 — filtrez par site/statut)`} />
      <Card className="p-4">
        <form className="flex flex-wrap gap-2">
          <select name="store" defaultValue={storeFilter ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">Tous les sites</option>
            {(stores ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">Tous statuts</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input name="q" defaultValue={q ?? ""} placeholder="N° / client / tel" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filtrer</button>
        </form>
      </Card>

      <Card className="mt-4">
        {rows.length === 0 ? (
          <EmptyState icon="📦" title="Aucune commande" text="Aucune commande ne correspond à ces filtres." />
        ) : (
          <Table head={<><Th>N°</Th><Th>Site</Th><Th>Client</Th><Th>Total</Th><Th>Statut</Th><Th>Reçue</Th><Th /></>}>
            {rows.map((o) => {
              const st = storeMap.get(o.store_id as string);
              return (
                <tr key={o.id as string} className="hover:bg-slate-50">
                  <Td className="font-semibold text-slate-900">{o.order_number as string}</Td>
                  <Td>
                    <div className="font-medium text-slate-700">{st?.name ?? "—"}</div>
                    <div className="font-mono text-xs text-slate-400">/{st?.slug ?? "—"}</div>
                  </Td>
                  <Td>
                    <div className="font-medium text-slate-800">{o.full_name as string}</div>
                    <div className="text-xs text-slate-400">{o.phone as string} · {o.wilaya as string}</div>
                  </Td>
                  <Td className="font-semibold text-slate-900">{formatDA(o.total_cents as number)}</Td>
                  <Td><Badge tone={STATUS_TONE[o.status as string] ?? "gray"}>{ORDER_STATUS_LABELS[o.status as OrderStatus] ?? (o.status as string)}</Badge></Td>
                  <Td className="text-slate-500" title={formatDateTimeFr(o.created_at as string)}>{timeAgoFr(o.created_at as string)}</Td>
                  <Td>
                    <Link href={`/admin/sites/${o.store_id as string}`} className="text-sm font-semibold text-blue-600 hover:underline">Site</Link>
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
