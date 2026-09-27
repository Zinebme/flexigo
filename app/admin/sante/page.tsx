import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, Stat, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
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
      <PageHeader
        eyebrow="Plateforme"
        icon="heart"
        title="Santé système"
        subtitle="Événements internes, erreurs et warnings — journal super-admin uniquement."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Erreurs" value={errors} tone={errors > 0 ? "bad" : "good"} icon="alert" hint={`Sur les ${allEvents.length} derniers événements`} />
        <Stat label="Warnings" value={warnings} tone={warnings > 0 ? "warn" : "good"} icon="info" hint="À surveiller sans gravité immédiate" />
        <Stat label="Audits 24h" value={(audits ?? []).length} tone="primary" icon="history" hint="Actions sensibles journalisées" />
      </div>

      {errors === 0 && warnings === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Icon name="checkCircle" size={17} />
          </span>
          <p className="text-sm font-semibold text-emerald-800">
            Aucune erreur ni warning sur les {allEvents.length} derniers événements système.
          </p>
        </div>
      ) : null}

      <Card className="mt-6 overflow-hidden">
        <CardHeader icon="zap" title="100 derniers événements système" subtitle="Niveau, catégorie, message, site, timestamp — aucun secret.">
          {errors > 0 ? <Badge tone="red" dot size="sm">{errors} erreur(s)</Badge> : null}
          {warnings > 0 ? <Badge tone="amber" dot size="sm">{warnings} warning(s)</Badge> : null}
        </CardHeader>
        {allEvents.length === 0 ? (
          <EmptyState icon={<Icon name="zap" size={24} />} title="Aucun événement" text="Les événements système apparaîtront ici." />
        ) : (
          <Table
            head={
              <>
                <Th>Niveau</Th>
                <Th>Catégorie</Th>
                <Th>Message</Th>
                <Th>Site</Th>
                <Th>Quand</Th>
              </>
            }
          >
            {allEvents.map((e) => (
              <tr key={e.id as string} className="fx-row">
                <Td>
                  <Badge tone={(e.level as string) === "error" ? "red" : (e.level as string) === "warning" ? "amber" : "gray"} dot size="sm">
                    {e.level as string}
                  </Badge>
                </Td>
                <Td className="text-xs text-slate-600">{e.category as string}</Td>
                <Td className="max-w-md truncate text-sm text-slate-600" title={e.message as string}>{e.message as string}</Td>
                <Td className="text-xs text-slate-500">
                  {e.store_id ? (storeMap.get(e.store_id as string)?.name ?? (e.store_id as string).slice(0, 8)) : "—"}
                </Td>
                <Td className="text-xs text-slate-500 whitespace-nowrap" title={formatDateTimeFr(e.created_at as string)}>
                  {timeAgoFr(e.created_at as string)}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
