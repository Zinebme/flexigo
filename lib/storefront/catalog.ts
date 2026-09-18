/**
 * Public catalog queries (anon role) shared by boutique / product / related.
 */
import { getAnonSupabase } from "../supabase/anon";
import type { ShopProduct } from "../../components/storefront/shop-browser";

export async function loadCatalog(storeId: string): Promise<{ products: ShopProduct[]; categories: { id: string; slug: string; name: string }[] }> {
  const anon = getAnonSupabase();
  const [{ data: products }, { data: categories }] = await Promise.all([
    anon
      .from("products")
      .select("id, slug, name, price_cents, compare_at_price_cents, category_id, is_featured, stock")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("position", { ascending: true }),
    anon
      .from("categories")
      .select("id, slug, name")
      .eq("store_id", storeId)
      .eq("is_visible", true)
      .order("position", { ascending: true }),
  ]);

  const ids = (products ?? []).map((p) => p.id);
  let images: { product_id: string; url: string }[] = [];
  if (ids.length > 0) {
    const imgRes = await anon
      .from("product_images")
      .select("product_id, url, position")
      .in("product_id", ids)
      .order("position", { ascending: true });
    const first = new Map<string, string>();
    for (const img of imgRes.data ?? []) if (!first.has(img.product_id)) first.set(img.product_id, img.url);
    images = [...first.entries()].map(([product_id, url]) => ({ product_id, url }));
  }
  const imgMap = new Map(images.map((i) => [i.product_id, i.url]));
  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return {
    products: (products ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_cents: p.price_cents,
      compare_at_price_cents: p.compare_at_price_cents,
      category_id: p.category_id,
      category_name: p.category_id ? (catMap.get(p.category_id) ?? null) : null,
      image: imgMap.get(p.id) ?? null,
      is_featured: p.is_featured,
    })),
    categories: (categories ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
  };
}
