import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { formatDateFr } from "@/lib/utils";
import { getProvider, decryptConfig } from "@/lib/providers/shipping";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { ZonesEditor } from "@/components/dashboard/zones-editor";
import { ManualShippingMode, ShippingProviderForm, type ProviderInfo } from "@/components/dashboard/shipping-provider-form";
import { SHIPPING_PROVIDER_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LivraisonPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const canManage = can(ctx.role, "shipping.manage");

  const [zonesRes, integrationsRes, shipmentsRes] = await Promise.all([
    admin.from("shipping_zones").select("*").eq("store_id", ctx.store.id).order("wilaya_code", { ascending: true }),
    admin.from("shipping_integrations").select("*").eq("store_id", ctx.store.id),
    admin.from("shipments").select("*").eq("store_id", ctx.store.id).order("created_at", { ascending: false }).limit(15),
  ]);
  const shipments = (shipmentsRes.data ?? []) as Array<{ id: string; order_id: string; provider_key: string; status: string; tracking_number: string | null; provider_shipment_id: string | null; created_at: string }>;
  let orderNumbers = new Map<string, string>();
  if (shipments.length > 0) {
    const ids = shipments.map((s) => s.order_id);
    const { data: orders } = await admin.from("orders").select("id, order_number").in("id", ids);
    orderNumbers = new Map(((orders ?? []) as Array<{ id: string; order_number: string }>).map((o) => [o.id, o.order_number]));
  }
  const zones = zonesRes.data;
  const integrations = integrationsRes.data;

  // Build the provider list (mask secrets before sending to the browser).
  const byKey = new Map(((integrations ?? []) as Array<Record<string, unknown>>).map((r) => [r.provider_key as string, r]));
  const providers: ProviderInfo[] = SHIPPING_PROVIDER_KEYS.map((key) => {
    const provider = getProvider(key);
    const row = byKey.get(key);
    const config = row ? decryptConfig(row.config as Record<string, unknown> | null) : {};
    return {
      key,
      label: provider.label,
      statusNote: provider.statusNote,
      fields: provider.configFields.map((f) => ({
        key: f.key,
        label: f.label,
        secret: f.secret,
        value: f.secret ? (config[f.key] ? "••••••••" : "") : (config[f.key] ?? ""),
        placeholder: f.placeholder,
      })),
      is_active: (row?.is_active as boolean) ?? false,
      status: (row?.status as string) ?? "unconfigured",
      last_tested_at: (row?.last_tested_at as string | null) ?? null,
      last_error: (row?.last_error as string | null) ?? null,
    };
  });

  return (
    <>
      <PageHeader title="Livraison" subtitle="Zones de frais par wilaya, transporteur actif et expéditions." />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Livraison manuelle" subtitle="Tarifs par wilaya, sans connexion API." />
          <ManualShippingMode active={Boolean(byKey.get("manual")?.is_active) || !Array.from(byKey.values()).some(row=>row.is_active)} canManage={canManage} />
          <ZonesEditor
            canManage={canManage}
            initial={((zones ?? []) as Array<{ wilaya_code: number; home_fee_cents: number | null; office_fee_cents: number | null; is_active: boolean }>).map((z) => ({ ...z }))}
          />
        </Card>

        <Card>
          <CardHeader title="Transporteur API" subtitle="Connexion et activation d'un prestataire. Les jetons restent chiffrés côté serveur." />
          <ShippingProviderForm providers={providers} canManage={canManage} />
        </Card>

        <Card>
          <CardHeader title="Dernières expéditions" />
          {shipments && shipments.length > 0 ? (
            <Table head={<><Th>N° commande</Th><Th>Transporteur</Th><Th>Réf.</Th><Th>Statut</Th><Th>Créée</Th></>}>
              {(shipments as Array<Record<string, unknown>>).map((s) => (
                <tr key={s.id as string} className="transition hover:bg-slate-50">
                  <Td className="font-medium text-slate-800">
                    {orderNumbers.get(s.order_id as string) ?? "—"}
                  </Td>
                  <Td className="text-slate-600">{s.provider_key as string}</Td>
                  <Td className="font-mono text-xs text-slate-600">{(s.tracking_number as string) ?? (s.provider_shipment_id as string) ?? "—"}</Td>
                  <Td><Badge tone={s.status === "accepted" ? "green" : "gray"}>{s.status as string}</Badge></Td>
                  <Td className="text-slate-500">{formatDateFr(s.created_at as string)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState icon="🚚" title="Aucune expédition" text="Envoyez une commande au transporteur depuis sa fiche pour la voir ici." />
          )}
        </Card>
      </div>
    </>
  );
}
