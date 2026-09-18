import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const zoneSchema = z.object({
  wilaya_code: z.number().int().min(0).max(58),
  home_fee: z.number().nonnegative().max(10_000_000).optional(),
  office_fee: z.number().nonnegative().max(10_000_000).optional(),
  is_active: z.boolean().default(true),
});

/**
 * Upsert a per-wilaya shipping zone (capability: shipping.manage).
 * wilaya_code 0 = default zone used when a wilaya has no specific zone.
 * Fees are submitted in DA and stored as integer cents server-side.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "shipping.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = zoneSchema.parse(body);
    const admin = getAdminSupabase();

    const homeCents = input.home_fee != null ? Math.round(input.home_fee * 100) : null;
    const officeCents = input.office_fee != null ? Math.round(input.office_fee * 100) : null;

    // upsert via on-conflict on (store_id, wilaya_code)
    const { error } = await admin.from("shipping_zones").upsert(
      {
        store_id: ctx.store.id,
        wilaya_code: input.wilaya_code,
        home_fee_cents: homeCents,
        office_fee_cents: officeCents,
        is_active: input.is_active,
      },
      { onConflict: "store_id,wilaya_code", ignoreDuplicates: false },
    );
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "shipping.zone_changed",
      entity: "shipping_zone",
      entityId: `${ctx.store.id}:${input.wilaya_code}`,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { wilaya_code: input.wilaya_code, home_fee_cents: homeCents, office_fee_cents: officeCents, is_active: input.is_active },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * Delete a specific zone (revert to default). capability: shipping.manage.
 */
export async function DELETE(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "shipping.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const { wilaya_code } = z.object({ wilaya_code: z.number().int().min(1).max(58) }).parse(body);
    const admin = getAdminSupabase();

    const { error } = await admin
      .from("shipping_zones")
      .delete()
      .eq("store_id", ctx.store.id)
      .eq("wilaya_code", wilaya_code);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "shipping.zone_changed",
      entity: "shipping_zone",
      entityId: `${ctx.store.id}:${wilaya_code}`,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { wilaya_code, removed: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
