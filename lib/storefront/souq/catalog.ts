/**
 * SOUQ — server-side data loading (ANON role, RLS-protected).
 *
 * One place for every SOUQ read: catalog, product detail bundle, quantity
 * offers, approved reviews, FAQ, shipping zones and the search index. Queries
 * are batched (no N+1) and every list is empty-safe so a brand new store
 * renders a complete page instead of a broken section.
 *
 * No service-role usage, no tenant bypass: the anon client can only read what
 * RLS exposes for published/active stores.
 */
import { getAnonSupabase } from "../../supabase/anon";
import type { FaqItemRow, ProductRow, ProductVariantRow, QuantityOfferRow, ReviewRow, StoreSettings } from "../../supabase/database.types";
import { resolveSouqCheckoutSettings, type SouqCheckoutSettings } from "./checkout-settings";
import type { SouqAddOnProduct, SouqVariantInput } from "./variants";
import { buildOptionGroups, type SouqOptionGroup } from "./variants";
import type { SouqSearchItem } from "./search";

export interface SouqProductSummary {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  image: string | null;
  isFeatured: boolean;
  stock: number;
  lowStockThreshold: number;
  sku: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  hasVariants: boolean;
}

export interface SouqCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  productCount: number;
}

export interface SouqReview {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  /** True only when the review is genuinely linked to an order. */
  verifiedOrder: boolean;
}

export interface SouqFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SouqZone {
  wilaya_code: number;
  home_fee_cents: number | null;
  office_fee_cents: number | null;
  is_active: boolean;
}

export interface SouqHomeBundle {
  categories: SouqCategory[];
  trending: SouqProductSummary[];
  discounted: SouqProductSummary[];
  bestSellers: SouqProductSummary[];
  latest: SouqProductSummary[];
  reviews: SouqReview[];
  faq: SouqFaqItem[];
  hasProducts: boolean;
}

const PRODUCT_COLUMNS =
  "id, slug, name, description, price_cents, compare_at_price_cents, category_id, is_featured, stock, low_stock_threshold, sku";

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function loadImages(storeId: string): Promise<Map<string, string[]>> {
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("product_images")
    .select("product_id, url, position")
    .eq("store_id", storeId)
    .order("position", { ascending: true });
  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.product_id) ?? [];
    list.push(row.url);
    map.set(row.product_id, list);
  }
  return map;
}

async function loadRatingMap(storeId: string): Promise<Map<string, { average: number; count: number }>> {
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("reviews")
    .select("product_id, rating")
    .eq("store_id", storeId)
    .eq("is_approved", true)
    .not("product_id", "is", null)
    .limit(2000);
  const acc = new Map<string, { total: number; count: number }>();
  for (const row of data ?? []) {
    if (!row.product_id) continue;
    const current = acc.get(row.product_id) ?? { total: 0, count: 0 };
    current.total += row.rating;
    current.count += 1;
    acc.set(row.product_id, current);
  }
  const out = new Map<string, { average: number; count: number }>();
  for (const [productId, value] of acc) {
    out.set(productId, { average: Math.round((value.total / value.count) * 10) / 10, count: value.count });
  }
  return out;
}

function toSummary(
  row: Pick<
    ProductRow,
    | "id"
    | "slug"
    | "name"
    | "price_cents"
    | "compare_at_price_cents"
    | "category_id"
    | "is_featured"
    | "stock"
    | "low_stock_threshold"
    | "sku"
  >,
  context: {
    images: Map<string, string[]>;
    categories: Map<string, { name: string; slug: string }>;
    ratings: Map<string, { average: number; count: number }>;
    variantCounts: Map<string, number>;
  },
): SouqProductSummary {
  const category = row.category_id ? context.categories.get(row.category_id) : undefined;
  const rating = context.ratings.get(row.id);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceCents: row.price_cents,
    compareAtPriceCents: row.compare_at_price_cents,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    image: context.images.get(row.id)?.[0] ?? null,
    isFeatured: row.is_featured,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    sku: row.sku,
    ratingAverage: rating?.average ?? null,
    ratingCount: rating?.count ?? 0,
    hasVariants: (context.variantCounts.get(row.id) ?? 0) > 0,
  };
}

