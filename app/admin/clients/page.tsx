import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDateTimeFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: orgs }, { data: stores }] = await Promise.all([
    admin.from("organizations").select("id, name, created_at").order("created_at", { ascending: false }),
    admin.from("stores").select("id, organization_id, name, slug, status").is("deleted_at", null),
  ]);

  const storeCount = new Map<string, number>();
  for (const s of (stores ?? []) as Array<{ organization_id: string | null }>) {
    if (!s.organization_id) continue;
    storeCount.set(s.organization_id, (storeCount.get(s.organization_id) ?? 0) + 1);
  }

  const rows = (orgs ?? []) as Array<{ id: string; name: string; created_at: string }>;

  return (
    <>
      <PageHeader title="Clients" subtitle={`${rows.length} organisations clientes`} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="🏢" title="Aucun client" text="Les organisations créées via le wizard apparaîtront ici." />
        ) : (
          <Table head={<><Th>Organisation</Th><Th>Sites</Th><Th>Créée le</Th><Th /></>}>
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{o.name}</Td>
                <Td>{storeCount.get(o.id) ?? 0} site(s)</Td>
                <Td className="text-slate-500">{formatDateTimeFr(o.created_at)}</Td>
                <Td>
                  <Link href={`/admin/sites?q=${encodeURIComponent(o.name)}`} className="text-sm font-semibold text-blue-600 hover:underline">
                    Voir sites →
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
