import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";
import { whatsappSchema, parseBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Save the WhatsApp contact config (capability: marketing.manage).
 * NOTE: this is a PLUGGABLE interface only — no provider is wired yet
 * (Swivigo intentionally not integrated). Merchants configure the number +
 * enable the contact button; the storefront renders a wa.me link server-side.
 */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");

    const input = parseBody(whatsappSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { error } = await admin
      .from("whatsapp_integrations")
      .upsert(
        {
          store_id: ctx.store.id,
          is_active: input.is_active,
          phone: input.phone || null,
          provider: input.provider,
          status: "idle",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id", ignoreDuplicates: false },
      );
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.changed",
      entity: "whatsapp_integration",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { is_active: input.is_active, provider: input.provider, has_phone: Boolean(input.phone) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/** Read the WhatsApp config (capability: marketing.manage). */
export async function GET() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");
    const admin = getAdminSupabase();
    const { data: row, error } = await admin
      .from("whatsapp_integrations")
      .select("*")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ ok: true, integration: row });
  } catch (e) {
    return toErrorResponse(e);
  }
}
