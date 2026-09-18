/**
 * Google Sheets integration service (order export/sync).
 *
 * Architecture:
 * - Service-account credentials are provided by the merchant (or Super
 *   Admin), validated as JSON, and stored ENCRYPTED (fxenc1). They never
 *   leave the server and are masked in every API response.
 * - Syncs are recorded in integration_logs (success/failure + message) so
 *   Super Admin can inspect failures on the Santé système / Intégrations
 *   pages.
 *
 * Wiring status: the adapter below is complete in structure. The actual
 * Google Sheets API call requires the OAuth token exchange for the service
 * account; the integration point is marked with `TODO(google-oauth)` and is
 * isolated in ONE function — plugging it in later does not touch the rest.
 *
 * In the meantime, CSV export works end-to-end without any credentials
 * (see /api/merchant/orders/export-csv) — a real, non-fake fallback.
 */
import { err } from "../errors";

export interface SheetsConfig {
  spreadsheetId: string | null;
  serviceAccountJson: string | null; // decrypted at call time only
  fields: string[];
}

export interface SheetsSyncResult {
  ok: boolean;
  message: string;
  rowsAffected?: number;
}

/** Validate a service account JSON payload (shape only — no secrets stored). */
export function validateServiceAccountJson(raw: string): { ok: boolean; message: string; projectId?: string } {
  if (!raw || !raw.trim()) return { ok: true, message: "Aucun compte de service." };
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (typeof obj !== "object") return { ok: false, message: "JSON invalide." };
    const needed = ["type", "project_id", "private_key_id", "client_email", "private_key"];
    for (const k of needed) {
      if (typeof obj[k] !== "string") return { ok: false, message: `Champ manquant dans le compte de service : ${k}` };
    }
    return { ok: true, message: "Compte de service valide.", projectId: obj.project_id as string };
  } catch {
    return { ok: false, message: "Le JSON du compte de service est invalide." };
  }
}

/**
 * Append order rows to the configured spreadsheet.
 *
 * TODO(google-oauth): implement the service-account token exchange
 * (https://oauth2.googleapis.com/token, grant_type=jwt signed with the
 * private key) and the Sheets values:appendBatch call
 * (https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}:append).
 * Both endpoints are stable Google documentation — implement there, not
 * elsewhere in the codebase.
 */
export async function syncOrdersToSheets(config: SheetsConfig, _orders: unknown[]): Promise<SheetsSyncResult> {
  if (!config.serviceAccountJson) {
    throw err("CONFIG_MISSING", "Renseignez le compte de service Google pour activer la synchronisation Sheets.");
  }
  validateServiceAccountJson(config.serviceAccountJson);
  // Isolated extension point — see file header for the documented endpoints.
  throw err(
    "UNSUPPORTED",
    "La synchronisation Google Sheets attend la connectivité OAuth du compte de service (voir lib/providers/sheets.ts). L'export CSV reste disponible immédiatement.",
  );
}
