/**
 * Google Sheets integration — server-side ONLY.
 *
 * Zero-dependency client for the Google Sheets v4 API using a service account:
 * - RS256 JWT signed with node:crypto (no googleapis dependency)
 * - token exchange at oauth2.googleapis.com
 * - values.append for order export / status sync
 *
 * The service-account JSON is stored ENCRYPTED (fxenc1) in
 * google_sheet_integrations.credential_encrypted and only ever decrypted in
 * this file. It is never returned to the browser.
 */
import { createSign } from "node:crypto";
import { getAdminSupabase } from "../supabase/admin";
import { decryptSecret } from "../crypto/encrypt";
import type { OrderRow } from "../supabase/database.types";
import { ORDER_STATUS_LABELS, type OrderStatus } from "../types";

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id?: string;
}

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

export function parseServiceAccount(json: string): ServiceAccount {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error("Le JSON du compte de service est invalide.");
  }
  if (typeof obj.client_email !== "string" || !obj.client_email.includes("@")) {
    throw new Error("Compte de service : client_email manquant.");
  }
  if (typeof obj.private_key !== "string" || !obj.private_key.includes("PRIVATE KEY")) {
    throw new Error("Compte de service : private_key manquant.");
  }
  return {
    client_email: obj.client_email,
    private_key: obj.private_key,
    token_uri: typeof obj.token_uri === "string" ? obj.token_uri : undefined,
    project_id: typeof obj.project_id === "string" ? obj.project_id : undefined,
  };
}

/** Sign an RS256 JWT for the OAuth2 token exchange. */
function signJwt(sa: ServiceAccount, expSec: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: sa.token_uri ?? TOKEN_URI,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expSec,
    }),
  ).toString("base64url");
  const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(sa.private_key, "base64url");
  return `${header}.${payload}.${signature}`;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const jwt = signJwt(sa, 3600);
  const res = await fetch(sa.token_uri ?? TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Authentification Google échouée : ${data.error_description ?? data.error ?? `HTTP ${res.status}`}`);
  }
  return data.access_token;
}

async function appendRows(token: string, spreadsheetId: string, range: string, rows: Array<Array<string | number>>): Promise<void> {
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(`Google Sheets : ${data.error?.message ?? `HTTP ${res.status}`}`);
  }
}

export interface SheetSyncResult {
  ok: boolean;
  rowsWritten: number;
  message: string;
}

/**
 * Export/sync store orders to the configured spreadsheet.
 * Orders are selected by creation date >= last_synced_at (or all on first run),
 * so re-runs are incremental and idempotent enough for a status mirror.
 */
export async function syncStoreOrders(args: {
  storeId: string;
  spreadsheetId: string;
  credentialEncrypted: string | null;
  fields: string[];
  lastSyncedAt: string | null;
  actorId: string | null;
  supportSessionId?: string | null;
}): Promise<SheetSyncResult> {
  const { storeId, spreadsheetId, credentialEncrypted, fields, lastSyncedAt, actorId } = args;
  if (!credentialEncrypted) throw new Error("Aucun compte de service configuré.");

  const saJson = decryptSecret(credentialEncrypted);
  if (!saJson) throw new Error("Déchiffrement du compte de service impossible.");
  const sa = parseServiceAccount(saJson);

  const admin = getAdminSupabase();
  const since = lastSyncedAt ?? new Date(0).toISOString();
  const q = admin.from("orders").select("*").eq("store_id", storeId).gte("created_at", since).order("created_at", { ascending: true });
  const { data: orders, error: ordersError } = await q;
  if (ordersError) throw new Error(`Lecture des commandes échouée : ${ordersError.message}`);
  const list = (orders ?? []) as OrderRow[];

  // Full column set; `fields` (when configured) selects a subset by index.
  const columns: Array<{ key: string; label: string; value: (o: OrderRow) => string | number }> = [
    { key: "numero", label: "N°", value: (o) => o.order_number },
    { key: "nom", label: "Nom", value: (o) => o.full_name },
    { key: "telephone", label: "Téléphone", value: (o) => o.phone },
    { key: "wilaya", label: "Wilaya", value: (o) => o.wilaya },
    { key: "commune", label: "Commune", value: (o) => o.commune },
    { key: "livraison", label: "Livraison", value: (o) => (o.delivery_type === "office" ? `Bureau ${o.office ?? ""}` : "Domicile") },
    { key: "sous_total", label: "Sous-total (DA)", value: (o) => o.subtotal_cents / 100 },
    { key: "frais", label: "Frais (DA)", value: (o) => o.shipping_fee_cents / 100 },
    { key: "total", label: "Total (DA)", value: (o) => o.total_cents / 100 },
    { key: "statut", label: "Statut", value: (o) => ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status },
    { key: "creee", label: "Créée le", value: (o) => o.created_at },
  ];
  const selected = fields.length > 0 ? columns.filter((c) => fields.includes(c.key)) : columns;
  const header: Array<string | number> = selected.map((c) => c.label);
  const rows: Array<Array<string | number>> = list.map((o) => selected.map((c) => c.value(o)));

  if (rows.length === 0) {
    return { ok: true, rowsWritten: 0, message: "Aucune commande à synchroniser." };
  }

  const token = await getAccessToken(sa);
  const range = "Commandes!A1";
  let written = 0;
  // First chunk carries the header; 100-row batches stay far below API limits.
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await appendRows(token, spreadsheetId, range, i === 0 ? [header, ...chunk] : chunk);
    written += chunk.length;
  }

  // Log the sync (integration_logs) — the merchant-visible sync history.
  const now = new Date().toISOString();
  await admin.from("integration_logs").insert({
    store_id: storeId,
    integration_type: "google_sheets",
    action: "sync",
    status: "success",
    message: `${written} commande(s) synchronisée(s)`,
    details: { rows: written, spreadsheet_id: spreadsheetId },
    created_at: now,
  });
  await admin.from("google_sheet_integrations").update({
    last_synced_at: now,
    last_status: "success",
    last_error: null,
    updated_at: now,
  }).eq("store_id", storeId);
  void actorId; // actor captured by the calling audit log

  return { ok: true, rowsWritten: written, message: `${written} commande(s) synchronisée(s) vers Google Sheets.` };
}

/** Record a failed sync attempt (never silent). */
export async function logSheetFailure(storeId: string, message: string): Promise<void> {
  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  await admin.from("integration_logs").insert({
    store_id: storeId,
    integration_type: "google_sheets",
    action: "sync",
    status: "failure",
    message,
    details: null,
    created_at: now,
  });
  await admin.from("google_sheet_integrations").update({
    last_status: "failure",
    last_error: message.slice(0, 500),
    updated_at: now,
  }).eq("store_id", storeId);
}
