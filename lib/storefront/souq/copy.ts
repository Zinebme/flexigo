/**
 * SOUQ — storefront copy, Arabic-first.
 *
 * Arabic (MSA, Algerian commercial register) is the PRIMARY language of this
 * template; French and English are provided so the same components can serve
 * other locales later without touching the design layer (architecture ready,
 * not enabled by default).
 *
 * All visible SOUQ strings live here: no English placeholder text in the
 * storefront, no lorem ipsum.
 */
import type { StoreLanguage } from "../../types";

export interface SouqCopy {
  dir: "rtl" | "ltr";
  promo: {
    defaultBar: string;
    delivery: string;
    cod: string;
    secure: string;
    support: string;
  };
  nav: {
    home: string;
    shop: string;
    categories: string;
    offers: string;
    bestSellers: string;
    newArrivals: string;
    contact: string;
    about: string;
    faq: string;
    menu: string;
    close: string;
    openMenu: string;
    langLabel: string;
  };
  search: {
    placeholder: string;
    open: string;
    close: string;
    results: string;
    noResults: string;
    noResultsHint: string;
    loading: string;
    viewAll: string;
    hint: string;
  };
  hero: {
    badge: string;
    ctaFallback: string;
    browseCategories: string;
    trustDelivery: string;
    trustCod: string;
    trustSpeed: string;
  };
  sections: {
    categoriesTitle: string;
    categoriesSubtitle: string;
    trendingTitle: string;
    trendingSubtitle: string;
    flashTitle: string;
    flashSubtitle: string;
    bestTitle: string;
    bestSubtitle: string;
    newTitle: string;
    newSubtitle: string;
    whyTitle: string;
    whySubtitle: string;
    reviewsTitle: string;
    reviewsSubtitle: string;
    faqTitle: string;
    faqSubtitle: string;
    contactTitle: string;
    contactSubtitle: string;
    productsTitle: string;
    noProducts: string;
    noProductsHint: string;
    noCategories: string;
    noReviews: string;
    noFaq: string;
    viewAll: string;
    offerBadge: string;
    offerNote: string;
  };
  product: {
    breadcrumbHome: string;
    breadcrumbShop: string;
    bestSeller: string;
    newBadge: string;
    featured: string;
    discount: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    reviews: string;
    noReviews: string;
    chooseOptions: string;
    quantity: string;
    quantityOffers: string;
    mostOrdered: string;
    singleUnit: string;
    /** "قطعتان" — quantity-offer card label for 2 units. */
    twoUnits: string;
    /** "{n} قطع" — quantity-offer card label for 3+ units. */
    nUnits: string;
    specialOffer: string;
    save: string;
    freeShippingNote: string;
    description: string;
    features: string;
    related: string;
    faq: string;
    gallery: string;
    imageOf: string;
    orderNow: string;
    addToCart: string;
    whatsappAsk: string;
    callAsk: string;
    trustTitle: string;
    deliveryHome: string;
    deliveryOffice: string;
    deliveryTo58: string;
    codPayment: string;
    secureOrder: string;
    customerService: string;
    notAvailable: string;
    backToShop: string;
    informationalNote: string;
  };
  checkout: {
    formTitle: string;
    formSubtitle: string;
    firstName: string;
    lastName: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    phoneHint: string;
    email: string;
    emailOptional: string;
    wilaya: string;
    wilayaPlaceholder: string;
    commune: string;
    communePlaceholder: string;
    otherCommune: string;
    otherCommunePlaceholder: string;
    deliveryMethod: string;
    home: string;
    office: string;
    homeHint: string;
    officeHint: string;
    address: string;
    addressPlaceholder: string;
    /** Label of the office-pickup name field (radio label is `office`). */
    officeName: string;
    officePlaceholder: string;
    summary: string;
    products: string;
    shipping: string;
    shippingFree: string;
    shippingPending: string;
    discount: string;
    total: string;
    submit: string;
    submitting: string;
    codNote: string;
    secureNote: string;
    optional: string;
    required: string;
    quantityLabel: string;
    deliveryEstimate: string;
    trustNote: string;
  };
  errors: {
    firstName: string;
    lastName: string;
    phone: string;
    phoneMobile: string;
    wilaya: string;
    commune: string;
    address: string;
    office: string;
    options: string;
    optionRequired: string;
    optionMin: string;
    optionMax: string;
    variantUnavailable: string;
    outOfStock: string;
    sendFailed: string;
    network: string;
    rateLimited: string;
    duplicate: string;
  };
  success: {
    title: string;
    subtitle: string;
    orderNumber: string;
    total: string;
    callNote: string;
    backToShop: string;
    whatsapp: string;
  };
  footer: {
    about: string;
    aboutFallback: string;
    navigation: string;
    help: string;
    contact: string;
    policies: string;
    terms: string;
    privacy: string;
    faq: string;
    aboutPage: string;
    copyright: string;
    poweredBy: string;
    codLine: string;
  };
  common: {
    home: string;
    from: string;
    currency: string;
    seeMore: string;
    close: string;
    loading: string;
    yes: string;
    no: string;
  };
}

