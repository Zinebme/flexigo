import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui";
import { ClientsManager, type AdminClientRow } from "@/components/admin/clients-manager";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: orgs }, { data: stores }] = await Promise.all([
    admin.from("organizations").select("id, name, status, internal_notes, created_at").is("deleted_at", null).order("created_at", { ascending: false }),
    admin.from("stores").select("organization_id").is("deleted_at", null),
  ]);

  const storeCount = new Map<string, number>();
  for (const store of (stores ?? []) as Array<{ organization_id: string | null }>) {
    if (!store.organization_id) continue;
    storeCount.set(store.organization_id, (storeCount.get(store.organization_id) ?? 0) + 1);
  }

  const clients = ((orgs ?? []) as Array<Omit<AdminClientRow, "store_count">>).map((organization) => ({
    ...organization,
    store_count: storeCount.get(organization.id) ?? 0,
  }));

  return (
    <>
      <PageHeader title="Clients" subtitle={`${clients.length} organisations clientes · ajout, modification, suspension et suppression`} />
      <ClientsManager key={JSON.stringify(clients)} clients={clients} />
    </>
  );
}
