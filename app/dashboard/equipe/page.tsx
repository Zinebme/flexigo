import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { TeamManager, type Member } from "@/components/dashboard/team-manager";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const ctx = await getMerchantContext();
  const canManage = can(ctx.role, "team.manage");
  const admin = getAdminSupabase();

  const { data: members } = await admin
    .from("store_members")
    .select("*")
    .eq("store_id", ctx.store.id)
    .order("created_at", { ascending: true });

  const ids = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
  const { data: profiles } =
    ids.length > 0 ? await admin.from("profiles").select("id, email, full_name").in("id", ids) : { data: [] };
  const profMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>).map((p) => [p.id, p]));

  const list: Member[] = ((members ?? []) as Array<Record<string, unknown>>).map((m) => ({
    id: m.id as string,
    user_id: m.user_id as string,
    role: m.role as string,
    status: m.status as string,
    created_at: m.created_at as string,
    email: profMap.get(m.user_id as string)?.email ?? "compte supprimé",
    full_name: profMap.get(m.user_id as string)?.full_name ?? null,
    is_self: m.user_id === ctx.user.id,
  }));

  return (
    <>
      <PageHeader title="Équipe" subtitle="Membres et rôles du site. Le rôle Propriétaire ne peut être accordé que par la plateforme." />
      <Card>
        <CardHeader title={`Membres (${list.length})`} subtitle="Chaque rôle est décrit en français ; les permissions sont appliquées côté serveur." />
        <TeamManager members={list} canManage={canManage} />
      </Card>
    </>
  );
}