const ar: SouqCopy = {
  dir: "rtl",
  promo: {
    defaultBar: "توصيل إلى 58 ولاية • الدفع عند الاستلام",
    delivery: "توصيل إلى 58 ولاية",
    cod: "الدفع عند الاستلام",
    secure: "طلب آمن",
    support: "خدمة الزبائن",
  },
  nav: {
    home: "الرئيسية",
    shop: "المتجر",
    categories: "الأقسام",
    offers: "العروض",
    bestSellers: "الأكثر مبيعاً",
    newArrivals: "وصل حديثاً",
    contact: "تواصل معنا",
    about: "من نحن",
    faq: "الأسئلة الشائعة",
    menu: "القائمة",
    close: "إغلاق",
    openMenu: "فتح القائمة",
    langLabel: "اللغة",
  },
  search: {
    placeholder: "ابحث عن منتج...",
    open: "البحث عن منتج",
    close: "إغلاق البحث",
    results: "نتائج البحث",
    noResults: "لا توجد نتائج مطابقة",
    noResultsHint: "جرّب كلمة أخرى أو تصفح الأقسام.",
    loading: "جارٍ البحث...",
    viewAll: "عرض كل المنتجات",
    hint: "اكتب اسم المنتج للبحث الفوري",
  },
  hero: {
    badge: "عروض هذا الأسبوع",
    ctaFallback: "تسوق الآن",
    browseCategories: "تصفح الأقسام",
    trustDelivery: "توصيل لكل الولايات",
    trustCod: "الدفع عند الاستلام",
    trustSpeed: "توصيل سريع 24-48 ساعة",
  },
  sections: {
    categoriesTitle: "تسوق حسب القسم",
    categoriesSubtitle: "اختر القسم الذي يناسبك وابدأ التسوق",
    trendingTitle: "الأكثر رواجاً",
    trendingSubtitle: "منتجات يطلبها زبائننا كل يوم",
    flashTitle: "عروض محدودة",
    flashSubtitle: "خصومات على كمية محدودة — اطلب قبل نفاد المخزون",
    bestTitle: "الأكثر مبيعاً",
    bestSubtitle: "اختيار الزبائن الأكثر تكراراً",
    newTitle: "وصل حديثاً",
    newSubtitle: "أحدث ما أضفناه إلى المتجر",
    whyTitle: "لماذا تختارنا؟",
    whySubtitle: "نحن نهتم بتجربة الشراء من البداية إلى الاستلام",
    reviewsTitle: "آراء الزبائن",
    reviewsSubtitle: "شهادات حقيقية من زبائن طلبوا واستلموا",
    faqTitle: "الأسئلة الشائعة",
    faqSubtitle: "كل ما تحتاج معرفته قبل الطلب",
    contactTitle: "تواصل معنا",
    contactSubtitle: "فريقنا جاهز لمساعدتك",
    productsTitle: "منتجاتنا",
    noProducts: "لا توجد منتجات حالياً",
    noProductsHint: "سيعرض المتجر منتجاته هنا بمجرد إضافتها.",
    noCategories: "لا توجد أقسام بعد",
    noReviews: "لا توجد آراء منشورة حالياً",
    noFaq: "لا توجد أسئلة شائعة بعد",
    viewAll: "عرض الكل",
    offerBadge: "عرض خاص",
    offerNote: "خصم مباشر على الكمية — بدون رمز خصم",
  },
  product: {
    breadcrumbHome: "الرئيسية",
    breadcrumbShop: "المتجر",
    bestSeller: "الأكثر مبيعاً",
    newBadge: "جديد",
    featured: "مميز",
    discount: "خصم",
    inStock: "متوفر",
    lowStock: "آخر {n} قطع",
    outOfStock: "غير متوفر حالياً",
    reviews: "تقييم",
    noReviews: "لا توجد تقييمات بعد",
    chooseOptions: "اختر المواصفات",
    quantity: "الكمية",
    quantityOffers: "عروض الكمية",
    mostOrdered: "الأكثر طلباً",
    singleUnit: "قطعة واحدة",
    twoUnits: "قطعتان",
    nUnits: "{n} قطع",
    specialOffer: "عرض خاص",
    save: "توفير",
    freeShippingNote: "توصيل مجاني لهذا العرض",
    description: "الوصف",
    features: "المميزات",
    related: "منتجات مشابهة",
    faq: "أسئلة حول المنتج",
    gallery: "صور المنتج",
    imageOf: "صورة {n} من {total}",
    orderNow: "اطلب الآن",
    addToCart: "أضف إلى السلة",
    whatsappAsk: "اسأل على واتساب",
    callAsk: "اتصل بنا",
    trustTitle: "لماذا الطلب من عندنا؟",
    deliveryHome: "توصيل إلى المنزل",
    deliveryOffice: "توصيل إلى المكتب",
    deliveryTo58: "توصيل إلى 58 ولاية",
    codPayment: "الدفع عند الاستلام",
    secureOrder: "طلب آمن وسريع",
    customerService: "خدمة الزبائن",
    notAvailable: "هذا المنتج غير متوفر حالياً",
    backToShop: "العودة إلى المتجر",
    informationalNote: "سيتم تأكيد هذه الإضافات معك هاتفياً",
  },
  checkout: {
    formTitle: "أكمل طلبك",
    formSubtitle: "املأ معلوماتك وسنتصل بك لتأكيد الطلب",
    firstName: "الاسم",
    lastName: "اللقب",
    firstNamePlaceholder: "مثال: محمد",
    lastNamePlaceholder: "مثال: بن علي",
    phone: "رقم الهاتف",
    phonePlaceholder: "05 XX XX XX XX",
    phoneHint: "سنتصل بك على هذا الرقم لتأكيد الطلب",
    email: "البريد الإلكتروني",
    emailOptional: "البريد الإلكتروني (اختياري)",
    wilaya: "الولاية",
    wilayaPlaceholder: "اختر الولاية",
    commune: "البلدية",
    communePlaceholder: "اختر البلدية",
    otherCommune: "بلدية أخرى",
    otherCommunePlaceholder: "اكتب اسم البلدية",
    deliveryMethod: "طريقة التوصيل",
    home: "توصيل إلى المنزل",
    office: "التوصيل إلى المكتب",
    homeHint: "يوصلك عامل التوصيل إلى عنوانك",
    officeHint: "استلم طلبك من مكتب التوصيل",
    address: "العنوان",
    addressPlaceholder: "الحي، الشارع، رقم المنزل",
    officeName: "مكتب التوصيل",
    officePlaceholder: "اسم مكتب التوصيل القريب",
    summary: "ملخص الطلب",
    products: "سعر المنتجات",
    shipping: "سعر التوصيل",
    shippingFree: "مجاني",
    shippingPending: "يُحدد بعد اختيار الولاية",
    discount: "الخصم",
    total: "المجموع",
    submit: "تأكيد الطلب",
    submitting: "جارٍ إرسال الطلب...",
    codNote: "الدفع عند الاستلام",
    secureNote: "طلب آمن وسريع",
    optional: "اختياري",
    required: "إلزامي",
    quantityLabel: "الكمية",
    deliveryEstimate: "مدة التوصيل",
    trustNote: "المجموع يُحسب نهائياً من طرف المتجر",
  },
  errors: {
    firstName: "يرجى إدخال الاسم",
    lastName: "يرجى إدخال اللقب",
    phone: "يرجى إدخال رقم هاتف صحيح",
    phoneMobile: "يرجى إدخال رقم هاتف محمول جزائري صحيح (05/06/07)",
    wilaya: "يرجى اختيار الولاية",
    commune: "يرجى اختيار البلدية",
    address: "يرجى إدخال العنوان",
    office: "يرجى إدخال مكتب التوصيل",
    options: "يرجى اختيار المواصفات المطلوبة",
    optionRequired: "يرجى اختيار {label}",
    optionMin: "يرجى اختيار {n} على الأقل من {label}",
    optionMax: "لا يمكن اختيار أكثر من {n} من {label}",
    variantUnavailable: "هذه المواصفات غير متوفرة حالياً، جرّب خياراً آخر",
    outOfStock: "هذا المنتج غير متوفر حالياً",
    sendFailed: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى",
    network: "تعذر الاتصال بالخادم، تحقق من الإنترنت وحاول من جديد",
    rateLimited: "تم إرسال عدة طلبات من نفس الجهاز، حاول بعد قليل",
    duplicate: "تم تسجيل طلبك للتو، لا تكرر الإرسال",
  },
  success: {
    title: "تم استلام طلبك بنجاح",
    subtitle: "سنتواصل معك هاتفياً لتأكيد الطلب قبل الإرسال",
    orderNumber: "رقم الطلب",
    total: "المبلغ الإجمالي",
    callNote: "تأكد من أن هاتفك متاح، سنتصل بك على الرقم الذي أدخلته.",
    backToShop: "العودة إلى المتجر",
    whatsapp: "تابع طلبك على واتساب",
  },
  footer: {
    about: "عن المتجر",
    aboutFallback: "متجر جزائري للتسوق عبر الإنترنت مع الدفع عند الاستلام والتوصيل إلى كافة الولايات.",
    navigation: "التنقل",
    help: "المساعدة",
    contact: "تواصل معنا",
    policies: "الشروط والسياسات",
    terms: "الشروط العامة",
    privacy: "سياسة الخصوصية",
    faq: "الأسئلة الشائعة",
    aboutPage: "من نحن",
    copyright: "جميع الحقوق محفوظة",
    poweredBy: "مدعوم بواسطة",
    codLine: "الدفع عند الاستلام • توصيل إلى 58 ولاية",
  },
  common: {
    home: "الرئيسية",
    from: "ابتداءً من",
    currency: "دج",
    seeMore: "المزيد",
    close: "إغلاق",
    loading: "جارٍ التحميل...",
    yes: "نعم",
    no: "لا",
  },
};

