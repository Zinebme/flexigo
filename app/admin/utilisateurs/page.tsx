import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { PlatformAdminsManager } from "@/components/admin/platform-admins-manager";
import { formatDateTimeFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUtilisateursPage() {
  const ctx = await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: profiles }, { data: platformAdmins }, { data: members }, { data: stores }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("platform_admins").select("*").order("created_at", { ascending: false }),
    admin.from("store_members").select("store_id, user_id, role, status").order("created_at", { ascending: false }).limit(300),
    admin.from("stores").select("id, name").is("deleted_at", null),
  ]);

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string }>).map((s) => [s.id, s.name]));
  const paIds = new Set(((platformAdmins ?? []) as Array<{ user_id: string }>).map((p) => p.user_id));

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Comptes de la plateforme — rôles marchands vs super-admin séparés." />

      <Card className="p-5">
        <h3 className="font-bold text-slate-900">Administrateurs plateforme</h3>
        <p className="mt-1 text-xs text-slate-500">SUPER_ADMIN ne peut être assigné depuis l'UI marchande — uniquement ici, avec re-confirmation.</p>
        <div className="mt-4">
          <PlatformAdminsManager
            currentUserId={ctx.user.id}
            platformAdmins={(platformAdmins ?? []) as Array<{ user_id: string; role: string; created_at: string }>}
            profiles={(profiles ?? []) as Array<{ id: string; email: string | null }>}
          />
        </div>
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Comptes utilisateurs ({(profiles ?? []).length})</h2>
        </div>
        {(profiles ?? []).length === 0 ? (
          <EmptyState icon="👤" title="Aucun utilisateur" />
        ) : (
          <Table head={<><Th>Email</Th><Th>Super admin</Th><Th>Memberships</Th><Th>Créé le</Th></>}>
            {(profiles as Array<Record<string, unknown>>).map((p) => {
              const memberships = (members as Array<Record<string, unknown>> | null)?.filter((m) => m.user_id === p.id) ?? [];
              return (
                <tr key={p.id as string} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-800">{(p.email as string) ?? "—"}</Td>
                  <Td>{paIds.has(p.id as string) ? <Badge tone="purple">SUPER_ADMIN</Badge> : <span className="text-xs text-slate-400">—</span>}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {memberships.length === 0 ? <span className="text-xs text-slate-400">—</span> : memberships.slice(0, 3).map((m, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {storeMap.get(m.store_id as string) ?? (m.store_id as string).slice(0, 6)} · {m.role as string} · {m.status as string}
                        </span>
                      ))}
                      {memberships.length > 3 && <span className="text-xs text-slate-400">+{memberships.length - 3}</span>}
                    </div>
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDateTimeFr(p.created_at as string)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
