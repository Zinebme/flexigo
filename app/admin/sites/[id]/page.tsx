import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, Stat } from "@/components/ui";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { SiteActions } from "@/components/admin/site-actions";
import { AdvancedAdminClient } from "@/components/admin/advanced-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminSiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: store }, { data: org }, { data: members }, { data: domains }, { data: pages }, { data: orders }, { data: products }, { data: themes }, { data: audits }, { data: events }, { data: shipping }, { data: marketing }, { data: sheets }, { data: pageVersions }] =
    await Promise.all([
      admin.from("stores").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
      admin.from("organizations").select("id, name").limit(100),
      admin.from("store_members").select("user_id, role, status, created_at").eq("store_id", id),
      admin.from("domains").select("*").eq("store_id", id),
      admin.from("pages").select("*").eq("store_id", id).order("key"),
      admin.from("orders").select("id, order_number, total_cents, status, created_at").eq("store_id", id).order("created_at", { ascending: false }).limit(20),
      admin.from("products").select("id, name, price_cents, stock, is_active").eq("store_id", id).is("deleted_at", null).limit(30),
      admin.from("themes").select("*").eq("store_id", id).maybeSingle(),
      admin.from("audit_logs").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(30),
      admin.from("system_events").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(30),
      admin.from("shipping_integrations").select("*").eq("store_id", id),
      admin.from("marketing_integrations").select("*").eq("store_id", id),
      admin.from("google_sheet_integrations").select("*").eq("store_id", id).maybeSingle(),
      admin.from("page_versions").select("id, page_key, version, created_at, published_by").eq("store_id", id).order("created_at", { ascending: false }).limit(50),
    ]);

  if (!store) notFound();

  const s = store as Record<string, unknown>;
  const orgMap = new Map(((org ?? []) as Array<{ id: string; name: string }>).map((o) => [o.id, o.name]));
  const memberUserIds = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
  const { data: profiles } = memberUserIds.length > 0 ? await admin.from("profiles").select("id, email").in("id", memberUserIds) : { data: [] };
  const profileMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((p) => [p.id, p.email]));

  const gmv = ((orders ?? []) as Array<{ total_cents: number; status: string }>).filter((o) => !["cancelled_customer", "cancelled_store"].includes(o.status)).reduce((acc, o) => acc + o.total_cents, 0);

  return (
    <>
      <PageHeader
        title={s.name as string}
        subtitle={
          <>
            <span className="font-mono">/{s.slug as string}</span> · {s.website_type as string} · {s.template_key as string} · <Badge tone={(s.status as string) === "active" ? "green" : (s.status as string) === "suspended" ? "amber" : (s.status as string) === "archived" ? "red" : "gray"}>{s.status as string}</Badge>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <a href={`/s/${s.slug as string}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Voir site</a>
          <Link href={`/dashboard?store=${id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Dashboard client</Link>
          <SiteActions store={{
            id: id,
            name: s.name as string,
            slug: s.slug as string,
            status: s.status as never,
            website_type: s.website_type as never,
            template_key: s.template_key as string,
            owner_email: null,
            orders_count: (orders ?? []).length,
            gmv_cents: gmv,
          }} />
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Commandes" value={(orders ?? []).length} />
        <Stat label="CA (non annulées)" value={formatDA(gmv)} tone="good" />
        <Stat label="Produits" value={(products ?? []).length} />
        <Stat label="Pages" value={(pages ?? []).length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Configuration</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Organisation</dt><dd className="font-medium text-slate-800">{orgMap.get(s.organization_id as string) ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Langue</dt><dd className="font-medium text-slate-800">{s.language as string} · {s.currency as string}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Statut</dt><dd className="font-medium text-slate-800">{s.status as string}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Version publiée</dt><dd className="font-medium text-slate-800">{s.published_version as number}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Créé le</dt><dd className="text-slate-600">{formatDateTimeFr(s.created_at as string)}</dd></div>
            <div className="mt-2"><dt className="text-xs font-semibold uppercase text-slate-400">Settings JSON (contact + business)</dt><dd className="mt-1 max-h-40 overflow-auto rounded bg-slate-900 p-2 font-mono text-xs text-slate-100">{JSON.stringify(s.settings, null, 2)}</dd></div>
          </dl>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Thème</h3>
          {themes ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: (themes as { primary_color: string }).primary_color }} /> Primaire: {(themes as { primary_color: string }).primary_color}</div>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: (themes as { secondary_color: string }).secondary_color }} /> Secondaire: {(themes as { secondary_color: string }).secondary_color}</div>
              <div>Typo: {(themes as { typography: string }).typography} · Boutons: {(themes as { button_shape: string }).button_shape}</div>
              <div>Logo: {(themes as { logo_url: string | null }).logo_url ?? "—"}</div>
              <div>Annonce: {(themes as { announcement: string | null }).announcement ?? "—"}</div>
            </dl>
          ) : <p className="text-sm text-slate-400">Aucun thème.</p>}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Membres ({(members ?? []).length})</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {((members ?? []) as Array<Record<string, unknown>>).map((m, i) => (
              <li key={i} className="flex justify-between"><span>{profileMap.get(m.user_id as string) ?? (m.user_id as string).slice(0, 8)} · {m.role as string}</span><Badge tone={(m.status as string) === "active" ? "green" : "gray"}>{m.status as string}</Badge></li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Domaines ({(domains ?? []).length})</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {((domains ?? []) as Array<Record<string, unknown>>).map((d) => (
              <li key={d.id as string} className="flex justify-between"><span className="font-mono">{d.hostname as string} {d.is_primary ? "(primaire)" : ""}</span><Badge tone={(d.status as string) === "verified" ? "green" : (d.status as string) === "pending" ? "amber" : "red"}>{d.status as string}</Badge></li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-900">Pages — brouillon vs publié + historique</h3></div>
        <Table head={<><Th>Clé</Th><Th>Titre</Th><Th>Version en ligne</Th><Th>Publié le</Th><Th>Brouillon vs publié</Th><Th>MAJ</Th></>}>
          {((pages ?? []) as Array<Record<string, unknown>>).map((p) => {
            const dirty = JSON.stringify(p.content ?? null) !== JSON.stringify(p.published_content ?? null);
            return (
              <tr key={p.id as string} className="hover:bg-slate-50">
                <Td className="font-mono text-xs">{p.key as string}</Td>
                <Td className="font-medium text-slate-800">{p.title as string}</Td>
                <Td>{p.version as number}</Td>
                <Td className="text-xs text-slate-500">{p.published_at ? formatDateTimeFr(p.published_at as string) : "—"}</Td>
                <Td>{dirty ? <Badge tone="blue">Modifs non publiées</Badge> : <Badge tone="green">À jour</Badge>}</Td>
                <Td className="text-xs text-slate-500">{formatDateTimeFr(p.updated_at as string)}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Intégrations</h3>
          <div className="mt-3 space-y-3 text-sm">
            <div><strong>Shipping:</strong> {((shipping ?? []) as Array<Record<string, unknown>>).map((s) => `${s.provider_key}(${s.status})`).join(", ") || "—"}</div>
            <div><strong>Marketing:</strong> {((marketing ?? []) as Array<Record<string, unknown>>).map((m) => `${m.provider_key}${(m.is_active as boolean) ? "✓" : ""}`).join(", ") || "—"}</div>
            <div><strong>Sheets:</strong> {sheets ? `${(sheets as { is_active: boolean }).is_active ? "actif" : "inactif"} · ${(sheets as { last_status: string | null }).last_status ?? "—"}` : "—"}</div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900">Dernières commandes</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {((orders ?? []) as Array<Record<string, unknown>>).map((o) => (
              <li key={o.id as string} className="flex justify-between"><span>{o.order_number as string} · {formatDA(o.total_cents as number)}</span><span className="text-xs text-slate-500">{o.status as string} · {timeAgoFr(o.created_at as string)}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <AdvancedAdminClient storeId={id} storeSlug={s.slug as string} pageVersions={(pageVersions ?? []) as Array<{ id: string; page_key: string; version: number; created_at: string; published_by: string | null }>} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-5 py-3"><h3 className="font-bold text-slate-900">Audit (30 derniers)</h3></div>
          <div className="max-h-96 overflow-auto">
            <Table head={<><Th>Quand</Th><Th>Action</Th><Th>Entité</Th></>}>
              {((audits ?? []) as Array<Record<string, unknown>>).map((a) => (
                <tr key={a.id as string} className="hover:bg-slate-50">
                  <Td className="text-xs text-slate-500" title={formatDateTimeFr(a.created_at as string)}>{timeAgoFr(a.created_at as string)}</Td>
                  <Td><Badge tone="gray">{a.action as string}</Badge></Td>
                  <Td className="text-xs text-slate-600">{a.entity as string}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
        <Card>
          <div className="border-b border-slate-100 px-5 py-3"><h3 className="font-bold text-slate-900">Events système (30 derniers)</h3></div>
          <div className="max-h-96 overflow-auto">
            <Table head={<><Th>Niveau</Th><Th>Message</Th><Th>Quand</Th></>}>
              {((events ?? []) as Array<Record<string, unknown>>).map((e) => (
                <tr key={e.id as string} className="hover:bg-slate-50">
                  <Td><Badge tone={(e.level as string) === "error" ? "red" : (e.level as string) === "warning" ? "amber" : "gray"}>{e.level as string}</Badge></Td>
                  <Td className="max-w-xs truncate text-xs text-slate-600" title={e.message as string}>{e.message as string}</Td>
                  <Td className="text-xs text-slate-500" title={formatDateTimeFr(e.created_at as string)}>{timeAgoFr(e.created_at as string)}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      </div>
    </>
  );
}