const fr: SouqCopy = {
  ...ar,
  dir: "ltr",
  product: { ...ar.product, singleUnit: "1 pièce", twoUnits: "2 pièces", nUnits: "{n} pièces" },
  promo: {
    defaultBar: "Livraison 58 wilayas • Paiement à la livraison",
    delivery: "Livraison 58 wilayas",
    cod: "Paiement à la livraison",
    secure: "Commande sécurisée",
    support: "Service client",
  },
  nav: {
    ...ar.nav,
    home: "Accueil",
    shop: "Boutique",
    categories: "Catégories",
    offers: "Offres",
    bestSellers: "Meilleures ventes",
    newArrivals: "Nouveautés",
    contact: "Contact",
    about: "À propos",
    faq: "FAQ",
    menu: "Menu",
    close: "Fermer",
    openMenu: "Ouvrir le menu",
    langLabel: "Langue",
  },
  search: {
    ...ar.search,
    placeholder: "Rechercher un produit…",
    open: "Rechercher un produit",
    close: "Fermer la recherche",
    results: "Résultats",
    noResults: "Aucun résultat",
    noResultsHint: "Essayez un autre mot-clé ou parcourez les catégories.",
    viewAll: "Voir tous les produits",
    hint: "Recherche instantanée",
  },
  checkout: {
    ...ar.checkout,
    formTitle: "Finalisez votre commande",
    formSubtitle: "Remplissez vos informations, nous vous appelons pour confirmer.",
    firstName: "Prénom",
    lastName: "Nom",
    phone: "Téléphone",
    wilaya: "Wilaya",
    commune: "Commune",
    deliveryMethod: "Mode de livraison",
    home: "Livraison à domicile",
    office: "Livraison au bureau",
    address: "Adresse",
    officeName: "Bureau de livraison",
    summary: "Récapitulatif",
    products: "Produits",
    shipping: "Livraison",
    discount: "Remise",
    total: "Total",
    submit: "Confirmer la commande",
    submitting: "Envoi en cours…",
    codNote: "Paiement à la livraison",
    secureNote: "Commande sécurisée et rapide",
  },
  success: {
    ...ar.success,
    title: "Votre commande est enregistrée",
    subtitle: "Nous vous appelons pour confirmer avant expédition.",
    orderNumber: "Numéro de commande",
    backToShop: "Retour à la boutique",
  },
};

