/**
 * NOOR — static, read-only demo fixtures for /preview/noor.
 *
 * These never touch Supabase, never create orders and never read tenant data.
 * They exist purely so the Master gallery and preview routes render a full,
 * interactive (visually) NOOR storefront without credentials.
 */
import type { SouqCategory, SouqFaqItem, SouqProductSummary, SouqReview, SouqZone } from "@/lib/storefront/souq/catalog";
import type { SouqPricingOffer } from "@/lib/storefront/souq/order-model";
import { buildOptionGroups, type SouqVariantInput } from "@/lib/storefront/souq/variants";
import { resolveSouqCheckoutSettings } from "@/lib/storefront/souq/checkout-settings";

export const NOOR_DEMO_BASE = "/preview/noor";

export const noorDemoCategories: SouqCategory[] = [
  { id: "11000000-0000-4000-8000-000000000001", slug: "skincare", name: "العناية بالبشرة", imageUrl: "/images/noor/serum.jpg", productCount: 2 },
  { id: "11000000-0000-4000-8000-000000000002", slug: "perfume", name: "العطور", imageUrl: "/images/noor/perfume.jpg", productCount: 1 },
  { id: "11000000-0000-4000-8000-000000000003", slug: "haircare", name: "العناية بالشعر", imageUrl: "/images/noor/hair-mask.jpg", productCount: 1 },
  { id: "11000000-0000-4000-8000-000000000004", slug: "makeup", name: "المكياج", imageUrl: "/images/noor/makeup.jpg", productCount: 1 },
  { id: "11000000-0000-4000-8000-000000000005", slug: "bodycare", name: "العناية بالجسم", imageUrl: "/images/noor/oil.jpg", productCount: 1 },
  { id: "11000000-0000-4000-8000-000000000006", slug: "accessories", name: "الإكسسوارات", imageUrl: "/images/noor/texture.jpg", productCount: 1 },
];

const products: Array<Omit<SouqProductSummary, "categoryName" | "categorySlug" | "ratingAverage" | "ratingCount"> & { categoryIndex: number; rating?: number; reviews?: number }> = [
  { id: "21000000-0000-4000-8000-000000000001", slug: "serum", name: "سيروم ترطيب يومي", priceCents: 290000, compareAtPriceCents: 340000, categoryId: noorDemoCategories[0]!.id, image: "/images/noor/serum.jpg", isFeatured: true, stock: 26, lowStockThreshold: 4, sku: "NOOR-SRM-01", hasVariants: true, categoryIndex: 0, rating: 4.9, reviews: 21 },
  { id: "21000000-0000-4000-8000-000000000002", slug: "cream", name: "كريم عناية خفيف", priceCents: 240000, compareAtPriceCents: null, categoryId: noorDemoCategories[0]!.id, image: "/images/noor/cream.jpg", isFeatured: true, stock: 18, lowStockThreshold: 4, sku: "NOOR-CRM-01", hasVariants: false, categoryIndex: 0, rating: 4.8, reviews: 14 },
  { id: "21000000-0000-4000-8000-000000000003", slug: "perfume", name: "عطر نسائي ناعم", priceCents: 520000, compareAtPriceCents: 600000, categoryId: noorDemoCategories[1]!.id, image: "/images/noor/perfume.jpg", isFeatured: true, stock: 12, lowStockThreshold: 3, sku: "NOOR-PRF-01", hasVariants: true, categoryIndex: 1, rating: 4.9, reviews: 17 },
  { id: "21000000-0000-4000-8000-000000000004", slug: "hair-mask", name: "ماسك مغذٍّ للشعر", priceCents: 210000, compareAtPriceCents: null, categoryId: noorDemoCategories[2]!.id, image: "/images/noor/hair-mask.jpg", isFeatured: false, stock: 22, lowStockThreshold: 5, sku: "NOOR-HRM-01", hasVariants: false, categoryIndex: 2, rating: 4.7, reviews: 9 },
  { id: "21000000-0000-4000-8000-000000000005", slug: "care-oil", name: "زيت عناية متعدد", priceCents: 190000, compareAtPriceCents: 230000, categoryId: noorDemoCategories[4]!.id, image: "/images/noor/oil.jpg", isFeatured: false, stock: 30, lowStockThreshold: 5, sku: "NOOR-OIL-01", hasVariants: false, categoryIndex: 4, rating: 4.8, reviews: 11 },
  { id: "21000000-0000-4000-8000-000000000006", slug: "daily-set", name: "مجموعة عناية يومية", priceCents: 690000, compareAtPriceCents: 780000, categoryId: noorDemoCategories[0]!.id, image: "/images/noor/routine.jpg", isFeatured: true, stock: 10, lowStockThreshold: 3, sku: "NOOR-SET-01", hasVariants: false, categoryIndex: 0, rating: 4.9, reviews: 13 },
];

export const noorDemoProducts: SouqProductSummary[] = products.map((product) => {
  const category = noorDemoCategories[product.categoryIndex]!;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    categoryId: product.categoryId,
    categoryName: category.name,
    categorySlug: category.slug,
    image: product.image,
    isFeatured: product.isFeatured,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    sku: product.sku,
    hasVariants: product.hasVariants,
    ratingAverage: product.rating ?? null,
    ratingCount: product.reviews ?? 0,
  };
});

