import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { syncStoreOrders, logSheetFailure } from "@/lib/integrations/sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Run the Google Sheets order sync (capability: marketing.manage).
 * Server-side only: credential decrypted here, orders exported, every attempt
 * (success OR failure) logged in integration_logs + audit.
 */
export async function POST() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");

    const admin = getAdminSupabase();
    const { data: row, error: rowError } = await admin
      .from("google_sheet_integrations")
      .select("*")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (rowError) throw rowError;

    const r = (row ?? null) as {
      spreadsheet_id: string | null;
      credential_encrypted: string | null;
      fields: string[];
      last_synced_at: string | null;
    } | null;
    if (!r) throw err("CONFIG_MISSING", "Configurez d'abord Google Sheets (identifiant du classeur + compte de service).");
    if (!r.spreadsheet_id || !r.credential_encrypted) {
      throw err("CONFIG_MISSING", "Configuration incomplète : identifiant du classeur et compte de service requis.");
    }

    try {
      const result = await syncStoreOrders({
        storeId: ctx.store.id,
        spreadsheetId: r.spreadsheet_id,
        credentialEncrypted: r.credential_encrypted,
        fields: r.fields,
        lastSyncedAt: r.last_synced_at,
        actorId: ctx.user.id,
        supportSessionId: ctx.supportSession?.id ?? null,
      });

      void logAudit({
        actorId: ctx.user.id,
        storeId: ctx.store.id,
        action: "integration.changed",
        entity: "google_sheets_integration",
        entityId: ctx.store.id,
        supportSessionId: ctx.supportSession?.id ?? null,
        metadata: { op: "sync", rows: result.rowsWritten },
      });

      return NextResponse.json({ ok: true, rowsWritten: result.rowsWritten, message: result.message });
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Échec de la synchronisation.";
      console.error("[flexigo:sheets] sync failed:", message);
      await logSheetFailure(ctx.store.id, message);
      void logAudit({
        actorId: ctx.user.id,
        storeId: ctx.store.id,
        action: "integration.changed",
        entity: "google_sheets_integration",
        entityId: ctx.store.id,
        supportSessionId: ctx.supportSession?.id ?? null,
        metadata: { op: "sync", failed: true },
      });
      throw err("UPSTREAM_ERROR", message);
    }
  } catch (e) {
    return toErrorResponse(e);
  }
}
