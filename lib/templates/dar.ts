import type { Section } from "../sections/definitions";
import { shortId } from "../utils";

export const DAR_TEMPLATE_KEY = "dar-v1";

export function isDarTemplate(key: string | null | undefined): boolean {
  return key?.trim().toLowerCase() === DAR_TEMPLATE_KEY;
}

function s(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

export function darHomeSections(businessName: string): Section[] {
  return [
    s("hero", {
      badge: "بيت أجمل، تفاصيل أدفأ",
      title: "اختيارات ذكية لبيت مرتب وأنيق",
      subtitle: "مطبخ، ترتيب، ديكور وأدوات يومية مختارة بعناية مع الدفع عند الاستلام.",
      desktop_image: "/images/dar/hero.svg",
      mobile_image: "/images/dar/hero-mobile.svg",
      button_text: "اكتشف المتجر",
      button_link: "/boutique",
      alignment: "right",
    }),
    s("collections", { title: "تسوّق حسب المساحة", subtitle: "المطبخ، الصالون، غرفة النوم، التخزين وأكثر", category_id: null, max_items: 6 }),
    s("products", { title: "الأكثر طلباً", subtitle: "منتجات عملية يحبها الزبائن", source: "featured", product_count: 8 }),
    s("banner", {
      title: "رتّب أقل، عش أكثر",
      subtitle: "حلول عملية للتنظيم والاستعمال اليومي بتصميم بسيط ودافئ.",
      desktop_image: "/images/dar/banner.svg",
      mobile_image: "/images/dar/banner-mobile.svg",
      button_text: "شاهد المجموعة",
      button_link: "/boutique",
      alignment: "right",
      show_desktop: true,
      show_mobile: true,
    }),
    s("features", {
      title: "لماذا DAR؟",
      subtitle: "تجربة شراء منزلية بسيطة ومريحة",
      items: [
        { title: "عملية فعلاً", text: "منتجات للاستخدام اليومي، ليست مجرد ديكور." },
        { title: "دفع عند الاستلام", text: "اطلب بسهولة وادفع عند الاستلام." },
        { title: "توصيل إلى 58 ولاية", text: "خيارات منزل أو مكتب حسب الولاية." },
        { title: "اختيارات واضحة", text: "الألوان، المقاسات والباقات تظهر قبل تأكيد الطلب." },
      ],
    }),
    s("products", { title: "وصل حديثاً", subtitle: "أحدث الإضافات للبيت والمطبخ", source: "latest", product_count: 8 }),
    s("reviews", { title: `آراء زبائن ${businessName}`, subtitle: "تجارب حقيقية منشورة من المتجر" }),
    s("faq", { title: "أسئلة شائعة", subtitle: "كل ما تحتاج معرفته قبل الطلب", max_items: 8 }),
    s("contact", { title: "تحتاج مساعدة؟", text: "تواصل معنا عبر القنوات التي أضافها المتجر.", show_phone: true, show_whatsapp: true, show_email: false }),
  ];
}

export function darContentPages(businessName: string) {
  return [
    { key: "about", title: "من نحن", content: { sections: [s("hero", { title: businessName, subtitle: "اختيارات عملية وجميلة للبيت، بتجربة شراء واضحة وسريعة.", image: "/images/dar/banner.svg", button_text: "تسوّق الآن", button_link: "/boutique", alignment: "right" })] } },
    { key: "faq", title: "الأسئلة الشائعة", content: { sections: [s("faq", { title: "الأسئلة الشائعة", subtitle: null, max_items: 12 })] } },
    { key: "contact", title: "تواصل معنا", content: { sections: [s("contact", { title: "تواصل معنا", text: "نحن هنا للإجابة عن أسئلتك.", show_phone: true, show_whatsapp: true, show_email: true })] } },
  ];
}