export const noorDemoReviews: SouqReview[] = [
  { id: "nr1", customerName: "أمينة، الجزائر", rating: 5, title: null, body: "السيروم خفيف ويمتص بسرعة، لاحظت نعومة واضحة من أول أسبوع. التغليف أنيق جداً.", createdAt: "2026-09-02", verifiedOrder: false },
  { id: "nr2", customerName: "سارة، وهران", rating: 5, title: null, body: "الكريم مناسب للبشرة الحساسة ولم يسبب أي تهيج. التوصيل كان سريعاً.", createdAt: "2026-08-24", verifiedOrder: false },
  { id: "nr3", customerName: "ليلى، قسنطينة", rating: 4, title: null, body: "العطر ناعم وثابت لساعات. أتمنى لو تتوفر عبوة أكبر.", createdAt: "2026-08-14", verifiedOrder: false },
];

export const noorDemoFaq: SouqFaqItem[] = [
  { id: "nf1", question: "كيف أستخدم السيروم؟", answer: "ضعي بضع قطرات على بشرة نظيفة وجافة، ثم وزّعيها بلطف صباحاً ومساءً. راجعي تعليمات المنتج المرفقة." },
  { id: "nf2", question: "هل الدفع عند الاستلام متوفر؟", answer: "نعم، الدفع عند الاستلام متاح لجميع الطلبات في هذا النموذج التجريبي." },
  { id: "nf3", question: "هل يمكن التوصيل إلى المكتب؟", answer: "يمكن اختيار المنزل أو مكتب التوصيل عند توفر التسعيرة للولاية المختارة." },
  { id: "nf4", question: "كم تستغرق مدة التوصيل؟", answer: "مدة التوصيل الفعلية يحددها المتجر وشركة التوصيل عند تأكيد الطلب." },
  { id: "nf5", question: "هل المنتجات مناسبة للبشرة الحساسة؟", answer: "راجعي قائمة المكونات في صفحة المنتج، وتواصلي مع المتجر إذا كان لديكِ حساسية معيّنة." },
];

export const noorDemoVariants: SouqVariantInput[] = [
  { id: "31000000-0000-4000-8000-000000000001", name: "30مل / وردة", options: { الحجم: "30مل", الرائحة: "وردة" }, price_cents: 290000, stock: 9, is_active: true },
  { id: "31000000-0000-4000-8000-000000000002", name: "30مل / ياسمين", options: { الحجم: "30مل", الرائحة: "ياسمين" }, price_cents: 290000, stock: 7, is_active: true },
  { id: "31000000-0000-4000-8000-000000000003", name: "50مل / وردة", options: { الحجم: "50مل", الرائحة: "وردة" }, price_cents: 340000, stock: 5, is_active: true },
  { id: "31000000-0000-4000-8000-000000000004", name: "50مل / ياسمين", options: { الحجم: "50مل", الرائحة: "ياسمين" }, price_cents: 340000, stock: 0, is_active: true },
];

const optionConfig = [
  {
    key: "size",
    option_key: "الحجم",
    label: "الحجم",
    selection_mode: "single",
    display_type: "buttons",
    required: true,
    values: [{ value: "30مل" }, { value: "50مل" }],
  },
  {
    key: "scent",
    option_key: "الرائحة",
    label: "الرائحة",
    selection_mode: "single",
    display_type: "buttons",
    required: true,
    values: [{ value: "وردة" }, { value: "ياسمين" }],
  },
  {
    key: "extras",
    label: "إضافات",
    selection_mode: "multiple",
    display_type: "checkbox",
    required: false,
    min_selections: 0,
    max_selections: 2,
    help: "اختيارات تجريبية تُؤكد هاتفياً",
    values: [{ value: "gift", label: "تغليف هدية" }, { value: "note", label: "بطاقة إهداء" }],
  },
];

export const noorDemoOptionGroups = buildOptionGroups(noorDemoVariants, optionConfig);

export const noorDemoOffers: SouqPricingOffer[] = [
  { id: "41000000-0000-4000-8000-000000000001", store_id: "51000000-0000-4000-8000-000000000001", product_id: noorDemoProducts[0]!.id, min_quantity: 2, total_price_cents: 520000, label: "الأكثر اختياراً", is_active: true },
  { id: "41000000-0000-4000-8000-000000000002", store_id: "51000000-0000-4000-8000-000000000001", product_id: noorDemoProducts[0]!.id, min_quantity: 3, total_price_cents: 720000, label: "عرض خاص", is_active: true },
];

export const noorDemoZones: SouqZone[] = [
  { wilaya_code: 0, home_fee_cents: 70000, office_fee_cents: 45000, is_active: true },
  { wilaya_code: 16, home_fee_cents: 50000, office_fee_cents: 35000, is_active: true },
  { wilaya_code: 31, home_fee_cents: 55000, office_fee_cents: 40000, is_active: true },
  { wilaya_code: 25, home_fee_cents: 60000, office_fee_cents: 40000, is_active: true },
];

export const noorDemoCheckoutSettings = resolveSouqCheckoutSettings({ show_quantity: true, show_quantity_offers: true, show_delivery_choice: true, variant_display: "dynamic" });

export const noorDemoSearch = noorDemoProducts.map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  priceCents: product.priceCents,
  compareAtPriceCents: product.compareAtPriceCents,
  image: product.image,
  categoryName: product.categoryName,
  isFeatured: product.isFeatured,
}));