async function loadVariantCounts(storeId: string, productIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (productIds.length === 0) return map;
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("product_variants")
    .select("product_id, stock, is_active")
    .in("product_id", productIds);
  for (const row of data ?? []) {
    if (row.is_active === false) continue;
    map.set(row.product_id, (map.get(row.product_id) ?? 0) + 1);
  }
  return map;
}

export async function loadSouqCategories(storeId: string): Promise<SouqCategory[]> {
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("categories")
    .select("id, slug, name, image_url, position")
    .eq("store_id", storeId)
    .eq("is_visible", true)
    .order("position", { ascending: true });
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.image_url ?? null,
    productCount: 0,
  }));
}

export async function loadSouqReviews(storeId: string, productId?: string | null, limit = 8): Promise<SouqReview[]> {
  const anon = getAnonSupabase();
  let query = anon
    .from("reviews")
    .select("id, customer_name, rating, title, body, order_id, created_at, product_id")
    .eq("store_id", storeId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (productId) query = query.eq("product_id", productId);
  const { data } = await query;
  return (data ?? []).map((row: Pick<ReviewRow, "id" | "customer_name" | "rating" | "title" | "body" | "order_id" | "created_at">) => ({
    id: row.id,
    customerName: row.customer_name,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    // Never fake verification: only orders genuinely attached to the review.
    verifiedOrder: Boolean(row.order_id),
  }));
}

export async function loadSouqFaq(storeId: string, limit = 10): Promise<SouqFaqItem[]> {
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("faq_items")
    .select("id, question, answer, position")
    .eq("store_id", storeId)
    .eq("is_visible", true)
    .order("position", { ascending: true })
    .limit(limit);
  return (data ?? []).map((row: Pick<FaqItemRow, "id" | "question" | "answer">) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
  }));
}

export async function loadSouqZones(storeId: string): Promise<SouqZone[]> {
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("shipping_zones")
    .select("wilaya_code, home_fee_cents, office_fee_cents, is_active")
    .eq("store_id", storeId);
  return (data ?? []).map((row) => ({
    wilaya_code: row.wilaya_code,
    home_fee_cents: row.home_fee_cents,
    office_fee_cents: row.office_fee_cents,
    is_active: row.is_active,
  }));
}

/** Product row including the SOUQ option-group configuration (JSONB). */
export type SouqProductRow = ProductRow;

async function selectProductRows(storeId: string, opts: { featured?: boolean; latest?: boolean; limit?: number }) {
  const anon = getAnonSupabase();
  let query = anon
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order(opts.latest ? "created_at" : "position", { ascending: opts.latest ? false : true })
    .limit(opts.limit ?? 40);
  if (opts.featured) query = query.eq("is_featured", true);
  const { data } = await query;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Home bundle
// ---------------------------------------------------------------------------

export async function loadSouqHomeBundle(storeId: string): Promise<SouqHomeBundle> {
  const [rows, categories, images, ratings, reviews, faq] = await Promise.all([
    selectProductRows(storeId, { limit: 48 }),
    loadSouqCategories(storeId),
    loadImages(storeId),
    loadRatingMap(storeId),
    loadSouqReviews(storeId, null, 8),
    loadSouqFaq(storeId, 8),
  ]);

  const variantCounts = await loadVariantCounts(storeId, rows.map((r) => r.id));
  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, slug: c.slug }]));
  const summaries = rows.map((row) => toSummary(row as never, { images, categories: categoryMap, ratings, variantCounts }));

  const counts = new Map<string, number>();
  for (const product of summaries) {
    if (!product.categoryId) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }

  const discounted = summaries
    .filter((p) => p.compareAtPriceCents !== null && p.compareAtPriceCents > p.priceCents)
    .sort((a, b) => {
      const da = (a.compareAtPriceCents ?? 0) - a.priceCents;
      const db = (b.compareAtPriceCents ?? 0) - b.priceCents;
      return db - da;
    })
    .slice(0, 8);

  return {
    categories: categories.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 })),
    trending: summaries.slice(0, 8),
    discounted,
    bestSellers: summaries.filter((p) => p.isFeatured).slice(0, 6),
    latest: [...summaries].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8),
    reviews,
    faq,
    hasProducts: summaries.length > 0,
  };
}

