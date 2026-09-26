import { getAdminSupabase } from "@/lib/supabase/admin";
import { decryptConfig, getProvider, providerCapabilities } from "@/lib/providers/shipping";

export interface AvailableOffice { value: string; name: string; address: string; wilaya: string }

/** Never expose carrier credentials. Only real, addressed offices are offered. */
export async function getAvailableOffices(storeId: string, wilayaCode: number): Promise<AvailableOffice[]> {
  const admin = getAdminSupabase();
  const { data: zones, error: zoneError } = await admin.from("shipping_zones")
    .select("wilaya_code, office_fee_cents, is_active").eq("store_id", storeId).in("wilaya_code", [wilayaCode, 0]);
  if (zoneError) throw zoneError;
  const zone = zones?.find((row) => row.wilaya_code === wilayaCode) ?? zones?.find((row) => row.wilaya_code === 0);
  if (!zone?.is_active || zone.office_fee_cents == null) return [];
  const { data: integration, error } = await admin.from("shipping_integrations")
    .select("provider_key, status, config").eq("store_id", storeId).eq("is_active", true).limit(1).maybeSingle();
  if (error) throw error;
  if (!integration || integration.status !== "configured" || !providerCapabilities(integration.provider_key).officeLookup) return [];
  const result = await getProvider(integration.provider_key).listOffices(decryptConfig(integration.config as Record<string, unknown> | null), wilayaCode);
  if (!result.ok) return [];
  return result.offices.filter((office) => office.name?.trim() && office.address?.trim())
    .map((office) => ({
      name: office.name.trim(), address: office.address!.trim(), wilaya: office.wilaya,
      value: `${office.name.trim()} — ${office.address!.trim()}`.slice(0, 120),
    }));
}
