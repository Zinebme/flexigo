import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { productSchema, quantityOfferSchema, parseBody } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import { validateProductLinks } from "@/lib/catalog/validate-product-links";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Create a product (capability: products.manage).
 * Prices are submitted in DA and stored as integer cents. Variants and
 * images are inserted server-side; nothing price-related is trusted blindly.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: storeId } = await params;
    const ctx = await getAdminContext();
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const input = parseBody(productSchema, body);
    const offers = body?.offers ? quantityOfferSchema.array().max(10).parse(body.offers) : [];
    const admin = getAdminSupabase();
    const { data: store } = await admin.from("stores").select("id").eq("id", storeId).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable.");
    await validateProductLinks(storeId, input.category_id, [
      ...input.related_product_ids, ...input.cross_sell_product_ids,
      ...input.option_groups.flatMap((group) => group.values.map((value) => value.addon_product_id).filter((linkedId): linkedId is string => Boolean(linkedId))),
    ]);

    // Unique slug within the store.
    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) slug = `produit-${Date.now().toString(36)}`;
    for (let i = 1; ; i++) {
      const candidate = i === 1 ? slug : `${slug}-${i}`;
      const { data: existing } = await admin
        .from("products")
        .select("id")
        .eq("store_id", storeId)
        .eq("slug", candidate)
        .maybeSingle();
      if (!existing) {
        slug = candidate;
        break;
      }
      if (i > 25) throw err("CONFLICT", "Impossible de générer un slug unique");
    }

    const priceCents = Math.round(input.price * 100);
    const compareCents = input.compare_at_price != null ? Math.round(input.compare_at_price * 100) : null;
    const costCents = input.cost != null ? Math.round(input.cost * 100) : null;

    // Related/cross-sell IDs are tenant-scoped: never accept IDs from another store.
    const requestedLinks = [...new Set([...input.related_product_ids, ...input.cross_sell_product_ids])];
    if (requestedLinks.length > 0) {
      const { data: ownedLinks, error: ownedErr } = await admin
        .from("products")
        .select("id")
        .eq("store_id", storeId)
        .is("deleted_at", null)
        .in("id", requestedLinks);
      if (ownedErr) throw ownedErr;
      const owned = new Set((ownedLinks ?? []).map((row: { id: string }) => row.id));
      if (requestedLinks.some((id) => !owned.has(id))) throw err("VALIDATION", "Produit connexe invalide pour cette boutique.");
    }

    const { data: product, error: prodError } = await admin
      .from("products")
      .insert({
        store_id: storeId,
        category_id: input.category_id || null,
        name: input.name,
        slug,
        description: input.description || null,
        short_description: input.short_description || null,
        price_cents: priceCents,
        compare_at_price_cents: compareCents,
        cost_cents: costCents,
        is_digital: input.is_digital,
        free_shipping: input.free_shipping,
        gallery_mode: input.gallery_mode,
        landing_images: input.landing_images,
        min_order_quantity: input.min_order_quantity,
        shipping_label: input.shipping_label || null,
        stock_tracking_mode: input.stock_tracking_mode,
        related_product_ids: input.related_product_ids,
        cross_sell_product_ids: input.cross_sell_product_ids,
        page_element_order: input.page_element_order,
        option_groups: input.option_groups,
        sku: input.sku || null,
        stock: input.stock,
        low_stock_threshold: input.low_stock_threshold,
        is_active: input.is_active,
        is_featured: input.is_featured,
        seo_title: input.seo_title || null,
        seo_description: input.seo_description || null,
      })
      .select("id")
      .single();
    if (prodError) throw prodError;
    const productId = (product as { id: string }).id;

    // Variants: price_cents is already in cents (variantSchema), not DA.
    if (input.variants.length > 0) {
      const rows = input.variants.map((v, idx) => ({
        product_id: productId,
        name: v.name,
        options: v.options,
        price_cents: v.price_cents ?? null,
        sku: v.sku || null,
        stock: v.stock,
        is_active: v.is_active,
        position: idx,
      }));
      const { error: varError } = await admin.from("product_variants").insert(rows);
      if (varError) throw varError;
    }

    if (offers.length > 0) {
      const rows = offers.map((offer, index) => ({
        store_id: storeId,
        product_id: productId,
        min_quantity: offer.min_quantity,
        total_price_cents: offer.total_price_cents,
        label: offer.label || `Offre ${offer.min_quantity}+`,
        is_active: offer.is_active,
        free_shipping: offer.free_shipping,
        position: index,
      }));
      const { error: offerError } = await admin.from("quantity_offers").insert(rows);
      if (offerError) throw offerError;
    }

    // Images (public storage URLs already validated at upload time).
    if (input.images.length > 0) {
      const rows = input.images.map((url, idx) => ({
        product_id: productId,
        store_id: storeId,
        url,
        position: idx,
      }));
      const { error: imgError } = await admin.from("product_images").insert(rows);
      if (imgError) throw imgError;
    }

    // Initial stock movement (audited).
    if (input.stock > 0) {
      const { error: mvError } = await admin.from("inventory_movements").insert({
        store_id: storeId,
        product_id: productId,
        change: input.stock,
        reason: "Stock initial",
        actor_user_id: ctx.user.id,
      });
      if (mvError) throw mvError;
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: storeId,
      action: "product.created",
      entity: "product",
      entityId: productId,
      supportSessionId: null,
      metadata: { name: input.name, price_cents: priceCents },
    });

    return NextResponse.json({ ok: true, id: productId, slug });
  } catch (e) {
    return toErrorResponse(e);
  }
}
