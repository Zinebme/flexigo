/** LAMSA — template identity and Arabic-first structured defaults. */
import type { Section } from "../sections/definitions";
import { shortId } from "../utils";

export const LAMSA_TEMPLATE_KEY = "lamsa-v1";
export const LAMSA_DEFAULT_LANGUAGE = "ar" as const;

export function isLamsaTemplate(templateKey: string | null | undefined): boolean {
  return templateKey?.trim().toLowerCase() === LAMSA_TEMPLATE_KEY;
}

function section(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

/**
 * Merchant-editable composition. Every item maps to the shared, validated
 * structured-section catalog: there is no raw HTML, CSS, or JavaScript.
 */
export function lamsaHomeSections(businessName: string): Section[] {
  return [
    section("hero", {
      badge: "مجموعة الموسم",
      title: "أناقتك تبدأ من التفاصيل",
      subtitle: "تصاميم مختارة تجمع بين الأناقة، الراحة والاحتشام",
      image: "/images/lamsa/hero.jpg",
      desktop_image: "/images/lamsa/hero.jpg",
      mobile_image: "/images/lamsa/hero.jpg",
      button_text: "اكتشفي المجموعة",
      button_link: "/boutique",
      alignment: "right",
    }),
    section("products", {
      title: "وصل حديثاً",
      subtitle: "قطع جديدة اختيرت لترافقكِ بأناقة كل يوم",
      source: "latest",
      product_count: 8,
    }),
    section("collections", {
      title: "اكتشفي المجموعات",
      subtitle: "قصّات وخامات تناسب أسلوبكِ",
      category_id: null,
      max_items: 6,
    }),
    section("products", {
      title: "الأكثر طلباً",
      subtitle: "اختيارات محبوبة من عميلاتنا",
      source: "featured",
      product_count: 8,
    }),
    section("banner", {
      title: "بساطة تعكس حضوركِ",
      subtitle: "ألوان هادئة، خامات مريحة وتفاصيل تُصنع لتدوم",
      desktop_image: "/images/lamsa/editorial.jpg",
      mobile_image: "/images/lamsa/editorial.jpg",
      button_text: "تسوّقي الإطلالة",
      button_link: "/boutique",
      alignment: "right",
      show_desktop: true,
      show_mobile: true,
    }),
    section("offer", {
      title: "اختاري أكثر، وفّري أكثر",
      subtitle: "عروض كمية أنيقة على قطع مختارة",
      text: "تظهر العروض المتاحة والسعر النهائي مباشرة عند اختيار الكمية.",
    }),
    section("products", {
      title: "مختارات لمسة",
      subtitle: "قطع أساسية بخطوط معاصرة وراحة مدروسة",
      source: "all",
      product_count: 8,
    }),
    section("features", {
      title: "تجربة تسوّق بكل طمأنينة",
      subtitle: null,
      items: [
        { title: "الدفع عند الاستلام", text: "تظهر طريقة الدفع المتاحة بوضوح داخل نموذج الطلب." },
        { title: "خيارات التوصيل", text: "تظهر رسوم المنزل أو المكتب حسب إعدادات الولاية." },
        { title: "تفاصيل طلبكِ", text: "راجعي القطع والخيارات والكمية قبل التأكيد." },
        { title: "قنوات التواصل", text: "تظهر بيانات الاتصال التي أضافها المتجر." },
      ],
    }),
    section("reviews", {
      title: `قالوا عن ${businessName}`,
      subtitle: "آراء منشورة من عميلات المتجر",
    }),
    section("gallery", {
      title: "إطلالات تلهمكِ",
      subtitle: "تفاصيل بصرية من روح المجموعة",
      images: [
        "/images/lamsa/abaya.jpg",
        "/images/lamsa/khimar.jpg",
        "/images/lamsa/hijab.jpg",
        "/images/lamsa/editorial.jpg",
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

export function lamsaContentPages(businessName: string): Array<{ key: string; title: string; content: { sections: Section[] } }> {
  return [
    {
      key: "about",
      title: "من نحن",
      content: {
        sections: [
          section("hero", {
            badge: "قصتنا",
            title: businessName,
            subtitle: "مساحة للأزياء المحتشمة المختارة بعناية لتجمع بين الراحة والأناقة.",
            image: "/images/lamsa/editorial.jpg",
            button_text: "اكتشفي المجموعة",
            button_link: "/boutique",
            alignment: "right",
          }),
          section("features", {
            title: "ما يميّزنا",
            subtitle: null,
            items: [
              { title: "اختيار مدروس", text: "قطع مختارة لتناسب إطلالاتكِ اليومية والمناسبات." },
              { title: "تفاصيل واضحة", text: "معلومات المقاس والخامة والسعر كما يحددها المتجر." },
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
