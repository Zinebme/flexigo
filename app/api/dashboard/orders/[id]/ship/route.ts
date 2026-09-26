import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { err, toErrorResponse } from "@/lib/errors";
import { sendShipment, getProvider, providerCapabilities } from "@/lib/providers/shipping";
import { SHIPPING_PROVIDER_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  provider: z.enum(SHIPPING_PROVIDER_KEYS).optional(),
  tracking_number: z.string().trim().max(120).optional(),
});

/**
 * "Envoyer au transporteur" — creates a shipment through the store's
 * configured carrier adapter, records it in shipments/, updates the order
 * (status → shipped, tracking number, provider) and writes the audit trail.
 *
 * Server-side only: decrypts the carrier config, never exposes it.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "orders.ship");

    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const admin = getAdminSupabase();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) throw err("NOT_FOUND", "Commande introuvable");

    // Already shipped?
    const { data: existingShipment } = await admin
      .from("shipments")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    if (existingShipment) throw err("CONFLICT", "Cette commande a déjà été envoyée au transporteur.");

    const { data: items, error: itemsError } = await admin
      .from("order_items")
      .select("product_name, variant_name, quantity, unit_price_cents")
      .eq("order_id", order.id);
    if (itemsError) throw itemsError;

    // Resolve the provider: explicit choice, else the store's active integration.
    let integration: { id: string; provider_key: string; status: string; is_active: boolean; config: Record<string, unknown> | null } | null = null;
    let providerKey: (typeof SHIPPING_PROVIDER_KEYS)[number];
    const { data: integrations, error: intError } = await admin
      .from("shipping_integrations")
      .select("id, provider_key, status, is_active, config")
      .eq("store_id", ctx.store.id);
    if (intError) throw intError;
    const list = (integrations ?? []) as Array<{ id: string; provider_key: string; status: string; is_active: boolean; config: Record<string, unknown> | null }>;
    const isKnownKey = (k: string): k is (typeof SHIPPING_PROVIDER_KEYS)[number] =>
      (SHIPPING_PROVIDER_KEYS as readonly string[]).includes(k);
    if (body.provider) {
      providerKey = body.provider;
      integration = list.find((i) => i.provider_key === providerKey) ?? null;
    } else {
      const active = list.find((i) => i.is_active) ?? null;
      integration = active;
      providerKey = active && isKnownKey(active.provider_key) && providerCapabilities(active.provider_key).automaticShipments ? active.provider_key : "manual";
    }
    if (providerKey === "manual") integration = list.find((i) => i.provider_key === "manual") ?? null;
    const provider = getProvider(providerKey);
    if (providerKey === "mock" || (providerKey !== "manual" && (!integration?.is_active || !providerCapabilities(providerKey).automaticShipments))) {
      throw err("UNSUPPORTED", "Ce transporteur n'est pas activé pour l'envoi automatique. Utilisez le mode manuel.");
    }
    const config = providerKey === "manual" ? null : integration?.config ?? null;

    // Guard: non-manual providers must be configured.
    if (providerKey !== "manual" && integration?.status !== "configured") {
      // `status` not selected above; treat missing config as unconfigured.
      const hasConfig = config && Object.values(config).some((v) => typeof v === "string" && v.length > 0);
      if (!hasConfig) throw err("CONFIG_MISSING", `Configurez d'abord le transporteur « ${provider.label} » dans Livraison.`);
    }

    const result = await sendShipment({
      providerKey,
      config,
      req: {
        orderId: order.id,
        orderNumber: order.order_number,
        storeName: ctx.store.name,
        customerName: order.full_name,
        phone: order.phone,
        wilayaCode: order.wilaya_code,
        wilayaName: order.wilaya,
        commune: order.commune,
        address: order.address ?? null,
        deliveryType: order.delivery_type as "home" | "office",
        office: order.office ?? null,
        items: (items ?? []).map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
          unitPriceCents: it.unit_price_cents,
        })),
        totalCents: order.total_cents,
      },
    });
    const trackingNumber = providerKey === "manual" ? body.tracking_number || null : result.trackingNumber;

    const now = new Date().toISOString();

    // Persist the shipment.
    const { error: shipError } = await admin.from("shipments").insert({
      store_id: ctx.store.id,
      order_id: order.id,
      integration_id: integration?.id ?? null,
      provider_key: providerKey,
      provider_shipment_id: result.providerShipmentId,
      tracking_number: trackingNumber,
      status: result.status,
    });
    if (shipError) throw shipError;

    // Update the order (status + tracking + provider).
    const { error: updError } = await admin
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: trackingNumber,
        shipping_provider: providerKey,
        updated_at: now,
      })
      .eq("id", order.id);
    if (updError) throw updError;

    // Status history.
    const { error: histError } = await admin.from("order_status_history").insert({
      order_id: order.id,
      from_status: order.status,
      to_status: "shipped",
      actor_user_id: ctx.user.id,
      note: `Envoyé au transporteur (${providerKey})`,
    });
    if (histError) throw histError;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "shipment.sent",
      entity: "order",
      entityId: order.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: {
        order_number: order.order_number,
        provider: providerKey,
        provider_shipment_id: result.providerShipmentId,
        tracking_number: trackingNumber,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: providerKey,
      provider_shipment_id: result.providerShipmentId,
      tracking_number: trackingNumber,
      status: result.status,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
