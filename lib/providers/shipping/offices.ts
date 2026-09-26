import { getAdminSupabase } from "@/lib/supabase/admin";
import { decryptConfig, getProvider, providerCapabilities } from "@/lib/providers/shipping";
import type { StoreSettings } from "@/lib/supabase/database.types";

export interface AvailableOffice { value: string; name: string; address: string; wilaya: string }
export interface SavedPickupOffice { wilaya_code: number; name: string; address: string }

export function parseSavedPickupOffices(config: unknown): SavedPickupOffice[] {
  const raw = config && typeof config === "object" && "pickup_offices" in config ? (config as { pickup_offices?: unknown }).pickup_offices : null;
  if (!Array.isArray(raw)) return [];
  return raw.filter((row): row is SavedPickupOffice =>
    !!row && typeof row === "object" && Number.isInteger(row.wilaya_code) && row.wilaya_code >= 1 && row.wilaya_code <= 58 &&
    typeof row.name === "string" && row.name.trim().length > 0 && typeof row.address === "string" && row.address.trim().length > 0,
  );
}

/** Office delivery is a valid choice when the store enables it and sets a fee for the destination. */
export async function isOfficeDeliveryAvailable(storeId: string, wilayaCode: number): Promise<boolean> {
  const admin = getAdminSupabase();
  const [{ data: store, error: storeError }, { data: zones, error: zoneError }] = await Promise.all([
    admin.from("stores").select("settings").eq("id", storeId).maybeSingle(),
    admin.from("shipping_zones").select("wilaya_code, office_fee_cents, is_active").eq("store_id", storeId).in("wilaya_code", [wilayaCode, 0]),
  ]);
  if (storeError) throw storeError;
  if (zoneError) throw zoneError;
  const settings = store?.settings as StoreSettings | null;
  if (!store || settings?.business?.office_delivery_enabled === false) return false;
  const zone = zones?.find((row) => row.is_active && row.wilaya_code === wilayaCode) ?? zones?.find((row) => row.is_active && row.wilaya_code === 0);
  return zone?.office_fee_cents != null;
}

/** Returns only real addresses from an adapter or offices saved by Super Admin. */
export async function getAvailableOffices(storeId: string, wilayaCode: number): Promise<AvailableOffice[]> {
  if (!await isOfficeDeliveryAvailable(storeId, wilayaCode)) return [];
  const admin = getAdminSupabase();
  const [{ data: integration, error }, { data: manual, error: manualError }] = await Promise.all([
    admin.from("shipping_integrations").select("provider_key, status, config").eq("store_id", storeId).eq("is_active", true).limit(1).maybeSingle(),
    admin.from("shipping_integrations").select("config").eq("store_id", storeId).eq("provider_key", "manual").maybeSingle(),
  ]);
  if (error) throw error;
  if (manualError) throw manualError;
  if (integration?.status === "configured" && providerCapabilities(integration.provider_key).officeLookup) {
    const result = await getProvider(integration.provider_key).listOffices(decryptConfig(integration.config as Record<string, unknown> | null), wilayaCode);
    if (result.ok) return result.offices.filter((office) => office.name?.trim() && office.address?.trim()).map((office) => ({
      name: office.name.trim(), address: office.address!.trim(), wilaya: office.wilaya,
      value: `${office.name.trim()} — ${office.address!.trim()}`.slice(0, 120),
    }));
  }
  return parseSavedPickupOffices(manual?.config).filter((office) => office.wilaya_code === wilayaCode)
    .map((office) => ({ name: office.name.trim(), address: office.address.trim(), wilaya: String(wilayaCode),
      value: `${office.name.trim()} — ${office.address.trim()}` }));
}
