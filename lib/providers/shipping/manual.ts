import type { ShippingProvider, ShipmentResult, ShipmentRequest } from "./types";

/**
 * Manual provider: the merchant registers the shipment themselves with
 * whatever carrier they use. Fully functional, zero credentials.
 * "Envoyer au transporteur" in this mode simply marks the order as shipped
 * with an optional manual tracking number.
 */
export const manualProvider: ShippingProvider = {
  key: "manual",
  label: "Envoi manuel",
  configFields: [],
  statusNote: null,

  async testConnection() {
    return { ok: true, message: "Le mode manuel ne nécessite aucune configuration." };
  },

  async createShipment(_config, req: ShipmentRequest): Promise<ShipmentResult> {
    return {
      providerShipmentId: "manual-" + req.orderId.slice(0, 8),
      trackingNumber: null,
      status: "manual_pending",
    };
  },

  async cancelShipment() {
    return { ok: true, message: "Annulation enregistrée (envoi manuel)." };
  },

  async getTrackingStatus() {
    return { ok: true, status: "manual", message: "Suivi manuel — aucun suivi automatique." };
  },

  async listOffices() {
    return { ok: false, offices: [], message: "Le mode manuel ne fournit pas de liste de bureaux." };
  },

  async validateDestination() {
    return { ok: true, message: "Destination valide." };
  },
};
