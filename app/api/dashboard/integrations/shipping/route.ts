import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { getProvider, decryptConfig } from "@/lib/providers/shipping";
import { encryptSecret, maskSecret } from "@/lib/crypto/encrypt";
import { SHIPPING_PROVIDER_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET the store's shipping provider list with MASKED config (secrets never
 * returned to the browser — only a short masked preview).
 */
export async function GET() {
  try {
    const ctx = await getMerchantContext();
    const admin = getAdminSupabase();

    const { data: rows, error } = await admin
      .from("shipping_integrations")
      .select("*")
      .eq("store_id", ctx.store.id);
    if (error) throw error;

    const byKey = new Map(((rows ?? []) as Array<Record<string, unknown>>).map((r) => [r.provider_key as string, r]));

    const providers = SHIPPING_PROVIDER_KEYS.map((key) => {
      const provider = getProvider(key);
      const row = byKey.get(key);
      const config = row ? decryptConfig(row.config as Record<string, unknown> | null) : {};
      const fields = provider.configFields.map((f) => ({
        key: f.key,
        label: f.label,
        secret: f.secret,
        // Only a masked preview is ever sent to the browser.
        value: f.secret ? maskSecret(config[f.key] ?? null) : (config[f.key] ?? ""),
      }));
      return {
        key,
        label: provider.label,
        statusNote: provider.statusNote,
        fields,
        is_active: (row?.is_active as boolean) ?? false,
        status: (row?.status as string) ?? "unconfigured",
        last_tested_at: (row?.last_tested_at as string | null) ?? null,
        last_error: (row?.last_error as string | null) ?? null,
      };
    });

    return NextResponse.json({ ok: true, providers });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * PUT a provider's config. Secrets are ENCRYPTED server-side before storage;
 * an empty secret value clears it. Also sets the active provider.
 * capability: shipping.manage
 */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "shipping.manage");

    const bodySchema = z.object({
      provider_key: z.enum(SHIPPING_PROVIDER_KEYS),
      is_active: z.boolean().default(false),
      fields: z
        .record(z.string(), z.string())
        .optional()
        .default({}),
    });
    const input = bodySchema.parse(await req.json().catch(() => null));
    const provider = getProvider(input.provider_key);

    // Only accept fields the provider declares — no arbitrary keys.
    const config: Record<string, string> = {};
    for (const f of provider.configFields) {
      const raw = (input.fields[f.key] ?? "").trim();
      if (f.secret) {
        // A masked/unchanged value (or empty) keeps existing; a fresh value is encrypted.
        config[f.key] = raw && !raw.startsWith("•") ? encryptSecret(raw) : "";
      } else {
        config[f.key] = raw;
      }
    }

    const admin = getAdminSupabase();
    const hasAny = provider.configFields.length === 0 || Object.values(config).some((v) => v.length > 0);

    const { error } = await admin
      .from("shipping_integrations")
      .upsert(
        {
          store_id: ctx.store.id,
          provider_key: input.provider_key,
          is_active: input.is_active,
          config: config as unknown as Record<string, unknown>,
          status: hasAny ? "configured" : "unconfigured",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id,provider_key", ignoreDuplicates: false },
      );
    if (error) throw error;

    // If this provider became active, deactivate others.
    if (input.is_active) {
      await admin
        .from("shipping_integrations")
        .update({ is_active: false })
        .eq("store_id", ctx.store.id)
        .neq("provider_key", input.provider_key);
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.changed",
      entity: "shipping_integration",
      entityId: `${ctx.store.id}:${input.provider_key}`,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { provider: input.provider_key, is_active: input.is_active, fields: Object.keys(config) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * POST test the connection for a provider using its stored (decrypted) config.
 * capability: shipping.manage. Result + last_tested_at persisted.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "shipping.manage");

    const body = z.object({ provider_key: z.enum(SHIPPING_PROVIDER_KEYS) }).parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: row, error: rowError } = await admin
      .from("shipping_integrations")
      .select("id, config")
      .eq("store_id", ctx.store.id)
      .eq("provider_key", body.provider_key)
      .maybeSingle();
    if (rowError) throw rowError;

    const provider = getProvider(body.provider_key);
    const config = row ? decryptConfig((row as { config: Record<string, unknown> | null }).config) : {};
    const result = await provider.testConnection(config);

    const { error: updError } = await admin
      .from("shipping_integrations")
      .update({
        status: result.ok ? "configured" : "error",
        last_tested_at: new Date().toISOString(),
        last_error: result.ok ? null : result.message,
      })
      .eq("store_id", ctx.store.id)
      .eq("provider_key", body.provider_key);
    if (updError) throw updError;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.tested",
      entity: "shipping_integration",
      entityId: `${ctx.store.id}:${body.provider_key}`,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { provider: body.provider_key, ok: result.ok },
    });

    if (!result.ok) throw err("INTEGRATION_ERROR", result.message);
    return NextResponse.json({ ok: true, message: result.message });
  } catch (e) {
    return toErrorResponse(e);
  }
}