const en: SouqCopy = {
  ...ar,
  dir: "ltr",
  product: { ...ar.product, singleUnit: "1 unit", twoUnits: "2 units", nUnits: "{n} units" },
  promo: {
    defaultBar: "Delivery to 58 wilayas • Cash on delivery",
    delivery: "Delivery to 58 wilayas",
    cod: "Cash on delivery",
    secure: "Secure order",
    support: "Customer service",
  },
  nav: {
    ...ar.nav,
    home: "Home",
    shop: "Shop",
    categories: "Categories",
    offers: "Offers",
    bestSellers: "Best sellers",
    newArrivals: "New arrivals",
    contact: "Contact us",
    about: "About",
    faq: "FAQ",
    menu: "Menu",
    close: "Close",
    openMenu: "Open menu",
    langLabel: "Language",
  },
  search: {
    ...ar.search,
    placeholder: "Search a product…",
    open: "Search a product",
    close: "Close search",
    results: "Results",
    noResults: "No results",
    noResultsHint: "Try another keyword or browse categories.",
    viewAll: "View all products",
    hint: "Instant search",
  },
  checkout: {
    ...ar.checkout,
    formTitle: "Complete your order",
    formSubtitle: "Fill in your details and we will call you to confirm.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    wilaya: "Province",
    commune: "Municipality",
    deliveryMethod: "Delivery method",
    home: "Home delivery",
    office: "Office pickup",
    address: "Address",
    officeName: "Pickup office",
    summary: "Order summary",
    products: "Products",
    shipping: "Shipping",
    discount: "Discount",
    total: "Total",
    submit: "Confirm order",
    submitting: "Sending…",
    codNote: "Cash on delivery",
    secureNote: "Secure and fast order",
  },
  success: {
    ...ar.success,
    title: "Your order has been received",
    subtitle: "We will call you to confirm before shipping.",
    orderNumber: "Order number",
    backToShop: "Back to shop",
  },
};

const DICTS: Record<StoreLanguage, SouqCopy> = { ar, fr, en };

/** SOUQ copy for a locale (Arabic-first, defaults to Arabic). */
export function souqCopy(lang?: StoreLanguage | string | null): SouqCopy {
  if (lang === "fr") return DICTS.fr;
  if (lang === "en") return DICTS.en;
  return DICTS.ar;
}

/** Simple {placeholder} interpolation used by every SOUQ string. */
export function souqFormat(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    template,
  );
}
