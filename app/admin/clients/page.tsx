import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui";
import { ClientsManager, type AdminClientRow } from "@/components/admin/clients-manager";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: orgs }, { data: stores }] = await Promise.all([
    admin.from("organizations").select("id, name, status, internal_notes, owner_user_id, created_at, updated_at").is("deleted_at", null).order("created_at", { ascending: false }),
    admin.from("stores").select("id, organization_id, name, slug, status, website_type, template_key, created_at").is("deleted_at", null).order("created_at", { ascending: false }),
  ]);

  const storeRows = (stores ?? []) as Array<{
    id: string;
    organization_id: string | null;
    name: string;
    slug: string;
    status: string;
    website_type: string;
    template_key: string;
    created_at: string;
  }>;
  const storeIds = storeRows.map((store) => store.id);
  const { data: members } = storeIds.length
    ? await admin.from("store_members").select("id, store_id, user_id, role, status, created_at").in("store_id", storeIds).order("created_at")
    : { data: [] };
  const memberRows = (members ?? []) as Array<{ id:string; store_id:string; user_id:string; role:string; status:string; created_at:string }>;
  const userIds = [...new Set(memberRows.map((member) => member.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, email, full_name, dashboard_language").in("id", userIds)
    : { data: [] };
  const profileMap = new Map(((profiles ?? []) as Array<{id:string;email:string|null;full_name:string|null;dashboard_language:string}>).map((profile)=>[profile.id,profile]));

  const storesByOrg = new Map<string, typeof storeRows>();
  for (const store of storeRows) {
    if (!store.organization_id) continue;
    storesByOrg.set(store.organization_id, [...(storesByOrg.get(store.organization_id) ?? []), store]);
  }
  const membersByStore = new Map<string, typeof memberRows>();
  for (const member of memberRows) {
    membersByStore.set(member.store_id, [...(membersByStore.get(member.store_id) ?? []), member]);
  }

  const clients: AdminClientRow[] = ((orgs ?? []) as Array<{
    id:string;name:string;status:"active"|"suspended";internal_notes:string|null;owner_user_id:string|null;created_at:string;updated_at:string|null;
  }>).map((organization) => {
    const clientStores = storesByOrg.get(organization.id) ?? [];
    const seen = new Set<string>();
    const users = clientStores.flatMap((store) => (membersByStore.get(store.id) ?? []).map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        id: member.id,
        user_id: member.user_id,
        store_id: store.id,
        store_name: store.name,
        email: profile?.email ?? null,
        full_name: profile?.full_name ?? null,
        dashboard_language: profile?.dashboard_language ?? "fr",
        role: member.role,
        status: member.status,
        is_owner: organization.owner_user_id === member.user_id,
      };
    })).filter((user) => {
      const key = `${user.user_id}:${user.store_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      ...organization,
      store_count: clientStores.length,
      sites: clientStores,
      users,
    };
  });

  return (
    <>
      <PageHeader title="Clients" subtitle={`${clients.length} organisations clientes · fiche complète, sites, comptes, modification, suspension et suppression`} />
      <ClientsManager key={JSON.stringify(clients)} clients={clients} />
    </>
  );
}
