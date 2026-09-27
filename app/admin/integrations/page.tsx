import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/ui/icons";
import { formatDateTimeFr, timeAgoFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

function IntegrationCard({
  icon,
  title,
  subtitle,
  count,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader icon={icon} title={title} subtitle={subtitle}>
        <Badge tone={count > 0 ? "blue" : "gray"} size="sm">{count}</Badge>
      </CardHeader>
      {count === 0 ? (
        <EmptyState compact icon={<Icon name={icon} size={22} />} title="Aucune config" text="Les intégrations configurées apparaîtront ici." />
      ) : (
        children
      )}
    </Card>
  );
}

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
  const shippingRows = (shipping ?? []) as Array<Record<string, unknown>>;
  const marketingRows = (marketing ?? []) as Array<Record<string, unknown>>;
  const sheetRows = (sheets ?? []) as Array<Record<string, unknown>>;
  const whatsappRows = (whatsapp ?? []) as Array<Record<string, unknown>>;
  const logRows = (logs ?? []) as Array<Record<string, unknown>>;

  const broken =
    shippingRows.filter((s) => s.status === "error").length +
    sheetRows.filter((g) => g.last_status === "failure").length +
    whatsappRows.filter((w) => w.status === "error").length;

  const storeName = (id: unknown) => (typeof id === "string" ? (storeMap.get(id)?.name ?? id.slice(0, 8)) : "—");

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="plug"
        title="Intégrations"
        subtitle="Vue plateforme — shipping, pixels, Sheets, WhatsApp. Secrets chiffrés côté serveur."
      >
        {broken > 0 ? (
          <Badge tone="red" dot>{broken} en erreur</Badge>
        ) : (
          <Badge tone="green" dot>Aucune erreur</Badge>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <IntegrationCard icon="truck" title="Shipping" subtitle="Providers : manual / navex (placeholder, docs à coller) / mock" count={shippingRows.length}>
          <Table head={<><Th>Site</Th><Th>Provider</Th><Th>Statut</Th><Th>MAJ</Th></>}>
            {shippingRows.map((s) => (
              <tr key={s.id as string} className="fx-row">
                <Td className="font-medium text-slate-700">{storeName(s.store_id)}</Td>
                <Td className="fx-num text-xs">{s.provider_key as string}</Td>
                <Td>
                  <Badge tone={(s.status as string) === "configured" ? "green" : (s.status as string) === "error" ? "red" : "gray"} dot size="sm">
                    {s.status as string}
                  </Badge>
                </Td>
                <Td className="text-xs text-slate-500" title={formatDateTimeFr(s.updated_at as string)}>{timeAgoFr(s.updated_at as string)}</Td>
              </tr>
            ))}
          </Table>
        </IntegrationCard>

        <IntegrationCard icon="chart" title="Marketing Pixels" subtitle="Meta, TikTok, Snapchat, Pinterest, GA4, GTM, Google Ads — IDs uniquement, pas de code." count={marketingRows.length}>
          <Table head={<><Th>Site</Th><Th>Provider</Th><Th>Actif</Th></>}>
            {marketingRows.map((m) => (
              <tr key={m.id as string} className="fx-row">
                <Td className="font-medium text-slate-700">{storeName(m.store_id)}</Td>
                <Td className="fx-num text-xs">{m.provider_key as string}</Td>
                <Td>
                  {m.is_active ? <Badge tone="green" dot size="sm">Actif</Badge> : <Badge tone="gray" dot size="sm">Inactif</Badge>}
                </Td>
              </tr>
            ))}
          </Table>
        </IntegrationCard>

        <IntegrationCard icon="clipboard" title="Google Sheets" subtitle="SA JSON chiffré (fxenc1.*) côté serveur — export commandes." count={sheetRows.length}>
          <Table head={<><Th>Site</Th><Th>Actif</Th><Th>Dernier statut</Th><Th>MAJ</Th></>}>
            {sheetRows.map((g) => (
              <tr key={g.id as string} className="fx-row">
                <Td className="font-medium text-slate-700">{storeName(g.store_id)}</Td>
                <Td>
                  {g.is_active ? <Badge tone="green" dot size="sm">Actif</Badge> : <Badge tone="gray" dot size="sm">Inactif</Badge>}
                </Td>
                <Td>
                  <Badge
                    tone={(g.last_status as string) === "success" ? "green" : (g.last_status as string) === "failure" ? "red" : "gray"}
                    dot
                    size="sm"
                  >
                    {(g.last_status as string) ?? "—"}
                  </Badge>
                </Td>
                <Td className="text-xs text-slate-500" title={formatDateTimeFr(g.updated_at as string)}>{timeAgoFr(g.updated_at as string)}</Td>
              </tr>
            ))}
          </Table>
        </IntegrationCard>

        <IntegrationCard icon="message" title="WhatsApp / Swivigo" subtitle="Interface pluggable — bouton contact uniquement pour l'instant." count={whatsappRows.length}>
          <Table head={<><Th>Site</Th><Th>Provider</Th><Th>Statut</Th></>}>
            {whatsappRows.map((w) => (
              <tr key={w.id as string} className="fx-row">
                <Td className="font-medium text-slate-700">{storeName(w.store_id)}</Td>
                <Td className="fx-num text-xs">{w.provider as string}</Td>
                <Td>
                  <Badge tone={(w.status as string) === "connected" ? "green" : (w.status as string) === "error" ? "red" : "gray"} dot size="sm">
                    {w.status as string}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        </IntegrationCard>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader icon="history" title="Logs d'intégration" subtitle="50 derniers — journal interne, jamais de secrets.">
          <Badge tone={logRows.length > 0 ? "blue" : "gray"} size="sm">{logRows.length}</Badge>
        </CardHeader>
        {logRows.length === 0 ? (
          <EmptyState icon={<Icon name="plug" size={24} />} title="Aucun log" text="Les tentatives d'envoi transporteur / Sheets apparaîtront ici." />
        ) : (
          <Table head={<><Th>Quand</Th><Th>Site</Th><Th>Provider</Th><Th>Statut</Th><Th>Message</Th></>}>
            {logRows.map((l) => (
              <tr key={l.id as string} className="fx-row">
                <Td className="text-xs text-slate-500 whitespace-nowrap" title={formatDateTimeFr(l.created_at as string)}>
                  {timeAgoFr(l.created_at as string)}
                </Td>
                <Td className="text-xs text-slate-600">{storeName(l.store_id)}</Td>
                <Td className="fx-num text-xs">{(l.provider_key as string) ?? "—"}</Td>
                <Td>
                  <Badge tone={(l.status as string) === "success" ? "green" : (l.status as string) === "failure" ? "red" : "gray"} dot size="sm">
                    {l.status as string}
                  </Badge>
                </Td>
                <Td className="max-w-xs truncate text-xs text-slate-600" title={l.message as string}>{l.message as string}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon name="fileText" size={16} />
          </span>
          Navex — documentation d&apos;intégration (placeholder sécurisé)
        </h3>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold">
            <Icon name="alert" size={13} className="shrink-0" />
            Aucun endpoint Navex n&apos;est inventé.
          </p>
          <p className="mt-2 font-semibold">Architecture prévue :</p>
          <ul className="mt-1 list-disc space-y-1 ps-5">
            <li>
              Interface <code className="fx-num rounded bg-white/70 px-1">ShippingProvider</code> dans{" "}
              <code className="fx-num rounded bg-white/70 px-1">lib/providers/shipping.ts</code> (createShipment, cancelShipment,
              getShipment, getTrackingStatus, listOffices, validateDestination).
            </li>
            <li>
              Adapter <code className="fx-num rounded bg-white/70 px-1">NavexProvider</code> lit{" "}
              <code className="fx-num rounded bg-white/70 px-1">shipping_integrations.config</code> (base_url + token chiffrés
              fxenc1.*) côté serveur uniquement.
            </li>
            <li>
              UI de configuration (base URL, token masqué, bouton Test connexion) dans{" "}
              <code className="fx-num rounded bg-white/70 px-1">/dashboard/livraison</code> et{" "}
              <code className="fx-num rounded bg-white/70 px-1">/admin/sites/[id]</code> → Administration avancée.
            </li>
            <li>
              Placeholders Yalidine / Ecotrack : même interface, ajoutez{" "}
              <code className="fx-num rounded bg-white/70 px-1">provider_key</code> + implémentez l&apos;adapter + migration pour le
              check.
            </li>
          </ul>
          <p className="mt-2">
            <strong>TODO pour intégration réelle :</strong> coller la spec officielle Navex (URLs, auth, payloads) dans{" "}
            <code className="fx-num rounded bg-white/70 px-1">lib/providers/navex.ts</code> (fichier à créer) et documenter dans{" "}
            <code className="fx-num rounded bg-white/70 px-1">docs/navex.md</code>. Le mock adapter actuel permet de tester le flux
            sans credentials.
          </p>
        </div>
      </Card>
    </>
  );
}
