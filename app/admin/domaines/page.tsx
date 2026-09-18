import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { DomainsManager } from "@/components/admin/domains-manager";
import { formatDateTimeFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDomainesPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: domains }, { data: stores }] = await Promise.all([
    admin.from("domains").select("*").order("created_at", { ascending: false }),
    admin.from("stores").select("id, name, slug").is("deleted_at", null).order("name"),
  ]);

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string; slug: string }>).map((s) => [s.id, s]));

  return (
    <>
      <PageHeader title="Domaines" subtitle="Résolution par hostname — vérification provider-neutral, domaine primaire configurable." />
      <Card className="p-5">
        <DomainsManager stores={(stores ?? []) as Array<{ id: string; name: string; slug: string }>} />
      </Card>

      <Card className="mt-6">
        {(domains ?? []).length === 0 ? (
          <EmptyState icon="🔗" title="Aucun domaine personnalisé" text="Les domaines ajoutés via le gestionnaire ci-dessus ou l'API apparaîtront ici. Preview via /s/[slug]." />
        ) : (
          <Table
            head={
              <>
                <Th>Domaine</Th>
                <Th>Site</Th>
                <Th>Primaire</Th>
                <Th>Statut</Th>
                <Th>Créé le</Th>
              </>
            }
          >
            {(domains as Array<Record<string, unknown>>).map((d) => {
              const store = storeMap.get(d.store_id as string);
              return (
                <tr key={d.id as string} className="hover:bg-slate-50">
                  <Td className="font-mono text-sm text-slate-800">{d.hostname as string}</Td>
                  <Td>
                    <div className="font-medium text-slate-700">{store?.name ?? "—"}</div>
                    <div className="font-mono text-xs text-slate-400">/{store?.slug ?? "—"}</div>
                  </Td>
                  <Td>{(d.is_primary as boolean) ? <Badge tone="blue">Primaire</Badge> : <span className="text-xs text-slate-400">—</span>}</Td>
                  <Td>
                    <Badge tone={(d.status as string) === "verified" ? "green" : (d.status as string) === "pending" ? "amber" : "red"}>
                      {d.status as string}
                    </Badge>
                  </Td>
                  <Td className="text-slate-500">{formatDateTimeFr(d.created_at as string)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
