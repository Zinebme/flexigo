import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: sessions }, { data: stores }, { data: profiles }] = await Promise.all([
    admin.from("support_sessions").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("stores").select("id, name, slug").is("deleted_at", null),
    admin.from("profiles").select("id, email").limit(200),
  ]);

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string; slug: string }>).map((s) => [s.id, s]));
  const profileMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((p) => [p.id, p.email]));

  const rows = (sessions ?? []) as Array<Record<string, unknown>>;

  return (
    <>
      <PageHeader title="Support — sessions d'assistance" subtitle="Accès silencieux au dashboard marchand — aucune notification client, audit complet côté plateforme." />

      <Card className="p-5">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <strong>Principe:</strong> le super admin peut entrer dans le dashboard d'un client sans mot de passe via <code className="font-mono">POST /api/admin/support/start</code> → cookie httpOnly <code className="font-mono">fx_support_session</code> (8h, secure en prod).<br />
          <ul className="mt-2 list-disc pl-5 text-xs">
            <li>Client: <strong>aucune</strong> notification, email, popup, bannière (sauf bannière super-admin-only "Mode assistance — [Store]" + bouton "Quitter").</li>
            <li>Plateforme: chaque session est loggée (admin, store, start/end, IP) + toutes les actions pendant la session portent <code>support_session_id</code> dans <code>audit_logs</code>.</li>
            <li>Un admin ne peut avoir qu'une session active à la fois (ancienne fermée automatiquement).</li>
            <li>Jamais stocker/révéler les mots de passe clients.</li>
          </ul>
        </div>
      </Card>

      <Card className="mt-6">
        {rows.length === 0 ? (
          <EmptyState icon="🛟" title="Aucune session de support" text="Les accès assistance apparaîtront ici." />
        ) : (
          <Table head={<><Th>Quand</Th><Th>Admin</Th><Th>Site</Th><Th>Statut</Th><Th>IP</Th><Th>Fin</Th></>}>
            {rows.map((s) => (
              <tr key={s.id as string} className="hover:bg-slate-50">
                <Td className="whitespace-nowrap text-xs text-slate-500" title={formatDateTimeFr(s.started_at as string ?? s.created_at as string)}>{timeAgoFr(s.created_at as string)}</Td>
                <Td className="text-xs text-slate-700">{profileMap.get(s.admin_user_id as string) ?? (s.admin_user_id as string).slice(0, 8)}</Td>
                <Td>
                  <div className="font-medium text-slate-700">{storeMap.get(s.store_id as string)?.name ?? (s.store_id as string).slice(0, 8)}</div>
                  <div className="font-mono text-xs text-slate-400">/{storeMap.get(s.store_id as string)?.slug ?? "—"}</div>
                </Td>
                <Td>
                  {(s.ended_at as string | null) ? <Badge tone="gray">Fermée</Badge> : <Badge tone="green">Active</Badge>}
                </Td>
                <Td className="font-mono text-xs text-slate-500">{(s.ip as string) ?? "—"}</Td>
                <Td className="text-xs text-slate-500">{s.ended_at ? formatDateTimeFr(s.ended_at as string) : "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
