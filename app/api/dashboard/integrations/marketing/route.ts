import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";
import { marketingIntegrationSchema, parseBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Save a marketing pixel/tag config (capability: marketing.manage).
 * Only validated IDENTIFIERS are stored (pixel ids, container ids) — never
 * code. The storefront injects the pixels server-side from this config.
 */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");

    const input = parseBody(marketingIntegrationSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const config: Record<string, unknown> = {};
    if (input.pixel_id) config.pixel_id = input.pixel_id;

    const { error } = await admin
      .from("marketing_integrations")
      .upsert(
        {
          store_id: ctx.store.id,
          provider_key: input.provider_key,
          is_active: input.is_active,
          config: config as unknown as Record<string, unknown>,
          events_enabled: input.events_enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id,provider_key", ignoreDuplicates: false },
      );
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.changed",
      entity: "marketing_integration",
      entityId: `${ctx.store.id}:${input.provider_key}`,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { provider: input.provider_key, is_active: input.is_active, has_pixel: Boolean(input.pixel_id), events: input.events_enabled },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