/** Compact index for the header's instant search. */
export async function loadSouqSearchIndex(storeId: string, limit = 300): Promise<SouqSearchItem[]> {
  const [rows, categories] = await Promise.all([
    selectProductRows(storeId, { limit }),
    loadSouqCategories(storeId),
  ]);
  if (rows.length === 0) return [];
  const images = await loadImages(storeId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceCents: row.price_cents,
    compareAtPriceCents: row.compare_at_price_cents,
    image: images.get(row.id)?.[0] ?? null,
    categoryName: row.category_id ? categoryMap.get(row.category_id) ?? null : null,
    isFeatured: row.is_featured,
  }));
}

// ---------------------------------------------------------------------------
// Shop / category listing
// ---------------------------------------------------------------------------

export async function loadSouqShop(storeId: string): Promise<{ products: SouqProductSummary[]; categories: SouqCategory[] }> {
  const [rows, categories, images, ratings] = await Promise.all([
    selectProductRows(storeId, { limit: 120 }),
    loadSouqCategories(storeId),
    loadImages(storeId),
    loadRatingMap(storeId),
  ]);
  const variantCounts = await loadVariantCounts(storeId, rows.map((r) => r.id));
  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, slug: c.slug }]));
  const products = rows.map((row) => toSummary(row as never, { images, categories: categoryMap, ratings, variantCounts }));
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.categoryId) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }
  return {
    products,
    categories: categories.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 })),
  };
}

// ---------------------------------------------------------------------------
// Product detail bundle (also used by the checkout page)
// ---------------------------------------------------------------------------

export interface SouqProductBundle {
  product: SouqProductRow;
  images: string[];
  variants: SouqVariantInput[];
  optionGroups: SouqOptionGroup[];
  addOnProducts: SouqAddOnProduct[];
  offers: QuantityOfferRow[];
  reviews: SouqReview[];
  related: SouqProductSummary[];
  faq: SouqFaqItem[];
  ratingAverage: number | null;
  ratingCount: number;
  inStock: boolean;
  /** Delivery facts the product page may honestly show. */
  shipping: {
    hasZones: boolean;
    homeFromCents: number | null;
    officeFromCents: number | null;
    officeEnabled: boolean;
  };
}

export async function loadSouqProductBySlug(storeId: string, slug: string, settings?: StoreSettings | null): Promise<SouqProductBundle | null> {
  const anon = getAnonSupabase();
  const { data: product } = await anon
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) return null;
  return loadSouqProductDetail(storeId, product as unknown as SouqProductRow, settings);
}

export async function loadSouqProductById(storeId: string, productId: string, settings?: StoreSettings | null): Promise<SouqProductBundle | null> {
  const anon = getAnonSupabase();
  const { data: product } = await anon
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) return null;
  return loadSouqProductDetail(storeId, product as unknown as SouqProductRow, settings);
}

