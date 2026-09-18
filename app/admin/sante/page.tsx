import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, Stat } from "@/components/ui";
import { formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSantePage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const since = new Date();
  since.setDate(since.getDate() - 1);
  const [{ data: events }, { data: stores }, { data: audits }] = await Promise.all([
    admin.from("system_events").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("stores").select("id, name, slug").is("deleted_at", null),
    admin.from("audit_logs").select("id").gte("created_at", since.toISOString()),
  ]);

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string; slug: string }>).map((s) => [s.id, s]));

  const allEvents = (events ?? []) as Array<Record<string, unknown>>;
  const errors = allEvents.filter((e) => e.level === "error").length;
  const warnings = allEvents.filter((e) => e.level === "warning").length;

  return (
    <>
      <PageHeader title="Santé système" subtitle="Événements internes, erreurs, warnings — journal super-admin uniquement." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Erreurs (100 derniers events)" value={errors} tone={errors > 0 ? "bad" : "good"} hint={`${allEvents.length} events totaux`} />
        <Stat label="Warnings" value={warnings} tone={warnings > 0 ? "warn" : "good"} />
        <Stat label="Audits 24h" value={(audits ?? []).length} hint="actions sensibles" tone="primary" />
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">100 derniers événements système</h2>
          <p className="text-xs text-slate-500">Niveau, catégorie, message, site, timestamp — pas de secrets.</p>
        </div>
        <Table head={<><Th>Niveau</Th><Th>Catégorie</Th><Th>Message</Th><Th>Site</Th><Th>Quand</Th></>}>
          {allEvents.map((e) => (
            <tr key={e.id as string} className="hover:bg-slate-50">
              <Td><Badge tone={(e.level as string) === "error" ? "red" : (e.level as string) === "warning" ? "amber" : "gray"}>{e.level as string}</Badge></Td>
              <Td className="text-xs text-slate-600">{e.category as string}</Td>
              <Td className="max-w-md truncate text-sm text-slate-600" title={e.message as string}>{e.message as string}</Td>
              <Td className="text-xs text-slate-500">{e.store_id ? (storeMap.get(e.store_id as string)?.name ?? (e.store_id as string).slice(0, 8)) : "—"}</Td>
              <Td className="whitespace-nowrap text-xs text-slate-500" title={formatDateTimeFr(e.created_at as string)}>{timeAgoFr(e.created_at as string)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
