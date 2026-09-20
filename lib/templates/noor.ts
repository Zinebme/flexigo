/**
 * NOOR — template identity and Arabic-first structured defaults.
 *
 * NOOR is a beauty / skincare / cosmetics storefront for Algerian COD
 * merchants. Every default below maps to the shared, validated structured
 * section catalog — no raw HTML, CSS or JavaScript ever ships to merchants.
 */
import type { Section } from "../sections/definitions";
import { shortId } from "../utils";

export const NOOR_TEMPLATE_KEY = "noor-v1";
export const NOOR_DEFAULT_LANGUAGE = "ar" as const;

export function isNoorTemplate(templateKey: string | null | undefined): boolean {
  return templateKey?.trim().toLowerCase() === NOOR_TEMPLATE_KEY;
}

function section(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

/**
 * Merchant-editable homepage composition. Note the optional before/after block
 * is deliberately NOT included here — it only ever appears when a merchant
 * explicitly adds it with their own imagery (never invented).
 */
export function noorHomeSections(businessName: string): Section[] {
  return [
    section("hero", {
      badge: "عناية مختارة بعناية",
      title: "إشراقتك تبدأ من عناية صحيحة",
      subtitle: "اختيارات مختارة بعناية لبشرة أكثر نعومة ونضارة",
      image: "/images/noor/hero.jpg",
      desktop_image: "/images/noor/hero.jpg",
      mobile_image: "/images/noor/hero.jpg",
      button_text: "اكتشفي المجموعة",
      button_link: "/boutique",
      alignment: "right",
    }),
    section("collections", {
      title: "تسوّقي حسب الفئة",
      subtitle: "كل ما تحتاجينه لبشرتكِ وشعركِ وعطركِ",
      category_id: null,
      max_items: 6,
    }),
    section("products", {
      title: "الأكثر مبيعاً",
      subtitle: "اختيارات محبوبة من عميلاتنا",
      source: "featured",
      product_count: 8,
    }),
    section("features", {
      title: "عناية بكل ثقة",
      subtitle: null,
      items: [
        { title: "الدفع عند الاستلام", text: "تظهر طريقة الدفع المتاحة بوضوح داخل نموذج الطلب." },
        { title: "توصيل إلى 58 ولاية", text: "خيارات المنزل أو المكتب حسب إعدادات الولاية." },
        { title: "طلب آمن", text: "راجعي التفاصيل والخيارات والكمية قبل التأكيد." },
        { title: "خدمة الزبائن", text: "تظهر قنوات التواصل التي أضافها المتجر." },
      ],
    }),
    section("how_it_works", {
      title: "روتينك اليومي",
      subtitle: "ثلاث خطوات بسيطة لعناية متوازنة",
      steps: [
        { title: "التنظيف", text: "ابدئي بغسل البشرة بلطف لإزالة الشوائب." },
        { title: "الترطيب", text: "وزّعي السيروم أو الكريم على البشرة." },
        { title: "الحماية", text: "أكملي روتينك بما يناسب بشرتكِ نهاراً وليلاً." },
      ],
    }),
    section("banner", {
      title: "عناية تستحقينها كل يوم",
      subtitle: "تركيبات ناعمة ومختارة تمنح بشرتكِ إشراقة طبيعية",
      desktop_image: "/images/noor/editorial.jpg",
      mobile_image: "/images/noor/editorial.jpg",
      button_text: "تسوّقي الآن",
      button_link: "/boutique",
      alignment: "right",
      show_desktop: true,
      show_mobile: true,
    }),
    section("products", {
      title: "وصل حديثاً",
      subtitle: "منتجات جديدة اختيرت بعناية",
      source: "latest",
      product_count: 8,
    }),
    section("offer", {
      title: "اختاري أكثر، وفّري أكثر",
      subtitle: "عروض كمية على منتجات مختارة",
      text: "تظهر العروض المتاحة والسعر النهائي مباشرة داخل صفحة المنتج.",
    }),
    section("reviews", {
      title: `قالوا عن ${businessName}`,
      subtitle: "آراء منشورة من عميلات المتجر",
    }),
    section("gallery", {
      title: "اكتشفي عالم نور",
      subtitle: "لمسات بصرية من روح المجموعة",
      images: [
        "/images/noor/serum.jpg",
        "/images/noor/cream.jpg",
        "/images/noor/perfume.jpg",
        "/images/noor/texture.jpg",
      ],
    }),
    section("faq", {
      title: "أسئلة تتكرر",
      subtitle: "إجابات من إعداد المتجر قبل إتمام طلبكِ",
      max_items: 6,
    }),
    section("contact", {
      title: "نحن هنا لمساعدتكِ",
      text: `استخدمي قنوات التواصل التي أضافها متجر ${businessName}.`,
      show_phone: true,
      show_whatsapp: true,
      show_email: false,
    }),
  ];
}

export function noorContentPages(businessName: string): Array<{ key: string; title: string; content: { sections: Section[] } }> {
  return [
    {
      key: "about",
      title: "من نحن",
      content: {
        sections: [
          section("hero", {
            badge: "قصتنا",
            title: businessName,
            subtitle: "وجهة للعناية والتجميل تجمع بين النعومة والجودة والثقة.",
            image: "/images/noor/editorial.jpg",
            button_text: "اكتشفي المجموعة",
            button_link: "/boutique",
            alignment: "right",
          }),
          section("features", {
            title: "ما يميّزنا",
            subtitle: null,
            items: [
              { title: "اختيار مدروس", text: "منتجات مختارة بعناية لبشرتكِ وشعركِ وجسمكِ." },
              { title: "تفاصيل واضحة", text: "معلومات السعر والكمية والخيارات كما يحددها المتجر." },
              { title: "طلب بسيط", text: "نموذج مباشر مع الدفع عند الاستلام." },
            ],
          }),
        ],
      },
    },
    {
      key: "faq",
      title: "الأسئلة الشائعة",
      content: { sections: [section("faq", { title: "الأسئلة الشائعة", subtitle: null, max_items: 12 })] },
    },
    {
      key: "contact",
      title: "تواصل معنا",
      content: {
        sections: [
          section("contact", {
            title: "يسعدنا سماعكِ",
            text: "تواصلي معنا عبر القنوات المتاحة وسنجيبكِ في أقرب وقت.",
            show_phone: true,
            show_whatsapp: true,
            show_email: true,
          }),
        ],
      },
    },
  ];
}
