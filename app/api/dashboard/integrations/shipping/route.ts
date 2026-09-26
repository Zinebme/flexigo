import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getProvider, providerCapabilities } from "@/lib/providers/shipping";
import { logAudit } from "@/lib/audit";
import { err, toErrorResponse } from "@/lib/errors";
import { SHIPPING_PROVIDER_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Merchant view: only the modes provisioned for this store, without credentials. */
export async function GET() {
  try {
    const ctx = await getMerchantContext();
    const admin = getAdminSupabase();
    const { data, error } = await admin.from("shipping_integrations")
      .select("provider_key, status, is_active").eq("store_id", ctx.store.id);
    if (error) throw error;
    const providers = (data ?? []).filter((row) => row.provider_key !== "manual" && row.provider_key !== "mock" && row.status === "configured")
      .map((row) => ({
        key: row.provider_key,
        label: getProvider(row.provider_key).label,
        is_active: row.is_active,
        automatic: providerCapabilities(row.provider_key).automaticShipments,
        office_lookup: providerCapabilities(row.provider_key).officeLookup,
      }));
    return NextResponse.json({ ok: true, manual_active: !data?.some((row) => row.is_active && row.provider_key !== "manual"), providers });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/** Merchants may select a provisioned working mode; only Super Admin manages credentials. */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "shipping.manage");
    const { provider_key } = z.object({ provider_key: z.enum(SHIPPING_PROVIDER_KEYS) }).parse(await req.json().catch(() => null));
    if (provider_key === "mock") throw err("UNSUPPORTED", "Le mode de démonstration n'est pas disponible.");
    const admin = getAdminSupabase();
    if (provider_key !== "manual") {
      const { data, error } = await admin.from("shipping_integrations").select("status")
        .eq("store_id", ctx.store.id).eq("provider_key", provider_key).maybeSingle();
      if (error) throw error;
      if (!data || data.status !== "configured") throw err("CONFIG_MISSING", "Ce transporteur n'a pas été configuré pour cette boutique.");
      if (!providerCapabilities(provider_key).automaticShipments) throw err("UNSUPPORTED", "L'API d'envoi de ce transporteur n'est pas encore opérationnelle. Utilisez le mode manuel.");
    }
    const { error: upsertError } = await admin.from("shipping_integrations").upsert({
      store_id: ctx.store.id,
      provider_key,
      is_active: true,
      ...(provider_key === "manual" ? { config: {}, status: "configured" } : {}),
      updated_at: new Date().toISOString(),
    }, { onConflict: "store_id,provider_key" });
    if (upsertError) throw upsertError;
    const { error: deactivateError } = await admin.from("shipping_integrations").update({ is_active: false })
      .eq("store_id", ctx.store.id).neq("provider_key", provider_key);
    if (deactivateError) throw deactivateError;
    void logAudit({ actorId: ctx.user.id, storeId: ctx.store.id, action: "integration.changed",
      entity: "shipping_integration", entityId: `${ctx.store.id}:${provider_key}`,
      supportSessionId: ctx.supportSession?.id ?? null, metadata: { selected_mode: provider_key } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
