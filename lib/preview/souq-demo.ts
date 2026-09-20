/**
 * In-memory Supabase double for the development preview of the SOUQ template.
 *
 * It answers exactly the read queries the storefront makes (select / eq / is /
 * in / or / order / limit / maybeSingle) over the same rows that the SQL seed
 * inserts for the demo store «سوق بلس» (supabase/seed.sql). Nothing here is
 * used by the platform at runtime: it is registered only when the dev server is
 * started with FLEXIGO_PREVIEW=1.
 *
 * Writes are not supported — the preview is read-only, and the real COD order
 * path still requires the platform's own API and database.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { setSupabaseOverrides } from "@/lib/supabase/preview-override";

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

const STORE_ID = "b0000000-0000-4000-8000-000000000005";
const today = "2026-09-01T09:00:00.000Z";

// ---------------------------------------------------------------------------
// Fixtures (mirror of supabase/seed.sql → «سوق بلس»)
// ---------------------------------------------------------------------------

const store = {
  id: STORE_ID,
  organization_id: "c0000000-0000-4000-8000-000000000005",
  name: "سوق بلس",
  slug: "souq-plus",
  website_type: "ecommerce",
  template_key: "souq-v1",
  language: "ar",
  currency: "DZD",
  status: "active",
  is_published: true,
  published_version: 1,
  settings: {
    contact: {
      email: "contact@souq-plus.dz",
      phone: "0550 44 55 66",
      whatsapp: "https://wa.me/213550445566",
      instagram: "https://instagram.com/souqplus.dz",
      facebook: "https://facebook.com/souqplusdz",
      tiktok: null,
      address: "شارع ديدوش مراد، الجزائر العاصمة",
    },
    business: {
      cod_enabled: true,
      reviews_enabled: true,
      faq_enabled: true,
      allow_negative_stock: false,
      max_items_per_order: 10,
      office_delivery_enabled: true,
      accent_color: "#f59e0b",
    },
  },
  created_at: today,
  updated_at: today,
  deleted_at: null,
};

const theme = {
  id: "a1000000-0000-4000-8000-000000000005",
  store_id: STORE_ID,
  logo_url: "https://picsum.photos/seed/souqplus-logo/400/400",
  favicon_url: null,
  primary_color: "#0f2a47",
  secondary_color: "#f59e0b",
  background_color: "#f8fafc",
  typography: "modern",
  button_shape: "rounded",
  announcement: "توصيل إلى 58 ولاية • الدفع عند الاستلام",
};

const categories = [
  { id: "d0000000-0000-4000-8000-000000000031", name: "إلكترونيات", slug: "electronics", description: "أجهزة وملحقات إلكترونية عملية للاستعمال اليومي.", image_url: "https://picsum.photos/seed/souq-cat-tech/600/400", position: 1 },
  { id: "d0000000-0000-4000-8000-000000000032", name: "المنزل", slug: "home", description: "كل ما يجعل منزلك أسهل وأجمل.", image_url: "https://picsum.photos/seed/souq-cat-home/600/400", position: 2 },
  { id: "d0000000-0000-4000-8000-000000000033", name: "المطبخ", slug: "kitchen", description: "مستلزمات المطبخ والتنظيم.", image_url: "https://picsum.photos/seed/souq-cat-kitchen/600/400", position: 3 },
  { id: "d0000000-0000-4000-8000-000000000034", name: "العناية", slug: "care", description: "منتجات العناية الشخصية والراحة.", image_url: "https://picsum.photos/seed/souq-cat-care/600/400", position: 4 },
  { id: "d0000000-0000-4000-8000-000000000035", name: "إكسسوارات", slug: "accessories", description: "إكسسوارات صغيرة بأسعار مناسبة.", image_url: "https://picsum.photos/seed/souq-cat-acc/600/400", position: 5 },
].map((c) => ({ ...c, store_id: STORE_ID, is_visible: true, created_at: today, updated_at: today, deleted_at: null }));

function product(input: {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  sku: string;
  stock: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  position: number;
}) {
  return {
    id: input.id,
    store_id: STORE_ID,
    category_id: input.categoryId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    price_cents: input.priceCents,
    compare_at_price_cents: input.compareAtPriceCents,
    sku: input.sku,
    stock: input.stock,
    low_stock_threshold: input.lowStockThreshold ?? 10,
    is_active: true,
    is_featured: input.isFeatured ?? true,
    seo_title: null,
    seo_description: null,
    position: input.position,
    created_at: today,
    updated_at: today,
    deleted_at: null,
  };
}

const products = [
  product({
    id: "e0000000-0000-4000-8000-000000000031",
    categoryId: "d0000000-0000-4000-8000-000000000031",
    name: "ساعة ذكية رياضية",
    slug: "saat-dhakiyya",
    description:
      "ساعة ذكية بشاشة لمس كبيرة، تتبع النشاط ونبضات القلب، إشعارات المكالمات والرسائل.\n- بطارية تدوم حتى 7 أيام\n- مقاومة للماء والغبار\n- متوفرة بعدة ألوان ومقاسات",
    priceCents: 290000,
    compareAtPriceCents: 390000,
    sku: "SQ-WAT-031",
    stock: 42,
    lowStockThreshold: 8,
    position: 1,
  }),
  product({
    id: "e0000000-0000-4000-8000-000000000032",
    categoryId: "d0000000-0000-4000-8000-000000000031",
    name: "سماعات لاسلكية",
    slug: "samaat-lasilkiyya",
    description:
      "سماعات بلوتوث بصوت نقي ووضوح في المكالمات.\n- علبة شحن تدوم 24 ساعة\n- اتصال سريع ومستقر\n- مناسبة للرياضة والتنقل",
    priceCents: 240000,
    compareAtPriceCents: 320000,
    sku: "SQ-EAR-032",
    stock: 60,
    position: 2,
  }),
  product({
    id: "e0000000-0000-4000-8000-000000000033",
    categoryId: "d0000000-0000-4000-8000-000000000032",
    name: "مصباح LED قابل للشحن",
    slug: "misbah-led",
    description:
      "مصباح LED عملي للاستعمال اليومي وفي حالات انقطاع الكهرباء.\n- إضاءة قوية بثلاث مستويات\n- قابل للشحن عبر USB\n- خفيف وسهل الحمل",
    priceCents: 190000,
    compareAtPriceCents: 250000,
    sku: "SQ-LED-033",
    stock: 55,
    position: 3,
  }),
  product({
    id: "e0000000-0000-4000-8000-000000000034",
    categoryId: "d0000000-0000-4000-8000-000000000033",
    name: "منظم مطبخ متعدد",
    slug: "munazzim-matbakh",
    description:
      "منظم مطبخ يساعدك على ترتيب الأدوات والمؤن بسهولة.\n- عدة جيوب وأقسام\n- بلاستيك متين وسهل التنظيف\n- يوفر مساحة على الطاولة",
    priceCents: 150000,
    compareAtPriceCents: null,
    sku: "SQ-ORG-034",
    stock: 48,
    position: 4,
  }),
  product({
    id: "e0000000-0000-4000-8000-000000000035",
    categoryId: "d0000000-0000-4000-8000-000000000032",
    name: "جهاز تنظيف صغير",
    slug: "jihaz-tandhif",
    description:
      "جهاز تنظيف صغير للزوايا والأسطح الضيقة.\n- بطارية قابلة للشحن\n- رؤوس متعددة للاستعمالات المختلفة\n- حجم عملي للتنقل",
    priceCents: 390000,
    compareAtPriceCents: 490000,
    sku: "SQ-CLN-035",
    stock: 6,
    lowStockThreshold: 10,
    position: 5,
  }),
  product({
    id: "e0000000-0000-4000-8000-000000000036",
    categoryId: "d0000000-0000-4000-8000-000000000034",
    name: "جهاز مساج محمول",
    slug: "jihaz-masaj",
    description:
      "جهاز مساج صغير للراحة بعد يوم طويل.\n- ثلاث سرعات\n- شحن USB\n- خفيف وسهل الاستعمال",
    priceCents: 230000,
    compareAtPriceCents: 280000,
    sku: "SQ-MAS-036",
    stock: 30,
    position: 6,
  }),
];

const images = [
  { id: "ea1", product_id: "e0000000-0000-4000-8000-000000000031", url: "https://picsum.photos/seed/souq-watch-1/800/800", alt: "ساعة ذكية رياضية", position: 0 },
  { id: "ea2", product_id: "e0000000-0000-4000-8000-000000000031", url: "https://picsum.photos/seed/souq-watch-2/800/800", alt: "ساعة ذكية رياضية - من الجانب", position: 1 },
  { id: "ea3", product_id: "e0000000-0000-4000-8000-000000000032", url: "https://picsum.photos/seed/souq-earbuds-1/800/800", alt: "سماعات لاسلكية", position: 0 },
  { id: "ea4", product_id: "e0000000-0000-4000-8000-000000000032", url: "https://picsum.photos/seed/souq-earbuds-2/800/800", alt: "سماعات لاسلكية مع علبة الشحن", position: 1 },
  { id: "ea5", product_id: "e0000000-0000-4000-8000-000000000033", url: "https://picsum.photos/seed/souq-lamp-1/800/800", alt: "مصباح LED قابل للشحن", position: 0 },
  { id: "ea6", product_id: "e0000000-0000-4000-8000-000000000034", url: "https://picsum.photos/seed/souq-organizer-1/800/800", alt: "منظم مطبخ متعدد", position: 0 },
  { id: "ea7", product_id: "e0000000-0000-4000-8000-000000000035", url: "https://picsum.photos/seed/souq-cleaner-1/800/800", alt: "جهاز تنظيف صغير", position: 0 },
  { id: "ea8", product_id: "e0000000-0000-4000-8000-000000000036", url: "https://picsum.photos/seed/souq-massager-1/800/800", alt: "جهاز مساج محمول", position: 0 },
].map((i) => ({ ...i, store_id: STORE_ID, created_at: today }));

function variant(id: string, productId: string, name: string, options: Record<string, string>, priceCents: number | null, sku: string, stock: number, position: number) {
  return { id, product_id: productId, name, options, price_cents: priceCents, sku, stock, is_active: true, position, created_at: today, updated_at: today };
}

const variants = [
  variant("f0000000-0000-4000-8000-000000000031", "e0000000-0000-4000-8000-000000000031", "أسود / 40 ملم", { اللون: "أسود", المقاس: "40 ملم" }, null, "SQ-WAT-031-B40", 18, 1),
  variant("f0000000-0000-4000-8000-000000000032", "e0000000-0000-4000-8000-000000000031", "أسود / 44 ملم", { اللون: "أسود", المقاس: "44 ملم" }, 310000, "SQ-WAT-031-B44", 14, 2),
  variant("f0000000-0000-4000-8000-000000000033", "e0000000-0000-4000-8000-000000000031", "ذهبي / 44 ملم", { اللون: "ذهبي", المقاس: "44 ملم" }, 320000, "SQ-WAT-031-G44", 10, 3),
  variant("f0000000-0000-4000-8000-000000000034", "e0000000-0000-4000-8000-000000000032", "أبيض", { اللون: "أبيض" }, null, "SQ-EAR-032-W", 35, 1),
  variant("f0000000-0000-4000-8000-000000000035", "e0000000-0000-4000-8000-000000000032", "أسود", { اللون: "أسود" }, null, "SQ-EAR-032-B", 25, 2),
  variant("f0000000-0000-4000-8000-000000000036", "e0000000-0000-4000-8000-000000000033", "ضوء دافئ", { النوع: "ضوء دافئ" }, null, "SQ-LED-033-W", 30, 1),
  variant("f0000000-0000-4000-8000-000000000037", "e0000000-0000-4000-8000-000000000033", "ضوء أبيض", { النوع: "ضوء أبيض" }, null, "SQ-LED-033-C", 25, 2),
  variant("f0000000-0000-4000-8000-000000000038", "e0000000-0000-4000-8000-000000000034", "صغير", { المقاس: "صغير" }, null, "SQ-ORG-034-S", 40, 1),
  variant("f0000000-0000-4000-8000-000000000039", "e0000000-0000-4000-8000-000000000034", "كبير", { المقاس: "كبير" }, 170000, "SQ-ORG-034-L", 30, 2),
].map((v) => ({ ...v, deleted_at: null }));

const offers = [
  { id: "e1000000-0000-4000-8000-000000000031", product_id: "e0000000-0000-4000-8000-000000000031", min_quantity: 2, total_price_cents: 520000, label: "قطعتان : 5 200 دج", position: 1 },
  { id: "e1000000-0000-4000-8000-000000000032", product_id: "e0000000-0000-4000-8000-000000000031", min_quantity: 3, total_price_cents: 720000, label: "3 قطع : 7 200 دج", position: 2 },
  { id: "e1000000-0000-4000-8000-000000000033", product_id: null, min_quantity: 2, total_price_cents: 0, label: null, position: 3 },
].map((o) => ({ ...o, store_id: STORE_ID, is_active: true, created_at: today }));

const zones = [
  { id: "e2000000-0000-4000-8000-000000000031", wilaya_code: 0, home_fee_cents: 70000, office_fee_cents: 45000 },
  { id: "e2000000-0000-4000-8000-000000000032", wilaya_code: 16, home_fee_cents: 50000, office_fee_cents: 30000 },
  { id: "e2000000-0000-4000-8000-000000000033", wilaya_code: 31, home_fee_cents: 60000, office_fee_cents: 40000 },
  { id: "e2000000-0000-4000-8000-000000000034", wilaya_code: 25, home_fee_cents: 65000, office_fee_cents: 45000 },
].map((z) => ({ ...z, store_id: STORE_ID, is_active: true, created_at: today, updated_at: today }));

const reviews = [
  { id: "r1", product_id: "e0000000-0000-4000-8000-000000000031", customer_name: "أمين ب.", rating: 5, title: "جودة ممتازة", body: "وصلت الساعة في يومين، والتغليف كان محكماً. البطارية تدوم فعلاً أسبوعاً كاملاً.", created_at: "2026-08-28T10:12:00.000Z" },
  { id: "r2", product_id: "e0000000-0000-4000-8000-000000000031", customer_name: "نبيلة ح.", rating: 4, title: "تستحق السعر", body: "الشاشة واضحة والاستعمال سهل. أنصح بها لمن يبحث عن ساعة عملية بسعر معقول.", created_at: "2026-08-24T16:40:00.000Z" },
  { id: "r3", product_id: "e0000000-0000-4000-8000-000000000032", customer_name: "ياسين م.", rating: 5, title: "صوت نقي", body: "السماعات مريحة في الأذن والصوت متوازن. وصلت إلى وهران في ثلاثة أيام.", created_at: "2026-08-22T08:05:00.000Z" },
  { id: "r4", product_id: "e0000000-0000-4000-8000-000000000033", customer_name: "سارة ل.", rating: 5, title: "عملية جداً", body: "استعملها في المساء وفي انقطاع الكهرباء. الشحن يكفي لعدة ساعات.", created_at: "2026-08-19T19:30:00.000Z" },
  { id: "r5", product_id: "e0000000-0000-4000-8000-000000000035", customer_name: "كريم ع.", rating: 4, title: "مفيد للزوايا", body: "ينظف الأماكن الضيقة التي يصعب الوصول إليها. صغير وعملي.", created_at: "2026-08-15T11:45:00.000Z" },
  { id: "r6", product_id: "e0000000-0000-4000-8000-000000000034", customer_name: "هدى س.", rating: 5, title: "نظّم المطبخ", body: "استوعب كل الأدوات الصغيرة ووفّر مساحة على الطاولة.", created_at: "2026-08-11T07:20:00.000Z" },
].map((r) => ({ ...r, store_id: STORE_ID, is_approved: true, order_id: null, created_at: r.created_at }));

const faq = [
  { id: "q1", question: "هل الدفع عند الاستلام متوفر؟", answer: "نعم، تدفع نقداً عند استلام طلبك من عامل التوصيل أو من مكتب التوصيل.", position: 1 },
  { id: "q2", question: "كم تستغرق مدة التوصيل؟", answer: "بين 24 و 72 ساعة حسب الولاية، ويتم الاتصال بك لتأكيد الطلب قبل الإرسال.", position: 2 },
  { id: "q3", question: "هل يمكنني اختيار التوصيل إلى المكتب؟", answer: "نعم، اختر «التوصيل إلى المكتب» في نموذج الطلب وحدد مكتب التوصيل القريب منك.", position: 3 },
  { id: "q4", question: "كيف أتأكد من طلبي؟", answer: "نتصل بك هاتفياً بعد إرسال الطلب لتأكيد المعلومات والعنوان.", position: 4 },
  { id: "q5", question: "هل أستطيع تغيير الكمية بعد الطلب؟", answer: "نعم، أخبرنا عند الاتصال بك وسنعدّل الطلب قبل الإرسال.", position: 5 },
].map((q) => ({ ...q, store_id: STORE_ID, is_visible: true, created_at: today, updated_at: today }));

const homeSections = [
  { id: "sq1", type: "hero", enabled: true, title: "كل ما تحتاجه في مكان واحد", subtitle: "منتجات مختارة بعناية، أسعار مناسبة والدفع عند الاستلام.", badge: "عروض هذا الأسبوع", promo_text: "توصيل إلى 58 ولاية • الدفع عند الاستلام", image: "https://picsum.photos/seed/souq-hero/1600/1000", desktop_image: "https://picsum.photos/seed/souq-hero/1600/1000", mobile_image: "https://picsum.photos/seed/souq-hero-mobile/900/900", button_text: "تسوق الآن", button_link: "/boutique", alignment: "right" },
  { id: "sq2", type: "collections", enabled: true, title: "تسوق حسب القسم", subtitle: "اختر القسم الذي يناسبك وابدأ التسوق.", category_id: null, max_items: 8 },
  { id: "sq3", type: "products", enabled: true, title: "الأكثر رواجاً", subtitle: "منتجات يطلبها زبائننا كل يوم.", source: "all", product_count: 8 },
  { id: "sq4", type: "offer", enabled: true, title: "عروض محدودة", subtitle: "خصومات على كمية محدودة", text: "اطلب قطعتين أو ثلاث بسعر أقل — بدون رمز خصم." },
  { id: "sq5", type: "products", enabled: true, title: "الأكثر مبيعاً", subtitle: "اختيار الزبائن الأكثر تكراراً.", source: "featured", product_count: 6 },
  { id: "sq6", type: "banner", enabled: true, title: "توصيل سريع إلى باب منزلك", subtitle: "ادفع عند الاستلام في 58 ولاية — بدون أي مخاطرة.", desktop_image: "https://picsum.photos/seed/souq-banner/1600/700", mobile_image: "https://picsum.photos/seed/souq-banner-mobile/900/900", button_text: "اطلب الآن", button_link: "/boutique", alignment: "right", show_desktop: true, show_mobile: true },
  { id: "sq7", type: "products", enabled: true, title: "وصل حديثاً", subtitle: "أحدث ما أضفناه إلى المتجر.", source: "latest", product_count: 8 },
  { id: "sq8", type: "features", enabled: true, title: "لماذا تختارنا؟", subtitle: "نهتم بتجربة الشراء من الطلب إلى الاستلام.", items: [{ title: "الدفع عند الاستلام", text: "لا تدفع أي دينار قبل أن تستلم طلبك وتتأكد منه." }, { title: "توصيل إلى 58 ولاية", text: "إلى المنزل أو إلى مكتب التوصيل القريب منك." }, { title: "طلب آمن", text: "بياناتك محفوظة ولا تُستعمل إلا لمعالجة طلبك." }, { title: "خدمة الزبائن", text: "نتصل بك لتأكيد الطلب ونجيب عن كل أسئلتك." }] },
  { id: "sq9", type: "reviews", enabled: true, title: "آراء الزبائن", subtitle: "شهادات من زبائن طلبوا واستلموا." },
  { id: "sq10", type: "faq", enabled: true, title: "الأسئلة الشائعة", subtitle: "كل ما تحتاج معرفته قبل الطلب.", max_items: 6 },
  { id: "sq11", type: "contact", enabled: true, title: "تواصل معنا", text: "فريق سوق بلس جاهز لمساعدتك قبل الطلب وبعده.", show_phone: true, show_whatsapp: true, show_email: false },
];

const pages = [
  { key: "home", title: "الرئيسية", published_content: { sections: homeSections } },
  { key: "shop", title: "المتجر", published_content: { sections: [] } },
  {
    key: "about",
    title: "من نحن",
    published_content: {
      sections: [
        { id: "sqa1", type: "hero", enabled: true, title: "من نحن — سوق بلس", subtitle: "متجر جزائري يبيع منتجات مختارة بعناية مع الدفع عند الاستلام.", image: null, alignment: "center" },
        { id: "sqa2", type: "features", enabled: true, title: "التزاماتنا", subtitle: null, items: [{ title: "منتجات مختارة", text: "نختبر المنتجات قبل عرضها في المتجر." }, { title: "أسعار واضحة", text: "السعر المعروض هو السعر النهائي بدون رسوم خفية." }, { title: "دعم بعد البيع", text: "نبقى على تواصل معك حتى بعد استلام الطلب." }] },
        { id: "sqa3", type: "contact", enabled: true, title: "تواصل معنا", text: null, show_phone: true, show_whatsapp: true, show_email: false },
      ],
    },
  },
  {
    key: "faq",
    title: "الأسئلة الشائعة",
    published_content: {
      sections: [
        { id: "sqf1", type: "hero", enabled: true, title: "الأسئلة الشائعة", subtitle: "كل ما تحتاج معرفته قبل الطلب.", image: null, alignment: "center" },
        { id: "sqf2", type: "faq", enabled: true, title: "الأسئلة الشائعة", subtitle: null, max_items: 12 },
      ],
    },
  },
  {
    key: "contact",
    title: "تواصل معنا",
    published_content: {
      sections: [
        { id: "sqc1", type: "hero", enabled: true, title: "تواصل معنا", subtitle: "نجيب على استفساراتك بسرعة عبر الهاتف أو واتساب.", image: null, alignment: "center" },
        { id: "sqc2", type: "contact", enabled: true, title: "بيانات التواصل", text: null, show_phone: true, show_whatsapp: true, show_email: true },
      ],
    },
  },
].map((p) => ({ id: `p-${p.key}`, store_id: STORE_ID, key: p.key, title: p.title, published_content: p.published_content, draft_content: p.published_content, created_at: today, updated_at: today }));

const tables: Record<string, Row[]> = {
  stores: [store as unknown as Row],
  domains: [],
  themes: [theme as unknown as Row],
  categories: categories as unknown as Row[],
  products: products as unknown as Row[],
  product_images: images as unknown as Row[],
  product_variants: variants as unknown as Row[],
  quantity_offers: offers as unknown as Row[],
  shipping_zones: zones as unknown as Row[],
  reviews: reviews as unknown as Row[],
  faq_items: faq as unknown as Row[],
  pages: pages as unknown as Row[],
};

// ---------------------------------------------------------------------------
// Minimal PostgREST-shaped query builder (read-only)
// ---------------------------------------------------------------------------

function valueOf(row: Row, column: string): unknown {
  return column.split(".").reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Row)[part] : undefined), row);
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

class PreviewQuery implements PromiseLike<{ data: unknown; error: null }> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private max: number | null = null;
  private mode: "one" | "maybe" | null = null;

  constructor(private rows: Row[]) {}

  /** Column projection is irrelevant here: callers read the fields they need. */
  select(): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => valueOf(row, column) === value);
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push((row) => valueOf(row, column) !== value);
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push((row) => (value === null ? valueOf(row, column) === null || valueOf(row, column) === undefined : valueOf(row, column) === value));
    return this;
  }

  in(column: string, values: unknown[]): this {
    const set = new Set(values.map((v) => String(v)));
    this.filters.push((row) => set.has(String(valueOf(row, column))));
    return this;
  }

  /** PostgREST negation, e.g. `.not("product_id", "is", null)`. */
  not(column: string, operator: string, value: unknown): this {
    const matches = (row: Row): boolean => {
      const current = valueOf(row, column);
      if (operator === "is") return value === null ? current == null : current === value;
      if (operator === "eq") return current === value;
      return false;
    };
    this.filters.push((row) => !matches(row));
    return this;
  }

  /** Only the two patterns the storefront uses: `col.is.null` and `col.eq.value`. */
  or(expression: string): this {
    const parts = expression.split(",").map((part) => part.trim());
    this.filters.push((row) =>
      parts.some((part) => {
        const [column, operator, ...rest] = part.split(".");
        if (!column) return false;
        const expected = rest.join(".");
        if (operator === "is") return expected === "null" ? valueOf(row, column) == null : String(valueOf(row, column)) === expected;
        if (operator === "eq") return String(valueOf(row, column)) === expected;
        return false;
      }),
    );
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number): this {
    this.max = count;
    return this;
  }

  maybeSingle(): Promise<{ data: unknown; error: null }> {
    this.mode = "maybe";
    return Promise.resolve(this.run());
  }

  single(): Promise<{ data: unknown; error: null }> {
    this.mode = "one";
    return Promise.resolve(this.run());
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }

  private run(): { data: unknown; error: null } {
    let rows = this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = [...rows].sort((a, b) => (ascending ? 1 : -1) * compare(valueOf(a, column), valueOf(b, column)));
    }
    if (this.max !== null) rows = rows.slice(0, this.max);
    if (this.mode) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }
}

function createPreviewClient(): SupabaseClient<Database> {
  const client = {
    from(table: string) {
      return new PreviewQuery(tables[table] ?? []);
    },
    rpc() {
      throw new Error("The SOUQ preview is read-only: orders are not written.");
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  };
  return client as unknown as SupabaseClient<Database>;
}

/** Register the in-memory clients for a preview dev server. */
export function installSouqPreview(): void {
  const client = createPreviewClient();
  setSupabaseOverrides({ anon: client, admin: client });
}
