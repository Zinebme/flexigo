import type { Section } from "../sections/definitions";
import { shortId } from "../utils";

export const VOLT_TEMPLATE_KEY = "volt-v1";

export function isVoltTemplate(key: string | null | undefined): boolean {
  return key?.trim().toLowerCase() === VOLT_TEMPLATE_KEY;
}

function s(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

export function voltHomeSections(businessName: string): Section[] {
  return [
    s("hero", {
      badge: "تقنية أقوى. تجربة أسرع.",
      title: "اكتشف الجيل الجديد من التقنية",
      subtitle: "أجهزة وإكسسوارات مختارة بعناية، أسعار واضحة والدفع عند الاستلام.",
      desktop_image: "/images/volt/hero-premium.webp",
      mobile_image: "/images/volt/hero-premium.webp",
      button_text: "تسوّق الآن",
      button_link: "/boutique",
      alignment: "right",
    }),
    s("collections", { title: "تسوّق حسب الفئة", subtitle: "اختيارات تقنية لكل استخدام", category_id: null, max_items: 6 }),
    s("products", { title: "الأكثر طلباً", subtitle: "المنتجات التي يختارها زبائننا أكثر", source: "featured", product_count: 8 }),
    s("features", {
      title: "لماذا VOLT؟",
      subtitle: "تجربة شراء بسيطة وواضحة",
      items: [
        { title: "الدفع عند الاستلام", text: "أكمل طلبك وادفع عند الاستلام حسب إعدادات المتجر." },
        { title: "توصيل إلى 58 ولاية", text: "للمنزل أو المكتب حسب الولاية." },
        { title: "خيارات واضحة", text: "السعة واللون والإصدار والملحقات تظهر قبل الطلب." },
        { title: "طلب آمن", text: "السعر والمخزون يعاد حسابهما على الخادم." },
      ],
    }),
    s("banner", {
      title: "ترقية ذكية ليومك",
      subtitle: "اكتشف أجهزة وإكسسوارات تجمع الأداء، البساطة والتصميم.",
      desktop_image: "/images/volt/hero-premium.webp",
      mobile_image: "/images/volt/hero-premium.webp",
      button_text: "اكتشف الجديد",
      button_link: "/boutique",
      alignment: "right",
      show_desktop: true,
      show_mobile: true,
    }),
    s("products", { title: "وصل حديثاً", subtitle: "أحدث الإضافات إلى المتجر", source: "latest", product_count: 8 }),
    s("reviews", { title: `آراء زبائن ${businessName}`, subtitle: "تجارب حقيقية منشورة من المتجر" }),
    s("faq", { title: "أسئلة شائعة", subtitle: "كل ما تحتاج معرفته قبل الطلب", max_items: 8 }),
    s("contact", { title: "تحتاج مساعدة؟", text: "تواصل معنا عبر القنوات التي أضافها المتجر.", show_phone: true, show_whatsapp: true, show_email: false }),
  ];
}

export function voltContentPages(businessName: string) {
  return [
    { key: "about", title: "من نحن", content: { sections: [s("hero", { title: businessName, subtitle: "متجر تقني يركز على منتجات عملية وتجربة شراء واضحة.", image: "/images/volt/hero-premium.webp", button_text: "تسوّق الآن", button_link: "/boutique", alignment: "right" })] } },
    { key: "faq", title: "الأسئلة الشائعة", content: { sections: [s("faq", { title: "الأسئلة الشائعة", subtitle: null, max_items: 12 })] } },
    { key: "contact", title: "تواصل معنا", content: { sections: [s("contact", { title: "تواصل معنا", text: "نحن هنا للإجابة عن أسئلتك.", show_phone: true, show_whatsapp: true, show_email: true })] } },
  ];
}
