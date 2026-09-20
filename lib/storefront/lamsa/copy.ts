/** LAMSA copy: Arabic-first and feminine, with future locale compatibility. */
import { souqCopy, type SouqCopy } from "../souq/copy";
import type { StoreLanguage } from "../../types";

export function lamsaCopy(lang?: StoreLanguage | string | null): SouqCopy {
  const base = souqCopy(lang);
  if (lang === "fr" || lang === "en") return base;
  return {
    ...base,
    search: { ...base.search, placeholder: "ابحثي عن منتج...", open: "ابحثي عن منتج" },
    hero: {
      ...base.hero,
      badge: "مجموعة الموسم",
      ctaFallback: "اكتشفي المجموعة",
      browseCategories: "اكتشفي المجموعات",
      trustSpeed: "تأكيد الطلب قبل الإرسال",
    },
    sections: {
      ...base.sections,
      categoriesTitle: "اكتشفي المجموعات",
      categoriesSubtitle: "قصّات وخامات تناسب أسلوبكِ",
      trendingTitle: "مختارات لمسة",
      trendingSubtitle: "قطع أساسية بخطوط معاصرة",
      bestTitle: "الأكثر طلباً",
      bestSubtitle: "اختيارات محبوبة من عميلاتنا",
      newTitle: "وصل حديثاً",
      newSubtitle: "قطع جديدة اختيرت لترافقكِ كل يوم",
      reviewsTitle: "قالوا عن لمسة",
      reviewsSubtitle: "آراء منشورة من عميلات المتجر",
      faqTitle: "أسئلة تتكرر",
      viewAll: "شاهدي الكل",
      noProductsHint: "ستظهر القطع هنا فور إضافتها من لوحة التحكم.",
    },
    product: {
      ...base.product,
      bestSeller: "الأكثر طلباً",
      chooseOptions: "اختاري المواصفات",
      orderNow: "اطلبي الآن",
      addToCart: "أضيفي إلى الطلب",
      whatsappAsk: "اسألي على واتساب",
      callAsk: "اتصلي بنا",
      backToShop: "العودة إلى المجموعة",
      related: "قد يعجبكِ أيضاً",
      features: "تفاصيل القطعة",
    },
    checkout: {
      ...base.checkout,
      formTitle: "أكملي طلبك",
      formSubtitle: "أدخلي معلوماتك وسنتواصل معكِ لتأكيد الطلب",
      firstNamePlaceholder: "مثال: أمينة",
      lastNamePlaceholder: "مثال: بن علي",
      phoneHint: "سنتواصل معكِ على هذا الرقم لتأكيد الطلب",
      submit: "تأكيد الطلب",
      codNote: "الدفع عند الاستلام",
      secureNote: "السعر النهائي يُعاد احتسابه بأمان عند إرسال الطلب",
    },
    success: {
      ...base.success,
      title: "تم استلام طلبكِ",
      subtitle: "سنتواصل معكِ لتأكيد التفاصيل قبل الإرسال.",
      backToShop: "تابعي التسوق",
    },
    footer: {
      ...base.footer,
      aboutFallback: "أزياء محتشمة بتفاصيل هادئة، مختارة لترافقكِ كل يوم.",
    },
  };
}
