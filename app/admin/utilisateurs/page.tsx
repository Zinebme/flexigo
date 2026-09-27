import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
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
  const adminRows = (platformAdmins ?? []) as Array<{ user_id: string; role: string; created_at: string }>;
  const paIds = new Set(adminRows.map((p) => p.user_id));
  const profileRows = (profiles ?? []) as Array<Record<string, unknown>>;

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="users"
        title="Utilisateurs"
        subtitle="Comptes de la plateforme — rôles marchands et super-admin séparés."
      >
        <Badge tone="purple" dot size="sm">{paIds.size} super admin(s)</Badge>
        <Badge tone="gray" size="sm">{profileRows.length} compte(s)</Badge>
      </PageHeader>

      <Card>
        <CardHeader
          icon="shield"
          title="Administrateurs plateforme"
          subtitle="SUPER_ADMIN ne peut être assigné depuis l'UI marchande — uniquement ici, avec re-confirmation."
        >
          <Badge tone="purple" size="sm">{adminRows.length}</Badge>
        </CardHeader>
        <div className="px-5 py-4">
          <PlatformAdminsManager
            currentUserId={ctx.user.id}
            platformAdmins={adminRows}
            profiles={(profiles ?? []) as Array<{ id: string; email: string | null }>}
          />
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader icon="user" title="Comptes utilisateurs" subtitle="200 derniers comptes créés">
          <Badge tone={profileRows.length > 0 ? "blue" : "gray"} size="sm">{profileRows.length}</Badge>
        </CardHeader>
        {profileRows.length === 0 ? (
          <EmptyState icon={<Icon name="users" size={24} />} title="Aucun utilisateur" text="Les comptes créés sur la plateforme apparaîtront ici." />
        ) : (
          <Table
            head={
              <>
                <Th>Email</Th>
                <Th>Super admin</Th>
                <Th>Memberships</Th>
                <Th>Créé le</Th>
              </>
            }
          >
            {profileRows.map((p) => {
              const memberships = ((members ?? []) as Array<Record<string, unknown>>).filter((m) => m.user_id === p.id);
              return (
                <tr key={p.id as string} className="fx-row">
                  <Td>
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                      <Icon name="mail" size={13} className="text-slate-400" />
                      {(p.email as string) ?? "—"}
                    </span>
                  </Td>
                  <Td>
                    {paIds.has(p.id as string) ? (
                      <Badge tone="purple" size="sm" icon="shield">SUPER_ADMIN</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {memberships.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        memberships.slice(0, 3).map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            title={`${storeMap.get(m.store_id as string) ?? m.store_id} · ${m.role} · ${m.status}`}
                          >
                            <Icon name="store" size={11} className="text-slate-400" />
                            {storeMap.get(m.store_id as string) ?? (m.store_id as string).slice(0, 6)}
                            <span className="font-semibold text-slate-500">{m.role as string}</span>
                            <span className={m.status === "active" ? "text-emerald-600" : "text-slate-400"}>{m.status as string}</span>
                          </span>
                        ))
                      )}
                      {memberships.length > 3 ? (
                        <span className="text-xs font-semibold text-slate-400">+{memberships.length - 3}</span>
                      ) : null}
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
