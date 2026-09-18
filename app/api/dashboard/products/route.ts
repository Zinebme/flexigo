import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { productSchema, parseBody } from "@/lib/schemas";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Create a product (capability: products.manage).
 * Prices are submitted in DA and stored as integer cents. Variants and
 * images are inserted server-side; nothing price-related is trusted blindly.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "products.manage");

    const input = parseBody(productSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    // Unique slug within the store.
    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) slug = `produit-${Date.now().toString(36)}`;
    for (let i = 2; ; i++) {
      const candidate = i === 1 ? slug : `${slug}-${i}`;
      const { data: existing } = await admin
        .from("products")
        .select("id")
        .eq("store_id", ctx.store.id)
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

    const { data: product, error: prodError } = await admin
      .from("products")
      .insert({
        store_id: ctx.store.id,
        category_id: input.category_id || null,
        name: input.name,
        slug,
        description: input.description || null,
        price_cents: priceCents,
        compare_at_price_cents: compareCents,
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

    // Variants (server-side price conversion).
    if (input.variants.length > 0) {
      const rows = input.variants.map((v, idx) => ({
        product_id: productId,
        name: v.name,
        options: v.options,
        price_cents: v.price_cents != null ? Math.round(v.price_cents * 100) : null,
        sku: v.sku || null,
        stock: v.stock,
        is_active: v.is_active,
        position: idx,
      }));
      const { error: varError } = await admin.from("product_variants").insert(rows);
      if (varError) throw varError;
    }

    // Images (public storage URLs already validated at upload time).
    if (input.images.length > 0) {
      const rows = input.images.map((url, idx) => ({
        product_id: productId,
        store_id: ctx.store.id,
        url,
        position: idx,
      }));
      const { error: imgError } = await admin.from("product_images").insert(rows);
      if (imgError) throw imgError;
    }

    // Initial stock movement (audited).
    if (input.stock > 0) {
      const { error: mvError } = await admin.from("inventory_movements").insert({
        store_id: ctx.store.id,
        product_id: productId,
        change: input.stock,
        reason: "Stock initial",
        actor_user_id: ctx.user.id,
      });
      if (mvError) throw mvError;
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "product.created",
      entity: "product",
      entityId: productId,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: input.name, price_cents: priceCents },
    });

    return NextResponse.json({ ok: true, id: productId, slug });
  } catch (e) {
    return toErrorResponse(e);
  }
}
