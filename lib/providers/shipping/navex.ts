/**
 * NAVEX adapter — Algerian express carrier.
 *
 * ⚠️ IMPORTANT — documentation pending:
 * Navex has not published a stable, documented public API at the time of
 * writing. Per project security rules, we do NOT invent endpoints. This
 * adapter is fully wired for configuration, credential encryption,
 * connection testing (HTTP reachability of your base URL only) and the
 * shipment lifecycle — the actual HTTP calls are defined in the ENDPOINTS
 * map below. When you receive Navex's API documentation, paste the exact
 * paths into ENDPOINTS (or adjust the request builders) and set
 * ENDPOINTS_READY = true. No other file in the platform needs to change.
 *
 * Until then, "Envoyer au transporteur" works in MANUAL mode (the merchant
 * enters the tracking number by hand) — a fully supported, non-fake path.
 */
import { err } from "../../errors";
import type {
  ShippingProvider,
  ShipmentResult,
  ShipmentRequest,
  ProviderTestResult,
  DecryptedConfig,
} from "./types";

/**
 * Official Navex endpoints.
 * Paste the documented paths here. `null` = not documented yet.
 */
const ENDPOINTS = {
  ready: false,
  createShipment: null as string | null, // e.g. "/api/v1/shipments"
  cancelShipment: null as string | null,
  tracking: null as string | null,
  offices: null as string | null,
  validate: null as string | null,
};

async function navexFetch(config: DecryptedConfig, path: string, init?: RequestInit): Promise<unknown> {
  const base = (config.api_base_url ?? "").replace(/\/$/, "");
  if (!base) throw err("CONFIG_MISSING", "L'URL API Navex n'est pas configurée.");
  const res = await fetch(base + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(config.api_token ? { Authorization: `Bearer ${config.api_token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw err("INTEGRATION_ERROR", `Navex a répondu ${res.status}. Réessayez ou contactez le support.`);
  }
  return res.json();
}

export const navexProvider: ShippingProvider = {
  key: "navex",
  label: "Navex",
  configFields: [
    { key: "api_base_url", label: "URL de base de l'API", secret: false, placeholder: "https://api.navex.dz" },
    { key: "api_token", label: "Jeton API (API token)", secret: true, placeholder: "Fourni par Navex" },
    { key: "account", label: "Compte / référence client", secret: false, placeholder: "Ex : NAVEX-00123" },
  ],
  statusNote:
    "L'API officielle Navex n'est pas encore documentée : la configuration et le mode manuel sont prêts. Coller la documentation API dans lib/providers/shipping/navex.ts pour activer l'envoi automatique.",

  async testConnection(config): Promise<ProviderTestResult> {
    if (!config.api_base_url) {
      return { ok: false, message: "Renseignez l'URL de base de l'API pour tester la connexion." };
    }
    try {
      // Reachability check on the base URL ONLY — we do not call undocumented
      // endpoints. The purpose is to catch typos / firewall issues early.
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      await fetch(config.api_base_url, { method: "GET", signal: controller.signal });
      clearTimeout(t);
      return {
        ok: true,
        message: ENDPOINTS.ready
          ? "Connexion Navex OK."
          : "Serveur Navex joignable. Envoi automatique actif dès que l'API documentée sera configurée (mode manuel disponible immédiatement).",
      };
    } catch {
      return { ok: false, message: "Impossible de joindre le serveur Navex. Vérifiez l'URL de base et votre connexion réseau." };
    }
  },

  async createShipment(config, req): Promise<ShipmentResult> {
    if (!ENDPOINTS.ready || !ENDPOINTS.createShipment) {
      throw err(
        "UNSUPPORTED",
        "L'envoi automatique Navex n'est pas encore disponible : l'API officielle n'est pas configurée. Utilisez le mode manuel (numéro de suivi) ou le fournisseur Mock en développement.",
      );
    }
    const body = {
      reference: req.orderNumber,
      sender: { name: req.storeName },
      recipient: {
        name: req.customerName,
        phone: req.phone,
        wilaya: req.wilayaCode,
        commune: req.commune,
        address: req.address ?? req.commune,
        office: req.office,
      },
      items: req.items,
      cod_amount: req.totalCents,
    };
    const data = (await navexFetch(config, ENDPOINTS.createShipment, { method: "POST", body: JSON.stringify(body) })) as {
      shipment_id?: string;
      tracking_number?: string;
      status?: string;
    };
    return {
      providerShipmentId: data.shipment_id ?? null,
      trackingNumber: data.tracking_number ?? null,
      status: data.status ?? "accepted",
    };
  },

  async cancelShipment(config, ref): Promise<ProviderTestResult> {
    if (!ENDPOINTS.ready || !ENDPOINTS.cancelShipment) {
      throw err("UNSUPPORTED", "L'annulation Navex n'est pas encore disponible (API non configurée).");
    }
    await navexFetch(config, ENDPOINTS.cancelShipment, { method: "POST", body: JSON.stringify({ reference: ref }) });
    return { ok: true, message: "Expédition annulée chez Navex." };
  },

  async getTrackingStatus(config, ref) {
    if (!ENDPOINTS.ready || !ENDPOINTS.tracking) {
      return { ok: false, status: null, message: "Le suivi automatique Navex n'est pas encore disponible (API non configurée)." };
    }
    const data = (await navexFetch(config, ENDPOINTS.tracking, { method: "POST", body: JSON.stringify({ reference: ref }) })) as {
      status?: string;
      message?: string;
    };
    return { ok: true, status: data.status ?? null, message: data.message ?? "" };
  },

  async listOffices(config, wilayaCode) {
    if (!ENDPOINTS.ready || !ENDPOINTS.offices) {
      return { ok: false, offices: [], message: "La liste des bureaux Navex n'est pas encore disponible (API non configurée). Indiquez le bureau au client ou utilisez la livraison à domicile." };
    }
    const data = (await navexFetch(config, ENDPOINTS.offices, { method: "GET" })) as Array<{ id?: string; name?: string; wilaya?: string; address?: string }>;
    return {
      ok: true,
      offices: (data ?? []).map((o) => ({ id: o.id ?? null, name: o.name ?? "Bureau", wilaya: o.wilaya ?? `Wilaya ${wilayaCode}`, address: o.address ?? null })),
      message: null,
    };
  },

  async validateDestination(config, req): Promise<ProviderTestResult> {
    if (!ENDPOINTS.ready || !ENDPOINTS.validate) return { ok: true, message: "Destination plausible (validation Navex non configurée)." };
    await navexFetch(config, ENDPOINTS.validate, { method: "POST", body: JSON.stringify({ wilaya: req.wilayaCode, commune: req.commune }) });
    return { ok: true, message: "Destination valide chez Navex." };
  },
};
