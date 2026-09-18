import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  await getAdminContext();
  const admin = getAdminSupabase();

  const [{ data: shipping }, { data: marketing }, { data: sheets }, { data: whatsapp }, { data: stores }, { data: logs }] = await Promise.all([
    admin.from("shipping_integrations").select("*").order("updated_at", { ascending: false }),
    admin.from("marketing_integrations").select("*").order("updated_at", { ascending: false }),
    admin.from("google_sheet_integrations").select("*").order("updated_at", { ascending: false }),
    admin.from("whatsapp_integrations").select("*").order("updated_at", { ascending: false }),
    admin.from("stores").select("id, name, slug").is("deleted_at", null),
    admin.from("integration_logs").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  const storeMap = new Map(((stores ?? []) as Array<{ id: string; name: string; slug: string }>).map((s) => [s.id, s]));

  return (
    <>
      <PageHeader title="Intégrations" subtitle="Vue plateforme des intégrations — shipping, pixels, Sheets, WhatsApp. Secrets chiffrés côté serveur." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Shipping ({(shipping ?? []).length})</h2>
            <p className="text-xs text-slate-500">Providers: manual / navex (placeholder, docs à coller) / mock</p>
          </div>
          {(shipping ?? []).length === 0 ? <p className="p-4 text-sm text-slate-400">Aucune config.</p> : (
            <Table head={<><Th>Site</Th><Th>Provider</Th><Th>Statut</Th><Th>MAJ</Th></>}>
              {(shipping as Array<Record<string, unknown>>).map((s) => (
                <tr key={s.id as string} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-700">{storeMap.get(s.store_id as string)?.name ?? s.store_id as string}</Td>
                  <Td className="font-mono text-xs">{s.provider_key as string}</Td>
                  <Td><Badge tone={(s.status as string) === "configured" ? "green" : (s.status as string) === "error" ? "red" : "gray"}>{s.status as string}</Badge></Td>
                  <Td className="text-xs text-slate-500" title={formatDateTimeFr(s.updated_at as string)}>{timeAgoFr(s.updated_at as string)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Marketing Pixels ({(marketing ?? []).length})</h2>
            <p className="text-xs text-slate-500">Meta, TikTok, Snapchat, Pinterest, GA4, GTM, Google Ads — IDs uniquement, pas de code.</p>
          </div>
          {(marketing ?? []).length === 0 ? <p className="p-4 text-sm text-slate-400">Aucune config.</p> : (
            <Table head={<><Th>Site</Th><Th>Provider</Th><Th>Actif</Th></>}>
              {(marketing as Array<Record<string, unknown>>).map((m) => (
                <tr key={m.id as string} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-700">{storeMap.get(m.store_id as string)?.name ?? m.store_id as string}</Td>
                  <Td className="font-mono text-xs">{m.provider_key as string}</Td>
                  <Td>{(m.is_active as boolean) ? <Badge tone="green">Actif</Badge> : <Badge tone="gray">Inactif</Badge>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Google Sheets ({(sheets ?? []).length})</h2>
            <p className="text-xs text-slate-500">SA JSON chiffré (fxenc1.*) côté serveur — export commandes.</p>
          </div>
          {(sheets ?? []).length === 0 ? <p className="p-4 text-sm text-slate-400">Aucune config.</p> : (
            <Table head={<><Th>Site</Th><Th>Actif</Th><Th>Dernier statut</Th><Th>MAJ</Th></>}>
              {(sheets as Array<Record<string, unknown>>).map((g) => (
                <tr key={g.id as string} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-700">{storeMap.get(g.store_id as string)?.name ?? g.store_id as string}</Td>
                  <Td>{(g.is_active as boolean) ? <Badge tone="green">Actif</Badge> : <Badge tone="gray">Inactif</Badge>}</Td>
                  <Td><Badge tone={(g.last_status as string) === "success" ? "green" : (g.last_status as string) === "failure" ? "red" : "gray"}>{(g.last_status as string) ?? "—"}</Badge></Td>
                  <Td className="text-xs text-slate-500" title={formatDateTimeFr(g.updated_at as string)}>{timeAgoFr(g.updated_at as string)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">WhatsApp / Swivigo ({(whatsapp ?? []).length})</h2>
            <p className="text-xs text-slate-500">Interface pluggable — bouton contact uniquement pour l'instant.</p>
          </div>
          {(whatsapp ?? []).length === 0 ? <p className="p-4 text-sm text-slate-400">Aucune config.</p> : (
            <Table head={<><Th>Site</Th><Th>Provider</Th><Th>Statut</Th></>}>
              {(whatsapp as Array<Record<string, unknown>>).map((w) => (
                <tr key={w.id as string} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-700">{storeMap.get(w.store_id as string)?.name ?? w.store_id as string}</Td>
                  <Td className="font-mono text-xs">{w.provider as string}</Td>
                  <Td><Badge tone={(w.status as string) === "connected" ? "green" : (w.status as string) === "error" ? "red" : "gray"}>{w.status as string}</Badge></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Logs d'intégration (50 derniers)</h2>
          <p className="text-xs text-slate-500">Journal interne — jamais de secrets.</p>
        </div>
        {(logs ?? []).length === 0 ? (
          <EmptyState icon="🔌" title="Aucun log" text="Les tentatives d'envoi transporteur / Sheets apparaîtront ici." />
        ) : (
          <Table head={<><Th>Quand</Th><Th>Site</Th><Th>Provider</Th><Th>Statut</Th><Th>Message</Th></>}>
            {(logs as Array<Record<string, unknown>>).map((l) => (
              <tr key={l.id as string} className="hover:bg-slate-50">
                <Td className="text-xs text-slate-500" title={formatDateTimeFr(l.created_at as string)}>{timeAgoFr(l.created_at as string)}</Td>
                <Td className="text-xs text-slate-600">{storeMap.get(l.store_id as string)?.name ?? (l.store_id as string)?.slice(0, 8) ?? "—"}</Td>
                <Td className="font-mono text-xs">{(l.provider_key as string) ?? "—"}</Td>
                <Td><Badge tone={(l.status as string) === "success" ? "green" : (l.status as string) === "failure" ? "red" : "gray"}>{l.status as string}</Badge></Td>
                <Td className="max-w-xs truncate text-xs text-slate-600" title={l.message as string}>{l.message as string}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-bold text-slate-900">Navex — documentation d'intégration (placeholder sécurisé)</h3>
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Aucun endpoint Navex n'est inventé.</p>
          <p className="mt-1">Architecture prévue:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Interface <code className="font-mono">ShippingProvider</code> dans <code className="font-mono">lib/providers/shipping.ts</code> (createShipment, cancelShipment, getShipment, getTrackingStatus, listOffices, validateDestination).</li>
            <li>Adapter <code className="font-mono">NavexProvider</code> lit <code className="font-mono">shipping_integrations.config</code> (base_url + token chiffrés fxenc1.*) côté serveur uniquement.</li>
            <li>UI de configuration (base URL, token masqué, bouton Test connexion) dans <code className="font-mono">/dashboard/livraison</code> et <code className="font-mono">/admin/sites/[id]</code> → Administration avancée.</li>
            <li>Placeholders Yalidine / Ecotrack : même interface, ajoutez <code className="font-mono">provider_key</code> + implémentez l'adapter + migration pour le check.</li>
          </ul>
          <p className="mt-2"><strong>TODO pour intégration réelle:</strong> coller la spec officielle Navex (URLs, auth, payloads) dans <code className="font-mono">lib/providers/navex.ts</code> (fichier à créer) et documenter dans <code className="font-mono">docs/navex.md</code>. Le mock adapter actuel permet de tester le flux sans credentials.</p>
        </div>
      </Card>
    </>
  );
}
