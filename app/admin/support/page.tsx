import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RULES = [
  { icon: "eyeOff" as const, text: <>Client : <strong>aucune</strong> notification, email, popup ou bannière (hors bannière super-admin « Mode assistance — [Store] » + bouton « Quitter »).</> },
  { icon: "history" as const, text: <>Plateforme : chaque session est journalisée (admin, store, start/end, IP) et toutes les actions portent <code className="fx-num rounded bg-slate-100 px-1">support_session_id</code> dans <code className="fx-num rounded bg-slate-100 px-1">audit_logs</code>.</> },
  { icon: "shield" as const, text: "Un admin ne peut avoir qu'une session active à la fois (l'ancienne est fermée automatiquement)." },
  { icon: "lock" as const, text: "Jamais stocker ni révéler les mots de passe clients." },
];

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
  const activeCount = rows.filter((s) => !s.ended_at).length;

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="lifeBuoy"
        title="Support — sessions d'assistance"
        subtitle="Accès silencieux au dashboard marchand — aucune notification client, audit complet côté plateforme."
      >
        {activeCount > 0 ? (
          <Badge tone="green" dot>
            {activeCount} session(s) active(s)
          </Badge>
        ) : (
          <Badge tone="gray" dot>Aucune session active</Badge>
        )}
      </PageHeader>

      <Card>
        <CardHeader icon="info" title="Principe de l'assistance" subtitle="Comment l'accès est ouvert, tracé et refermé." />
        <div className="space-y-3 px-5 py-4">
          <p className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-3 text-sm text-violet-900">
            <Icon name="zap" size={16} className="shrink-0 text-violet-600" />
            Le super admin entre dans le dashboard d&apos;un client sans mot de passe via
            <code className="fx-num rounded bg-white/70 px-1.5 py-0.5 text-xs font-semibold">POST /api/admin/support/start</code>
            → cookie httpOnly
            <code className="fx-num rounded bg-white/70 px-1.5 py-0.5 text-xs font-semibold">fx_support_session</code>
            (8h, secure en production).
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-xs leading-5 text-slate-600">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-inset ring-slate-200">
                  <Icon name={rule.icon} size={14} />
                </span>
                <span>{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader icon="clock" title="Sessions" subtitle="100 dernières sessions d'assistance">
          <Badge tone={rows.length > 0 ? "blue" : "gray"} size="sm">{rows.length}</Badge>
        </CardHeader>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="lifeBuoy" size={24} />}
            title="Aucune session de support"
            text="Les accès assistance apparaîtront ici."
          />
        ) : (
          <Table
            head={
              <>
                <Th>Quand</Th>
                <Th>Admin</Th>
                <Th>Site</Th>
                <Th>Statut</Th>
                <Th>IP</Th>
                <Th>Fin</Th>
              </>
            }
          >
            {rows.map((s) => (
              <tr key={s.id as string} className="fx-row">
                <Td className="text-xs text-slate-500 whitespace-nowrap" title={formatDateTimeFr((s.started_at as string) ?? (s.created_at as string))}>
                  {timeAgoFr(s.created_at as string)}
                </Td>
                <Td className="text-xs text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="user" size={12} className="text-slate-400" />
                    {profileMap.get(s.admin_user_id as string) ?? (s.admin_user_id as string).slice(0, 8)}
                  </span>
                </Td>
                <Td>
                  <div className="font-medium text-slate-700">{storeMap.get(s.store_id as string)?.name ?? (s.store_id as string).slice(0, 8)}</div>
                  <div className="fx-num text-xs text-slate-400">/{storeMap.get(s.store_id as string)?.slug ?? "—"}</div>
                </Td>
                <Td>
                  {s.ended_at ? (
                    <Badge tone="gray" dot size="sm">Fermée</Badge>
                  ) : (
                    <Badge tone="green" dot size="sm">Active</Badge>
                  )}
                </Td>
                <Td className="fx-num text-xs text-slate-500">{(s.ip as string) ?? "—"}</Td>
                <Td className="text-xs text-slate-500">{s.ended_at ? formatDateTimeFr(s.ended_at as string) : "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
