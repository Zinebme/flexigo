import type { SouqCategory, SouqProductSummary, SouqReview, SouqFaqItem, SouqZone } from "@/lib/storefront/souq/catalog";
import type { SouqPricingOffer } from "@/lib/storefront/souq/order-model";
import { buildOptionGroups, type SouqVariantInput } from "@/lib/storefront/souq/variants";
import { resolveSouqCheckoutSettings } from "@/lib/storefront/souq/checkout-settings";

export const LAMSA_DEMO_BASE = "/preview/lamsa";

export const lamsaDemoCategories: SouqCategory[] = [
  { id: "10000000-0000-4000-8000-000000000001", slug: "hijabs", name: "حجابات", imageUrl: "/images/lamsa/hijab.jpg", productCount: 1 },
  { id: "10000000-0000-4000-8000-000000000002", slug: "khimars", name: "خُمُر", imageUrl: "/images/lamsa/khimar.jpg", productCount: 1 },
  { id: "10000000-0000-4000-8000-000000000003", slug: "abayas", name: "عبايات", imageUrl: "/images/lamsa/abaya.jpg", productCount: 1 },
  { id: "10000000-0000-4000-8000-000000000004", slug: "dresses", name: "فساتين", imageUrl: "/images/lamsa/dress.jpg", productCount: 1 },
  { id: "10000000-0000-4000-8000-000000000005", slug: "isdal", name: "إسدالات", imageUrl: "/images/lamsa/isdal.jpg", productCount: 1 },
  { id: "10000000-0000-4000-8000-000000000006", slug: "accessories", name: "إكسسوارات", imageUrl: "/images/lamsa/scarf.jpg", productCount: 1 },
];

const products: Array<Omit<SouqProductSummary, "categoryName" | "categorySlug" | "ratingAverage" | "ratingCount"> & { categoryIndex: number; rating?: number; reviews?: number }> = [
  { id: "20000000-0000-4000-8000-000000000001", slug: "abaya-elegante", name: "عباية يومية أنيقة", priceCents: 590000, compareAtPriceCents: 680000, categoryId: lamsaDemoCategories[2]!.id, image: "/images/lamsa/abaya.jpg", isFeatured: true, stock: 24, lowStockThreshold: 4, sku: "LMS-ABY-01", hasVariants: true, categoryIndex: 2, rating: 4.9, reviews: 18 },
  { id: "20000000-0000-4000-8000-000000000002", slug: "khimar-long", name: "خمار طويل خفيف", priceCents: 350000, compareAtPriceCents: null, categoryId: lamsaDemoCategories[1]!.id, image: "/images/lamsa/khimar.jpg", isFeatured: true, stock: 17, lowStockThreshold: 4, sku: "LMS-KHM-01", hasVariants: true, categoryIndex: 1, rating: 4.8, reviews: 12 },
  { id: "20000000-0000-4000-8000-000000000003", slug: "hijab-pratique", name: "حجاب عملي بدون رباط", priceCents: 240000, compareAtPriceCents: null, categoryId: lamsaDemoCategories[0]!.id, image: "/images/lamsa/hijab.jpg", isFeatured: false, stock: 32, lowStockThreshold: 5, sku: "LMS-HJB-01", hasVariants: true, categoryIndex: 0, rating: 4.7, reviews: 9 },
  { id: "20000000-0000-4000-8000-000000000004", slug: "wide-dress", name: "فستان واسع بقصّة هادئة", priceCents: 520000, compareAtPriceCents: 590000, categoryId: lamsaDemoCategories[3]!.id, image: "/images/lamsa/dress.jpg", isFeatured: true, stock: 11, lowStockThreshold: 3, sku: "LMS-DRS-01", hasVariants: true, categoryIndex: 3, rating: 4.9, reviews: 15 },
  { id: "20000000-0000-4000-8000-000000000005", slug: "isdal-premium", name: "إسدال شرعي بخامة ناعمة", priceCents: 480000, compareAtPriceCents: null, categoryId: lamsaDemoCategories[4]!.id, image: "/images/lamsa/isdal.jpg", isFeatured: false, stock: 14, lowStockThreshold: 3, sku: "LMS-ISD-01", hasVariants: false, categoryIndex: 4, rating: 4.8, reviews: 7 },
  { id: "20000000-0000-4000-8000-000000000006", slug: "light-scarf", name: "طرحة قماش خفيف", priceCents: 180000, compareAtPriceCents: 210000, categoryId: lamsaDemoCategories[5]!.id, image: "/images/lamsa/scarf.jpg", isFeatured: false, stock: 40, lowStockThreshold: 5, sku: "LMS-SCF-01", hasVariants: true, categoryIndex: 5, rating: 4.7, reviews: 11 },
];

export const lamsaDemoProducts: SouqProductSummary[] = products.map((product) => {
  const category = lamsaDemoCategories[product.categoryIndex]!;
  return {
    id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents, categoryId: product.categoryId,
    categoryName: category.name, categorySlug: category.slug, image: product.image,
    isFeatured: product.isFeatured, stock: product.stock, lowStockThreshold: product.lowStockThreshold,
    sku: product.sku, hasVariants: product.hasVariants,
    ratingAverage: product.rating ?? null, ratingCount: product.reviews ?? 0,
  };
});

