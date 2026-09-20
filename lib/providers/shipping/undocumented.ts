import { err } from "../../errors";
import type { ShippingProvider } from "./types";

export function createUndocumentedProvider(key: string, label: string): ShippingProvider {
  return {
    key,
    label,
    configFields: [
      { key: "api_key", label: "API Key", secret: true, placeholder: "Fournie par la société de livraison" },
      { key: "api_token", label: "API Token", secret: true, placeholder: "Fourni par la société de livraison" },
      { key: "api_base_url", label: "URL API", secret: false, placeholder: "URL officielle si nécessaire" },
      { key: "account", label: "Compte / référence client", secret: false, placeholder: "Optionnel" },
    ],
    statusNote:
      "Adaptateur prêt côté FlexiGo, mais les endpoints officiels ne sont pas intégrés sans documentation API vérifiée. Le mode manuel reste disponible.",

    async testConnection(config) {
      if (!config.api_base_url) {
        return { ok: false, message: "Renseignez l'URL API officielle pour effectuer un test de joignabilité." };
      }
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        await fetch(config.api_base_url, { method: "GET", signal: controller.signal });
        clearTimeout(timer);
        return {
          ok: true,
          message: "Serveur joignable. Les opérations automatiques seront activées après intégration de la documentation API officielle.",
        };
      } catch {
        return { ok: false, message: "Serveur non joignable. Vérifiez l'URL de base ou utilisez le mode manuel." };
      }
    },

    async createShipment() {
      throw err("UNSUPPORTED", `${label} : envoi automatique non activé sans documentation API officielle.`);
    },
    async cancelShipment() {
      return { ok: false, message: `${label} : annulation automatique non activée.` };
    },
    async getTrackingStatus() {
      return { ok: false, status: null, message: `${label} : suivi automatique non activé.` };
    },
    async listOffices() {
      return { ok: false, offices: [], message: `${label} : liste des bureaux non intégrée sans documentation officielle.` };
    },
    async validateDestination() {
      return { ok: true, message: "Destination acceptée côté FlexiGo; validation transporteur non disponible." };
    },
  };
}
