import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { DomainsManager } from "@/components/admin/domains-manager";
import { formatDateTimeFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

function domainStatus(status: string) {
  if (status === "verified") return { tone: "green", icon: "checkCircle" as const, label: "Vérifié" };
  if (status === "pending") return { tone: "amber", icon: "clock" as const, label: "En attente" };
  return { tone: "red", icon: "alert" as const, label: status || "Inconnu" };
}

export default async function AdminDomainesPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: domains }, { data: stores }] = await Promise.all([
    admin.from("domains").select("*").order("created_at", { ascending: false }),
    admin.from("stores").select("id, name, slug").is("deleted_at", null).order("name"),
  ]);

  const storeRows = (stores ?? []) as Array<{ id: string; name: string; slug: string }>;
  const storeMap = new Map(storeRows.map((s) => [s.id, s]));
  const rows = (domains ?? []) as Array<Record<string, unknown>>;
  const pending = rows.filter((d) => d.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="globe"
        title="Domaines"
        subtitle="Résolution par hostname — vérification provider-neutral, domaine primaire configurable."
      >
        {pending > 0 ? <Badge tone="amber" dot>{pending} en attente de vérification</Badge> : null}
      </PageHeader>

      <Card>
        <CardHeader icon="plug" title="Gestionnaire de domaines" subtitle="Ajouter, vérifier ou définir un domaine primaire." />
        <div className="px-5 py-4">
          <DomainsManager stores={storeRows} />
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader icon="link" title="Domaines configurés" subtitle="Preview toujours disponible via /s/[slug]">
          <Badge tone={rows.length > 0 ? "blue" : "gray"} size="sm">{rows.length}</Badge>
        </CardHeader>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="globe" size={24} />}
            title="Aucun domaine personnalisé"
            text="Les domaines ajoutés via le gestionnaire ci-dessus ou l'API apparaîtront ici."
          />
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
            {rows.map((d) => {
              const store = storeMap.get(d.store_id as string);
              const st = domainStatus(d.status as string);
              return (
                <tr key={d.id as string} className="fx-row">
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="globe" size={13} className="text-slate-400" />
                      <span className="fx-num text-sm font-semibold text-slate-800">{d.hostname as string}</span>
                    </span>
                  </Td>
                  <Td>
                    <div className="font-medium text-slate-700">{store?.name ?? "—"}</div>
                    <div className="fx-num text-xs text-slate-400">/{store?.slug ?? "—"}</div>
                  </Td>
                  <Td>
                    {d.is_primary ? (
                      <Badge tone="blue" size="sm" icon="star">Primaire</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={st.tone} dot size="sm">{st.label}</Badge>
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDateTimeFr(d.created_at as string)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
