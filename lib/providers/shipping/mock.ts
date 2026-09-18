import { sleep } from "../../utils";
import type { ShippingProvider, ShipmentResult, ShipmentRequest } from "./types";

/**
 * Mock provider — development & testing only.
 * Simulates a realistic API carrier with latency and deterministic refs.
 * Never exposed to merchant UI outside dev mode.
 */
export const mockProvider: ShippingProvider = {
  key: "mock",
  label: "Mock (développement)",
  configFields: [],
  statusNote: "Fournisseur simulé pour le développement et les tests.",

  async testConnection() {
    await sleep(120);
    return { ok: true, message: "Connexion simulée réussie (mock)." };
  },

  async createShipment(_config, req: ShipmentRequest): Promise<ShipmentResult> {
    await sleep(300);
    const ref = "MOCK-" + req.orderNumber;
    return {
      providerShipmentId: ref,
      trackingNumber: "TRK" + String(Math.abs(hash(req.orderId)) % 10_000_000).padStart(7, "0"),
      status: "accepted",
    };
  },

  async cancelShipment(_config, ref) {
    return { ok: true, message: `Expédition ${ref} annulée (mock).` };
  },

  async getTrackingStatus(_config, ref) {
    return { ok: true, status: "in_transit", message: `Statut simulé de ${ref} : en transit.` };
  },

  async listOffices(_config, wilayaCode) {
    return {
      ok: true,
      offices: [
        { id: "1", name: `Bureau central — Wilaya ${wilayaCode}`, wilaya: `Wilaya ${wilayaCode}`, address: "Adresse simulée" },
        { id: "2", name: `Bureau annexe — Wilaya ${wilayaCode}`, wilaya: `Wilaya ${wilayaCode}`, address: "Adresse simulée" },
      ],
      message: null,
    };
  },

  async validateDestination() {
    return { ok: true, message: "Destination valide (mock)." };
  },
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}
