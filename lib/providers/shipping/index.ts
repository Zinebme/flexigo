/**
 * Shipping provider registry.
 * Adding a carrier (Yalidine, Ecotrack, ZR Express, …) = new file here +
 * one entry in SHIPPING_PROVIDERS + its key in the DB check constraint.
 */
import { manualProvider } from "./manual";
import { navexProvider } from "./navex";
import { mockProvider } from "./mock";
import { createUndocumentedProvider } from "./undocumented";
import type { ShippingProvider, DecryptedConfig, ShipmentRequest, ShipmentResult } from "./types";
import { decryptSecret } from "../../crypto/encrypt";
import { err } from "../../errors";

export const SHIPPING_PROVIDERS: Record<string, ShippingProvider> = {
  manual: manualProvider,
  navex: navexProvider,
  yalidine: createUndocumentedProvider("yalidine", "Yalidine"),
  guepex: createUndocumentedProvider("guepex", "Guepex"),
  yalitec: createUndocumentedProvider("yalitec", "Yalitec"),
  ecotrack: createUndocumentedProvider("ecotrack", "Ecotrack"),
  zr: createUndocumentedProvider("zr", "ZR Express"),
  ecom_delivery: createUndocumentedProvider("ecom_delivery", "E-com Delivery V2"),
  abex: createUndocumentedProvider("abex", "Abex Express"),
  colireli: createUndocumentedProvider("colireli", "ColiReli"),
  colireli_ecotrack: createUndocumentedProvider("colireli_ecotrack", "ColiReli Ecotrack"),
  isr: createUndocumentedProvider("isr", "ISR Services"),
  leopard: createUndocumentedProvider("leopard", "Leopard Express"),
  generic: createUndocumentedProvider("generic", "Transporteur générique"),
  mock: mockProvider,
};

export { type ShippingProvider, type ShipmentRequest, type ShipmentResult, type ProviderTestResult, type OfficeInfo } from "./types";

/** Decrypt an encrypted config row into a plain object for adapter use. */
export function decryptConfig(config: Record<string, unknown> | null): DecryptedConfig {
  const out: DecryptedConfig = {};
  if (!config) return out;
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === "string") out[k] = decryptSecret(v) ?? v;
    else if (v === null || v === undefined) out[k] = "";
    else out[k] = String(v);
  }
  return out;
}

export function getProvider(key: string): ShippingProvider {
  const provider = SHIPPING_PROVIDERS[key];
  if (!provider) throw err("UNSUPPORTED", `Fournisseur inconnu : ${key}`);
  return provider;
}

/** Send an order to the configured carrier (server-side only). */
export async function sendShipment(args: {
  providerKey: string;
  config: Record<string, unknown> | null;
  req: ShipmentRequest;
}): Promise<ShipmentResult> {
  const provider = getProvider(args.providerKey);
  const config = decryptConfig(args.config);
  return provider.createShipment(config, args.req);
}
