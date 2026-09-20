/**
 * SOUQ — template identity helpers (registry-facing, additive).
 *
 * The canonical template key is `souq-v1` (isolation requirement: a brand new
 * generation template that never collides with an existing key). The short key
 * `souq` is kept as an accepted alias so both documented keys resolve to the
 * same template — new stores select SOUQ explicitly, nothing else changes.
 */
import type { Section } from "../sections/definitions";
import { shortId } from "../utils";

export const SOUQ_TEMPLATE_KEY = "souq-v1";
export const SOUQ_TEMPLATE_ALIASES = ["souq"] as const;
export const SOUQ_DEFAULT_LANGUAGE = "ar";

/** True for every accepted SOUQ key (alias-tolerant, explicit list). */
export function isSouqTemplate(templateKey: string | null | undefined): boolean {
  if (!templateKey) return false;
  const key = templateKey.trim().toLowerCase();
  return key === SOUQ_TEMPLATE_KEY || (SOUQ_TEMPLATE_ALIASES as readonly string[]).includes(key);
}

/** Canonical key for a template key that may be an alias. */
export function canonicalTemplateKey(templateKey: string): string {
  return isSouqTemplate(templateKey) ? SOUQ_TEMPLATE_KEY : templateKey;
}

function s(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

/**
 * SOUQ default homepage, Arabic-first, mapped onto the platform's structured
 * section catalog (merchants can still reorder/edit everything in the
 * dashboard):
 *   promo bar + header (shell) → hero → categories → trending → flash offers
 *   → best sellers → promo banner → new arrivals → why us → reviews → FAQ
 *   → contact → footer.
 */
export function souqHomeSections(businessName: string): Section[] {
  return [
    s("hero", {
      title: "كل ما تحتاجه في مكان واحد",
      subtitle: "أفضل المنتجات بأسعار مناسبة والدفع عند الاستلام",
      badge: "عروض هذا الأسبوع",
      promo_text: "توصيل إلى 58 ولاية • الدفع عند الاستلام",
      image: "https://picsum.photos/seed/souq-hero/1600/1000",
      mobile_image: "https://picsum.photos/seed/souq-hero-mobile/900/900",
      button_text: "تسوق الآن",
      button_link: "/boutique",
      alignment: "right",
    }),
    s("collections", {
      title: "تسوق حسب القسم",
      subtitle: "اختر القسم الذي يناسبك وابدأ التسوق",
      category_id: null,
      max_items: 8,
    }),
    s("products", {
      title: "الأكثر رواجاً",
      subtitle: "منتجات يطلبها زبائننا كل يوم",
      source: "all",
      product_count: 8,
    }),
    s("offer", {
      title: "عروض محدودة",
      subtitle: "خصومات على كمية محدودة — اطلب قبل نفاد المخزون",
      text: "خصم مباشر على الكمية — بدون رمز خصم",
    }),
    s("products", {
      title: "الأكثر مبيعاً",
      subtitle: "اختيار الزبائن الأكثر تكراراً",
      source: "featured",
      product_count: 6,
    }),
    s("banner", {
      title: "توصيل سريع إلى باب منزلك",
      subtitle: "ادفع عند الاستلام في كل الولايات — بدون أي مخاطرة",
      desktop_image: "https://picsum.photos/seed/souq-banner/1600/700",
      mobile_image: "https://picsum.photos/seed/souq-banner-mobile/900/900",
      button_text: "اطلب الآن",
      button_link: "/boutique",
      alignment: "right",
      show_desktop: true,
      show_mobile: true,
    }),
    s("products", {
      title: "وصل حديثاً",
      subtitle: "أحدث ما أضفناه إلى المتجر",
      source: "latest",
      product_count: 8,
    }),
    s("features", {
      title: "لماذا تختارنا؟",
      subtitle: "نهتم بتجربة الشراء من الطلب إلى الاستلام",
      items: [
        { title: "الدفع عند الاستلام", text: "لا تدفع أي دينار قبل أن تستلم طلبك وتتأكد منه." },
        { title: "توصيل إلى 58 ولاية", text: "إلى المنزل أو إلى مكتب التوصيل القريب منك." },
        { title: "طلب آمن", text: "بياناتك محفوظة ولا تُستخدم إلا لمعالجة طلبك." },
        { title: "خدمة الزبائن", text: "فريقنا يتصل بك لتأكيد الطلب ويجيب عن كل أسئلتك." },
      ],
    }),
    s("reviews", {
      title: "آراء الزبائن",
      subtitle: "شهادات حقيقية من زبائن طلبوا واستلموا",
    }),
    s("faq", {
      title: "الأسئلة الشائعة",
      subtitle: "كل ما تحتاج معرفته قبل الطلب",
      max_items: 6,
    }),
    s("contact", {
      title: "تواصل معنا",
      text: `فريق ${businessName} جاهز لمساعدتك قبل الطلب وبعده.`,
      show_phone: true,
      show_whatsapp: true,
      show_email: false,
    }),
  ];
}

/** Arabic content pages generated alongside the SOUQ homepage. */
export function souqContentPages(businessName: string): Array<{ key: string; title: string; content: { sections: Section[] } }> {
  return [
    {
      key: "about",
      title: "من نحن",
      content: {
        sections: [
          s("hero", {
            title: `من نحن — ${businessName}`,
            subtitle: "متجر جزائري يبيع منتجات مختارة بعناية مع الدفع عند الاستلام.",
            image: null,
            button_text: null,
            button_link: null,
            alignment: "center",
          }),
          s("features", {
            title: "التزاماتنا",
            subtitle: null,
            items: [
              { title: "منتجات مختارة", text: "نختبر المنتجات قبل عرضها في المتجر." },
              { title: "أسعار واضحة", text: "السعر المعروض هو السعر النهائي بدون رسوم خفية." },
              { title: "دعم بعد البيع", text: "نبقى على تواصل معك حتى بعد استلام الطلب." },
            ],
          }),
          s("contact", {
            title: "تواصل معنا",
            text: null,
            show_phone: true,
            show_whatsapp: true,
            show_email: false,
          }),
        ],
      },
    },
    {
      key: "faq",
      title: "الأسئلة الشائعة",
      content: {
        sections: [
          s("hero", {
            title: "الأسئلة الشائعة",
            subtitle: "كل ما تحتاج معرفته قبل الطلب",
            image: null,
            button_text: null,
            button_link: null,
            alignment: "center",
          }),
          s("faq", { title: "الأسئلة الشائعة", subtitle: null, max_items: 12 }),
        ],
      },
    },
    {
      key: "contact",
      title: "تواصل معنا",
      content: {
        sections: [
          s("hero", {
            title: "تواصل معنا",
            subtitle: "نجيب على استفساراتك بسرعة عبر الهاتف أو واتساب.",
            image: null,
            button_text: null,
            button_link: null,
            alignment: "center",
          }),
          s("contact", { title: "بيانات التواصل", text: null, show_phone: true, show_whatsapp: true, show_email: true }),
        ],
      },
    },
  ];
}