export async function loadSouqProductDetail(
  storeId: string,
  product: SouqProductRow,
  settings?: StoreSettings | null,
): Promise<SouqProductBundle> {
  const anon = getAnonSupabase();
  const [{ data: imageRows }, { data: variantRows }, { data: offerRows }, zones, shop, reviews, faq] = await Promise.all([
    anon
      .from("product_images")
      .select("id, url, position")
      .eq("product_id", product.id)
      .order("position", { ascending: true }),
    anon
      .from("product_variants")
      .select("id, name, options, price_cents, stock, is_active, position")
      .eq("product_id", product.id)
      .order("position", { ascending: true }),
    anon
      .from("quantity_offers")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .or(`product_id.is.null,product_id.eq.${product.id}`)
      .order("min_quantity", { ascending: true }),
    loadSouqZones(storeId),
    loadSouqShop(storeId),
    loadSouqReviews(storeId, product.id, 6),
    loadSouqFaq(storeId, 6),
  ]);

  const variants: SouqVariantInput[] = (variantRows ?? []).map((row: Pick<ProductVariantRow, "id" | "name" | "options" | "price_cents" | "stock" | "is_active">) => ({
    id: row.id,
    name: row.name,
    options: (row.options ?? {}) as Record<string, unknown>,
    price_cents: row.price_cents,
    stock: row.stock,
    is_active: row.is_active,
  }));

  const addOnProducts = await loadSouqAddOnProducts(storeId, product.option_groups);
  const optionGroups = buildOptionGroups(variants, product.option_groups, addOnProducts);

  const activeZones = zones.filter((z) => z.is_active);
  const homeFees = activeZones.map((z) => z.home_fee_cents).filter((f): f is number => typeof f === "number" && f >= 0);
  const officeFees = activeZones.map((z) => z.office_fee_cents).filter((f): f is number => typeof f === "number" && f >= 0);

  const hasVariants = variants.filter((v) => v.is_active !== false).length > 0;
  const inStock = hasVariants
    ? variants.some((v) => v.is_active !== false && v.stock > 0)
    : product.stock > 0;

  const ratingFromReviews = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return {
    product,
    images: (imageRows ?? []).map((row) => row.url),
    variants,
    optionGroups,
    addOnProducts,
    offers: (offerRows ?? []) as QuantityOfferRow[],
    reviews,
    related: shop.products.filter((p) => p.id !== product.id).slice(0, 8),
    faq,
    ratingAverage: ratingFromReviews === null ? null : Math.round(ratingFromReviews * 10) / 10,
    ratingCount: reviews.length,
    inStock,
    shipping: {
      hasZones: activeZones.length > 0,
      homeFromCents: homeFees.length > 0 ? Math.min(...homeFees) : null,
      officeFromCents: officeFees.length > 0 ? Math.min(...officeFees) : null,
      officeEnabled: settings?.business?.office_delivery_enabled !== false,
    },
  };
}

/** Add-on products referenced by the option-group configuration. */
export async function loadSouqAddOnProducts(storeId: string, optionGroups: unknown): Promise<SouqAddOnProduct[]> {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const groups = Array.isArray(optionGroups) ? optionGroups : [];
  for (const group of groups) {
    const values = (group as { values?: unknown }).values;
    if (!Array.isArray(values)) continue;
    for (const value of values) {
      const id = (value as { addon_product_id?: unknown }).addon_product_id;
      const slug = (value as { addon_product_slug?: unknown }).addon_product_slug;
      if (typeof id === "string" && id.length > 0) ids.add(id);
      if (typeof slug === "string" && slug.length > 0) slugs.add(slug);
    }
  }
  if (ids.size === 0 && slugs.size === 0) return [];

  const anon = getAnonSupabase();
  const [byId, bySlug] = await Promise.all([
    ids.size > 0
      ? anon.from("products").select("id, slug, name, price_cents").eq("store_id", storeId).eq("is_active", true).in("id", [...ids])
      : Promise.resolve({ data: [] as Array<{ id: string; slug: string; name: string; price_cents: number }> }),
    slugs.size > 0
      ? anon.from("products").select("id, slug, name, price_cents").eq("store_id", storeId).eq("is_active", true).in("slug", [...slugs])
      : Promise.resolve({ data: [] as Array<{ id: string; slug: string; name: string; price_cents: number }> }),
  ]);

  const merged = new Map<string, SouqAddOnProduct>();
  for (const row of [...(byId.data ?? []), ...(bySlug.data ?? [])]) {
    merged.set(row.id, { id: row.id, slug: row.slug, name: row.name, price_cents: row.price_cents, image: null });
  }
  return [...merged.values()];
}

/** Resolved checkout configuration for a store (never throws). */
export function souqCheckoutSettingsFor(settings: StoreSettings | null | undefined): SouqCheckoutSettings {
  return resolveSouqCheckoutSettings((settings as unknown as { checkout?: unknown } | null)?.checkout ?? null);
}

/** Store-level quantity offers (product_id null) used by checkout previews. */
export async function loadSouqStoreOffers(storeId: string, productId: string | null): Promise<QuantityOfferRow[]> {
  const anon = getAnonSupabase();
  const query = anon
    .from("quantity_offers")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("min_quantity", { ascending: true });
  const { data } = productId ? await query.or(`product_id.is.null,product_id.eq.${productId}`) : await query;
  return (data ?? []) as QuantityOfferRow[];
}
