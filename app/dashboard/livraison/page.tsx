import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { formatDateFr } from "@/lib/utils";
import { getProvider, providerCapabilities } from "@/lib/providers/shipping";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { ZonesEditor } from "@/components/dashboard/zones-editor";
import { ShippingModeSelector, type MerchantCarrier } from "@/components/dashboard/shipping-mode-selector";


export const dynamic = "force-dynamic";

export default async function LivraisonPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const canManage = can(ctx.role, "shipping.manage");

  const [zonesRes, integrationsRes, shipmentsRes] = await Promise.all([
    admin.from("shipping_zones").select("*").eq("store_id", ctx.store.id).order("wilaya_code", { ascending: true }),
    admin.from("shipping_integrations").select("provider_key, status, is_active").eq("store_id", ctx.store.id),
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

  const byKey = new Map(((integrations ?? []) as Array<{ provider_key: string; status: string; is_active: boolean }>).map(row => [row.provider_key, row]));
  const carriers: MerchantCarrier[] = ((integrations ?? []) as Array<{ provider_key: string; status: string; is_active: boolean }>)
    .filter(row => row.provider_key !== "manual" && row.provider_key !== "mock" && row.status === "configured")
    .map(row => ({ key: row.provider_key, label: getProvider(row.provider_key).label, isActive: row.is_active,
      automatic: providerCapabilities(row.provider_key).automaticShipments, officeLookup: providerCapabilities(row.provider_key).officeLookup }));
  const manualActive = !Array.from(byKey.values()).some(row => row.is_active && row.provider_key !== "manual");

  return (
    <>
      <PageHeader title="Livraison" subtitle="Mode actif, tarifs et suivi des expéditions." />

      <div className="space-y-4">
        <ShippingModeSelector manualActive={manualActive} carriers={carriers} canManage={canManage} manualContent={<ZonesEditor
          canManage={canManage}
          initial={((zones ?? []) as Array<{ wilaya_code: number; home_fee_cents: number | null; office_fee_cents: number | null; is_active: boolean }>).map(z => ({ ...z }))}
        />} />

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
            <EmptyState icon="🚚" title="Aucune expédition" text="Marquez une commande comme expédiée depuis sa fiche pour la voir ici." />
          )}
        </Card>
      </div>
    </>
  );
}