export const lamsaDemoReviews: SouqReview[] = [
  { id: "r1", customerName: "سارة، الجزائر", rating: 5, title: null, body: "الخامة ناعمة والقصّة مرتبة جداً. اللون مطابق للصور والتغليف أنيق.", createdAt: "2026-09-01", verifiedOrder: false },
  { id: "r2", customerName: "إيمان، وهران", rating: 5, title: null, body: "الخمار خفيف ومريح طوال اليوم، وساعدوني في اختيار الطول المناسب.", createdAt: "2026-08-22", verifiedOrder: false },
  { id: "r3", customerName: "أمينة، سطيف", rating: 4, title: null, body: "تفاصيل العباية جميلة والمقاس كما هو موضح. تجربة الطلب كانت بسيطة.", createdAt: "2026-08-12", verifiedOrder: false },
];

export const lamsaDemoFaq: SouqFaqItem[] = [
  { id: "f1", question: "كيف أختار المقاس المناسب؟", answer: "راجعي خيارات المقاس المتاحة في صفحة القطعة. يمكنكِ التواصل مع خدمة الزبائن إذا احتجتِ مساعدة إضافية." },
  { id: "f2", question: "هل الدفع عند الاستلام متوفر؟", answer: "نعم، الدفع عند الاستلام متاح للطلبات التجريبية المعروضة في هذا النموذج البصري." },
  { id: "f3", question: "هل يمكنني اختيار التوصيل إلى المكتب؟", answer: "يمكن اختيار المنزل أو مكتب التوصيل عند توفر التسعيرة للولاية المختارة." },
  { id: "f4", question: "كم تستغرق مدة التوصيل؟", answer: "مدة التوصيل الفعلية يحددها المتجر وشركة التوصيل عند تأكيد الطلب." },
  { id: "f5", question: "هل يمكن تبديل المنتج؟", answer: "سياسة التبديل يحددها كل متجر. راجعي سياسة المتجر أو تواصلي مع خدمة الزبائن قبل الطلب." },
];

export const lamsaDemoVariants: SouqVariantInput[] = [
  { id: "30000000-0000-4000-8000-000000000001", name: "أسود / M / كريب", options: { "اللون": "أسود", "المقاس": "M", "نوع القماش": "كريب" }, price_cents: 590000, stock: 8, is_active: true },
  { id: "30000000-0000-4000-8000-000000000002", name: "أسود / L / كريب", options: { "اللون": "أسود", "المقاس": "L", "نوع القماش": "كريب" }, price_cents: 590000, stock: 6, is_active: true },
  { id: "30000000-0000-4000-8000-000000000003", name: "بيج / M / لينن", options: { "اللون": "بيج", "المقاس": "M", "نوع القماش": "لينن" }, price_cents: 620000, stock: 4, is_active: true },
  { id: "30000000-0000-4000-8000-000000000004", name: "بيج / L / لينن", options: { "اللون": "بيج", "المقاس": "L", "نوع القماش": "لينن" }, price_cents: 620000, stock: 0, is_active: true },
  { id: "30000000-0000-4000-8000-000000000005", name: "خمري / XL / كريب", options: { "اللون": "خمري", "المقاس": "XL", "نوع القماش": "كريب" }, price_cents: 630000, stock: 3, is_active: true },
];

const optionConfig = [
  { key: "color", option_key: "اللون", label: "اللون", selection_mode: "single", display_type: "color_swatch", required: true, values: [
    { value: "أسود", label: "أسود", color: "#191715" }, { value: "بيج", label: "بيج", color: "#D8C5AB" }, { value: "خمري", label: "خمري", color: "#6E2935" },
  ] },
  { key: "size", option_key: "المقاس", label: "المقاس", selection_mode: "single", display_type: "buttons", required: true, values: [{ value: "M" }, { value: "L" }, { value: "XL" }] },
  { key: "fabric", option_key: "نوع القماش", label: "نوع القماش", selection_mode: "single", display_type: "buttons", required: true, values: [{ value: "كريب", label: "كريب" }, { value: "لينن", label: "لينن" }] },
  { key: "extras", label: "إضافات", selection_mode: "multiple", display_type: "checkbox", required: false, min_selections: 0, max_selections: 2, help: "اختيارات تجريبية تُؤكد هاتفياً", values: [{ value: "gift", label: "تغليف هدية" }, { value: "note", label: "بطاقة إهداء" }] },
];

export const lamsaDemoOptionGroups = buildOptionGroups(lamsaDemoVariants, optionConfig);
export const lamsaDemoOffers: SouqPricingOffer[] = [
  { id: "40000000-0000-4000-8000-000000000001", store_id: "50000000-0000-4000-8000-000000000001", product_id: lamsaDemoProducts[0]!.id, min_quantity: 2, total_price_cents: 1080000, label: "الأكثر اختياراً", is_active: true },
  { id: "40000000-0000-4000-8000-000000000002", store_id: "50000000-0000-4000-8000-000000000001", product_id: lamsaDemoProducts[0]!.id, min_quantity: 3, total_price_cents: 1530000, label: "عرض خاص", is_active: true },
];
export const lamsaDemoZones: SouqZone[] = [
  { wilaya_code: 0, home_fee_cents: 70000, office_fee_cents: 45000, is_active: true },
  { wilaya_code: 16, home_fee_cents: 50000, office_fee_cents: 35000, is_active: true },
  { wilaya_code: 31, home_fee_cents: 55000, office_fee_cents: 40000, is_active: true },
  { wilaya_code: 19, home_fee_cents: 60000, office_fee_cents: 40000, is_active: true },
];
export const lamsaDemoCheckoutSettings = resolveSouqCheckoutSettings({ show_quantity: true, show_quantity_offers: true, show_delivery_choice: true, variant_display: "dynamic" });

export const lamsaDemoSearch = lamsaDemoProducts.map((product) => ({ id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents, compareAtPriceCents: product.compareAtPriceCents, image: product.image, categoryName: product.categoryName, isFeatured: product.isFeatured }));
