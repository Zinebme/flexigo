import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { productSchema, quantityOfferSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Update a product (capability: products.manage).
 * Full re-sync of variants and images (idempotent replace).
 * Price changes are audited as price.changed.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "products.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    // Strip unknown keys; use productSchema.partial() semantics.
    const input = productSchema.partial().parse(body);
    const offers = body.offers ? quantityOfferSchema.array().max(10).parse(body.offers) : undefined;
    const removeVariantIds: string[] = Array.isArray(body.remove_variant_ids)
      ? body.remove_variant_ids.filter((v) => typeof v === "string")
      : [];

    const admin = getAdminSupabase();
    const { data: current, error: curError } = await admin
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (curError) throw curError;
    if (!current) throw err("NOT_FOUND", "Produit introuvable");

    // Build the update patch.
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let priceChanged = false;
    let priceCents: number | null = null;

    if (input.name !== undefined) patch.name = input.name;
    if (input.slug) {
      const slug = input.slug.trim();
      if (slug !== (current.slug as string)) {
        const { data: clash } = await admin
          .from("products")
          .select("id")
          .eq("store_id", ctx.store.id)
          .eq("slug", slug)
          .neq("id", id)
          .maybeSingle();
        if (clash) throw err("CONFLICT", "Ce slug est déjà utilisé");
        patch.slug = slug;
      }
    }
    if (input.description !== undefined) patch.description = input.description || null;
    if (input.price !== undefined) {
      const cents = Math.round(input.price * 100);
      if (cents !== (current.price_cents as number)) {
        priceChanged = true;
        priceCents = cents;
      }
      patch.price_cents = cents;
    }
    if (input.compare_at_price !== undefined) {
      patch.compare_at_price_cents = input.compare_at_price != null ? Math.round(input.compare_at_price * 100) : null;
    }
    if (input.sku !== undefined) patch.sku = input.sku || null;
    if (input.low_stock_threshold !== undefined) patch.low_stock_threshold = input.low_stock_threshold;
    if (input.is_active !== undefined) patch.is_active = input.is_active;
    if (input.is_featured !== undefined) patch.is_featured = input.is_featured;
    if (input.category_id !== undefined) patch.category_id = input.category_id || null;
    if (input.seo_title !== undefined) patch.seo_title = input.seo_title || null;
    if (input.seo_description !== undefined) patch.seo_description = input.seo_description || null;
    // NOTE: stock is only changed via the dedicated /stock route (audited adjustments).

    const { error: upError } = await admin.from("products").update(patch).eq("id", id);
    if (upError) throw upError;

    // Images: replace when provided.
    if (input.images !== undefined) {
      await admin.from("product_images").delete().eq("product_id", id);
      if (input.images.length > 0) {
        const rows = input.images.map((url, idx) => ({
          product_id: id,
          store_id: ctx.store.id,
          url,
          position: idx,
        }));
        const { error: imgError } = await admin.from("product_images").insert(rows);
        if (imgError) throw imgError;
      }
    }

    // Variants: remove specific, then upsert provided.
    if (removeVariantIds.length > 0) {
      const { error: delError } = await admin
        .from("product_variants")
        .delete()
        .eq("product_id", id)
        .in("id", removeVariantIds);
      if (delError) throw delError;
    }
    if (input.variants && input.variants.length > 0) {
      for (const [idx, v] of input.variants.entries()) {
        const row = {
          product_id: id,
          name: v.name,
          options: v.options,
          price_cents: v.price_cents ?? null,
          sku: v.sku || null,
          stock: v.stock,
          is_active: v.is_active,
          position: idx,
        };
        const { data: existing, error: findError } = await admin
          .from("product_variants")
          .select("id")
          .eq("product_id", id)
          .eq("name", v.name)
          .maybeSingle();
        if (findError) throw findError;
        if (existing) {
          const { error: ue } = await admin.from("product_variants").update(row).eq("id", (existing as { id: string }).id);
          if (ue) throw ue;
        } else {
          const { error: ie } = await admin.from("product_variants").insert(row);
          if (ie) throw ie;
        }
      }
    }

    // Quantity offers: total_price_cents is already in cents (quantityOfferSchema).
    if (offers !== undefined) {
      await admin.from("quantity_offers").delete().eq("product_id", id);
      if (offers.length > 0) {
        const rows = offers.map((o, idx) => ({
          store_id: ctx.store.id,
          product_id: id,
          min_quantity: o.min_quantity,
          total_price_cents: o.total_price_cents,
          label: o.label || `Offre ${o.min_quantity}+`,
          is_active: o.is_active,
          position: idx,
        }));
        const { error: offError } = await admin.from("quantity_offers").insert(rows);
        if (offError) throw offError;
      }
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "product.updated",
      entity: "product",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: (patch.name as string) ?? (current.name as string), price_cents: priceCents },
    });
    if (priceChanged) {
      void logAudit({
        actorId: ctx.user.id,
        storeId: ctx.store.id,
        action: "price.changed",
        entity: "product",
        entityId: id,
        supportSessionId: ctx.supportSession?.id ?? null,
        metadata: { name: (current.name as string), from_cents: current.price_cents, to_cents: priceCents },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * Soft-delete a product (capability: products.manage).
 * Sets deleted_at; catalog queries exclude soft-deleted rows.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "products.manage");

    const admin = getAdminSupabase();
    const { data: current, error: curError } = await admin
      .from("products")
      .select("id, name")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (curError) throw curError;
    if (!current) throw err("NOT_FOUND", "Produit introuvable");

    const { error: delError } = await admin
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (delError) throw delError;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "product.deleted",
      entity: "product",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: (current.name as string) ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
