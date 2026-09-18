import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { stockAdjustmentSchema, parseBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stock adjustment with mandatory reason (capability: products.manage).
 * Every movement is persisted in inventory_movements + audit_logs — stock can
 * never change without a trace (security requirement).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "products.manage");

    const input = parseBody(stockAdjustmentSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: product, error: prodError } = await admin
      .from("products")
      .select("id, name, stock")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (prodError) throw prodError;
    if (!product) throw err("NOT_FOUND", "Produit introuvable");

    const currentStock = product.stock as number;
    const nextStock = currentStock + input.change;
    if (nextStock < 0) {
      throw err("VALIDATION", `Stock insuffisant : ${currentStock} en stock (désiré ${nextStock}).`);
    }

    const { error: upError } = await admin.from("products").update({ stock: nextStock, updated_at: new Date().toISOString() }).eq("id", id);
    if (upError) throw upError;

    const { error: mvError } = await admin.from("inventory_movements").insert({
      store_id: ctx.store.id,
      product_id: id,
      change: input.change,
      reason: input.reason,
      actor_user_id: ctx.user.id,
    });
    if (mvError) throw mvError;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "stock.adjusted",
      entity: "product",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: product.name, from: currentStock, to: nextStock, change: input.change, reason: input.reason },
    });

    return NextResponse.json({ ok: true, stock: nextStock });
  } catch (e) {
    return toErrorResponse(e);
  }
}
