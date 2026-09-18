/**
 * Shipping provider adapter interface.
 *
 * The platform is deliberately decoupled from any single delivery company:
 * every provider implements this interface. New Algerian carriers
 * (Yalidine, Ecotrack, ZR Express, …) plug in as new adapters — no app
 * changes required.
 *
 * Credentials are stored ENCRYPTED (fxenc1) in shipping_integrations.config
 * and only ever decrypted inside server-side adapter calls. They are never
 * returned to the browser (masked in API responses).
 */

export interface ShipmentRequest {
  orderId: string;
  orderNumber: string;
  storeName: string;
  customerName: string;
  phone: string;
  wilayaCode: number;
  wilayaName: string;
  commune: string;
  address: string | null;
  deliveryType: "home" | "office";
  office: string | null;
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
  totalCents: number;
}

export interface ShipmentResult {
  providerShipmentId: string | null;
  trackingNumber: string | null;
  status: string;
  raw?: Record<string, unknown>;
}

export interface ProviderTestResult {
  ok: boolean;
  message: string;
}

export interface OfficeInfo {
  id: string | null;
  name: string;
  wilaya: string;
  address: string | null;
}

export type DecryptedConfig = Record<string, string>;

export interface ShippingProvider {
  key: string;
  label: string;
  /** UI hint: which config fields the merchant must fill. */
  configFields: Array<{ key: string; label: string; secret: boolean; placeholder?: string }>;
  /** Human note shown when automatic features are not wired yet. */
  statusNote: string | null;

  testConnection(config: DecryptedConfig): Promise<ProviderTestResult>;
  createShipment(config: DecryptedConfig, req: ShipmentRequest): Promise<ShipmentResult>;
  cancelShipment(config: DecryptedConfig, ref: string): Promise<ProviderTestResult>;
  getTrackingStatus(config: DecryptedConfig, ref: string): Promise<{ ok: boolean; status: string | null; message: string }>;
  listOffices(config: DecryptedConfig, wilayaCode: number): Promise<{ ok: boolean; offices: OfficeInfo[]; message: string | null }>;
  validateDestination(config: DecryptedConfig, req: ShipmentRequest): Promise<ProviderTestResult>;
}
