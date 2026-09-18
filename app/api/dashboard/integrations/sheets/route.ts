import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";
import { encryptSecret } from "@/lib/crypto/encrypt";
import { parseServiceAccount } from "@/lib/integrations/sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SHEET_COLUMNS = ["numero", "nom", "telephone", "email", "wilaya", "commune", "livraison", "sous_total", "frais", "total", "statut", "creee"];

const bodySchema = z.object({
  spreadsheet_id: z.string().trim().max(100).optional().or(z.literal("")).nullable(),
  service_account_json: z.string().trim().max(100_000).optional().or(z.literal("")).nullable(),
  fields: z.array(z.string().max(60)).max(20).default([]),
  is_active: z.boolean().default(false),
});

/**
 * Save the Google Sheets integration (capability: marketing.manage).
 * The service-account JSON is validated and ENCRYPTED before storage; an empty
 * value keeps the existing credential. The plaintext is NEVER returned later.
 */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = bodySchema.parse(body);
    const admin = getAdminSupabase();

    const { data: current } = await admin
      .from("google_sheet_integrations")
      .select("credential_encrypted")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    const currentEnc = (current as { credential_encrypted: string | null } | null)?.credential_encrypted ?? null;

    // Resolve the credential to store.
    let credential: string | null = currentEnc;
    const rawSa = (input.service_account_json ?? "").trim();
    if (rawSa.length > 0) {
      parseServiceAccount(rawSa); // throws a friendly error if invalid
      credential = encryptSecret(rawSa);
    }

    const fields = input.fields.filter((f) => SHEET_COLUMNS.includes(f));

    const { error } = await admin
      .from("google_sheet_integrations")
      .upsert(
        {
          store_id: ctx.store.id,
          spreadsheet_id: input.spreadsheet_id || null,
          credential_encrypted: credential,
          fields,
          is_active: input.is_active,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id", ignoreDuplicates: false },
      );
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.changed",
      entity: "google_sheets_integration",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { has_spreadsheet: Boolean(input.spreadsheet_id), credential_updated: rawSa.length > 0, is_active: input.is_active, fields: fields.length },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * Read the integration state (masked). capability: marketing.manage.
 */
export async function GET() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");
    const admin = getAdminSupabase();

    const { data: row, error } = await admin
      .from("google_sheet_integrations")
      .select("*")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (error) throw error;

    const hasCredential = Boolean(row && (row as { credential_encrypted: string | null }).credential_encrypted);
    return NextResponse.json({
      ok: true,
      integration: row
        ? {
            spreadsheet_id: (row as { spreadsheet_id: string | null }).spreadsheet_id,
            has_credential: hasCredential,
            fields: (row as { fields: string[] }).fields,
            is_active: (row as { is_active: boolean }).is_active,
            last_synced_at: (row as { last_synced_at: string | null }).last_synced_at,
            last_status: (row as { last_status: string | null }).last_status,
            last_error: (row as { last_error: string | null }).last_error,
          }
        : null,
      columns: SHEET_COLUMNS,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * Disconnect / reset (capability: marketing.manage).
 * Clears the encrypted credential and spreadsheet id — the merchant must
 * re-enter everything. Audited.
 */
export async function DELETE() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");
    const admin = getAdminSupabase();

    const { error } = await admin
      .from("google_sheet_integrations")
      .update({
        credential_encrypted: null,
        spreadsheet_id: null,
        fields: [],
        is_active: false,
        last_status: null,
        last_error: null,
        last_synced_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", ctx.store.id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.reset",
      entity: "google_sheets_integration",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
