/**
 * Storefront i18n (French, Arabic with RTL, English).
 * Dashboards are French-only by product decision; storefronts are trilingual
 * via a single codebase — `dir="rtl"` is applied for Arabic at the layout level.
 */
import type { StoreLanguage } from "../types";

export interface StorefrontDict {
  dir: "ltr" | "rtl";
  nav: {
    home: string;
    shop: string;
    about: string;
    faq: string;
    contact: string;
    search: string;
  };
  actions: {
    order: string;
    addToCart: string;
    viewProduct: string;
    call: string;
    whatsapp: string;
    send: string;
    back: string;
    seeMore: string;
    readMore: string;
  };
  cart: {
    title: string;
    empty: string;
    subtotal: string;
    checkout: string;
    remove: string;
    free: string;
  };
  checkout: {
    title: string;
    subtitle: string;
    fullName: string;
    phone: string;
    email: string;
    emailOptional: string;
    wilaya: string;
    commune: string;
    otherCommune: string;
    address: string;
    addressOptional: string;
    deliveryType: string;
    homeDelivery: string;
    officeDelivery: string;
    office: string;
    officePlaceholder: string;
    total: string;
    subtotal: string;
    shipping: string;
    shippingFree: string;
    placeOrder: string;
    codBadge: string;
    secureNote: string;
  };
  success: {
    title: string;
    text: string;
    orderNumber: string;
    note: string;
    continue: string;
  };
  product: {
    inStock: string;
    outOfStock: string;
    lowStock: string;
    quantity: string;
    offers: string;
    description: string;
    reviews: string;
    noReviews: string;
    related: string;
  };
  shop: {
    title: string;
    search: string;
    noResults: string;
    categories: string;
    all: string;
  };
  footer: {
    rights: string;
    cod: string;
    legalTerms: string;
    privacy: string;
  };
  faq: { title: string; empty: string };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    message: string;
    placeholderMessage: string;
    send: string;
    sent: string;
    sentText: string;
  };
  about: { title: string };
  legal: { terms: string; privacy: string };
  previewBanner: string;
  suspended: string;
  notFound: string;
  notFoundText: string;
}

const fr: StorefrontDict = {
  dir: "ltr",
  nav: { home: "Accueil", shop: "Boutique", about: "À propos", faq: "FAQ", contact: "Contact", search: "Rechercher" },
  actions: {
    order: "Commander",
    addToCart: "Ajouter au panier",
    viewProduct: "Voir le produit",
    call: "Appeler",
    whatsapp: "WhatsApp",
    send: "Envoyer",
    back: "Retour",
    seeMore: "Voir plus",
    readMore: "Lire la suite",
  },
  cart: {
    title: "Mon panier",
    empty: "Votre panier est vide.",
    subtotal: "Sous-total",
    checkout: "Commander",
    remove: "Retirer",
    free: "Gratuit",
  },
  checkout: {
    title: "Finaliser ma commande",
    subtitle: "Paiement à la livraison — payez uniquement à la réception de votre colis.",
    fullName: "Nom complet",
    phone: "Téléphone (WhatsApp)",
    email: "Email",
    emailOptional: "Email (facultatif)",
    wilaya: "Wilaya",
    commune: "Commune",
    otherCommune: "Autre commune",
    address: "Adresse complète",
    addressOptional: "Adresse (facultatif pour livraison au bureau)",
    deliveryType: "Mode de livraison",
    homeDelivery: "À domicile",
    officeDelivery: "Au bureau",
    office: "Bureau de livraison",
    officePlaceholder: "Ex : Bureau Alger Centre",
    total: "Total à payer",
    subtotal: "Sous-total",
    shipping: "Livraison",
    shippingFree: "Livraison gratuite",
    placeOrder: "Confirmer ma commande",
    codBadge: "Paiement à la livraison",
    secureNote: "Vos données ne sont utilisées que pour traiter votre commande.",
  },
  success: {
    title: "Commande enregistrée",
    text: "Merci ! Votre commande a bien été enregistrée. Notre équipe vous contactera très vite pour la confirmation.",
    orderNumber: "Numéro de commande",
    note: "Gardez ce numéro précieusement. Vous serez appelé au numéro indiqué avant la livraison.",
    continue: "Continuer mes achats",
  },
  product: {
    inStock: "En stock",
    outOfStock: "Rupture de stock",
    lowStock: "Plus que {n} en stock",
    quantity: "Quantité",
    offers: "Offres",
    description: "Description",
    reviews: "Avis clients",
    noReviews: "Aucun avis pour le moment.",
    related: "Vous aimerez aussi",
  },
  shop: {
    title: "Boutique",
    search: "Rechercher un produit…",
    noResults: "Aucun produit trouvé.",
    categories: "Catégories",
    all: "Tout",
  },
  footer: {
    rights: "Tous droits réservés",
    cod: "Paiement à la livraison dans toute l'Algérie",
    legalTerms: "Conditions générales",
    privacy: "Confidentialité",
  },
  faq: { title: "Questions fréquentes", empty: "Aucune question pour le moment." },
  contact: {
    title: "Contactez-nous",
    subtitle: "Une question ? Nous vous répondons rapidement.",
    name: "Votre nom",
    message: "Votre message",
    placeholderMessage: "Écrivez votre message ici…",
    send: "Envoyer le message",
    sent: "Message envoyé",
    sentText: "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.",
  },
  about: { title: "À propos" },
  legal: { terms: "Conditions générales", privacy: "Politique de confidentialité" },
  previewBanner: "Aperçu — cette version n'est pas encore publiée.",
  suspended: "Ce site est momentanément suspendu. Revenez plus tard.",
  notFound: "Page introuvable",
  notFoundText: "La page demandée n'existe pas ou a été déplacée.",
};

const ar: StorefrontDict = {
  dir: "rtl",
  nav: { home: "الرئيسية", shop: "المتجر", about: "من نحن", faq: "الأسئلة الشائعة", contact: "اتصل بنا", search: "بحث" },
  actions: {
    order: "اطلب الآن",
    addToCart: "أضف إلى السلة",
    viewProduct: "عرض المنتج",
    call: "اتصل",
    whatsapp: "واتساب",
    send: "إرسال",
    back: "رجوع",
    seeMore: "عرض المزيد",
    readMore: "اقرأ المزيد",
  },
  cart: {
    title: "سلة التسوق",
    empty: "سلتك فارغة.",
    subtotal: "المجموع الفرعي",
    checkout: "اطلب الآن",
    remove: "إزالة",
    free: "مجاني",
  },
  checkout: {
    title: "إتمام الطلب",
    subtitle: "الدفع عند الاستلام — ادفع فقط عند وصول الطرد إليك.",
    fullName: "الاسم الكامل",
    phone: "الهاتف (واتساب)",
    email: "البريد الإلكتروني",
    emailOptional: "البريد الإلكتروني (اختياري)",
    wilaya: "الولاية",
    commune: "البلدية",
    otherCommune: "بلدية أخرى",
    address: "العنوان الكامل",
    addressOptional: "العنوان (اختياري للتوصيل إلى المكتب)",
    deliveryType: "طريقة التوصيل",
    homeDelivery: "إلى المنزل",
    officeDelivery: "إلى المكتب",
    office: "مكتب التوصيل",
    officePlaceholder: "مثال: مكتب وسط الجزائر",
    total: "المبلغ الإجمالي",
    subtotal: "المجموع الفرعي",
    shipping: "التوصيل",
    shippingFree: "توصيل مجاني",
    placeOrder: "تأكيد الطلب",
    codBadge: "الدفع عند الاستلام",
    secureNote: "تُستخدم بياناتك فقط لمعالجة طلبك.",
  },
  success: {
    title: "تم تسجيل الطلب",
    text: "شكراً لك! تم تسجيل طلبك بنجاح. سيتواصل معك فريقنا قريباً للتأكيد.",
    orderNumber: "رقم الطلب",
    note: "احتفظ بهذا الرقم. سنقوم بالاتصال بالرقم المذكور قبل التوصيل.",
    continue: "مواصلة التسوق",
  },
  product: {
    inStock: "متوفر في المخزون",
    outOfStock: "غير متوفر",
    lowStock: "تبقى {n} قطع فقط",
    quantity: "الكمية",
    offers: "العروض",
    description: "الوصف",
    reviews: "آراء العملاء",
    noReviews: "لا توجد آراء حالياً.",
    related: "قد يعجبك أيضاً",
  },
  shop: {
    title: "المتجر",
    search: "ابحث عن منتج…",
    noResults: "لم يتم العثور على منتجات.",
    categories: "الفئات",
    all: "الكل",
  },
  footer: {
    rights: "جميع الحقوق محفوظة",
    cod: "الدفع عند الاستلام في جميع أنحاء الجزائر",
    legalTerms: "الشروط العامة",
    privacy: "الخصوصية",
  },
  faq: { title: "الأسئلة الشائعة", empty: "لا توجد أسئلة حالياً." },
  contact: {
    title: "اتصل بنا",
    subtitle: "لديك سؤال؟ سنرد عليك بسرعة.",
    name: "اسمك",
    message: "رسالتك",
    placeholderMessage: "اكتب رسالتك هنا…",
    send: "إرسال الرسالة",
    sent: "تم إرسال الرسالة",
    sentText: "شكراً، تم إرسال رسالتك. سنرد عليك قريباً.",
  },
  about: { title: "من نحن" },
  legal: { terms: "الشروط العامة", privacy: "سياسة الخصوصية" },
  previewBanner: "معاينة — هذه النسخة غير منشورة بعد.",
  suspended: "هذا الموقع معلق مؤقتاً. عد لاحقاً.",
  notFound: "الصفحة غير موجودة",
  notFoundText: "الصفحة المطلوبة غير موجودة أو تم نقلها.",
};

const en: StorefrontDict = {
  dir: "ltr",
  nav: { home: "Home", shop: "Shop", about: "About", faq: "FAQ", contact: "Contact", search: "Search" },
  actions: {
    order: "Order now",
    addToCart: "Add to cart",
    viewProduct: "View product",
    call: "Call",
    whatsapp: "WhatsApp",
    send: "Send",
    back: "Back",
    seeMore: "See more",
    readMore: "Read more",
  },
  cart: {
    title: "My cart",
    empty: "Your cart is empty.",
    subtotal: "Subtotal",
    checkout: "Checkout",
    remove: "Remove",
    free: "Free",
  },
  checkout: {
    title: "Complete your order",
    subtitle: "Cash on delivery — pay only when your parcel arrives.",
    fullName: "Full name",
    phone: "Phone (WhatsApp)",
    email: "Email",
    emailOptional: "Email (optional)",
    wilaya: "Province (Wilaya)",
    commune: "Municipality",
    otherCommune: "Other municipality",
    address: "Full address",
    addressOptional: "Address (optional for office delivery)",
    deliveryType: "Delivery method",
    homeDelivery: "Home delivery",
    officeDelivery: "Office delivery",
    office: "Delivery office",
    officePlaceholder: "e.g. Algier Centre office",
    total: "Total to pay",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shippingFree: "Free shipping",
    placeOrder: "Confirm my order",
    codBadge: "Cash on delivery",
    secureNote: "Your data is only used to process your order.",
  },
  success: {
    title: "Order registered",
    text: "Thank you! Your order has been registered. Our team will contact you shortly to confirm.",
    orderNumber: "Order number",
    note: "Keep this number. We will call the number you provided before delivery.",
    continue: "Continue shopping",
  },
  product: {
    inStock: "In stock",
    outOfStock: "Out of stock",
    lowStock: "Only {n} left in stock",
    quantity: "Quantity",
    offers: "Offers",
    description: "Description",
    reviews: "Customer reviews",
    noReviews: "No reviews yet.",
    related: "You may also like",
  },
  shop: {
    title: "Shop",
    search: "Search a product…",
    noResults: "No products found.",
    categories: "Categories",
    all: "All",
  },
  footer: {
    rights: "All rights reserved",
    cod: "Cash on delivery across Algeria",
    legalTerms: "Terms & conditions",
    privacy: "Privacy",
  },
  faq: { title: "Frequently asked questions", empty: "No questions yet." },
  contact: {
    title: "Contact us",
    subtitle: "A question? We reply quickly.",
    name: "Your name",
    message: "Your message",
    placeholderMessage: "Write your message here…",
    send: "Send message",
    sent: "Message sent",
    sentText: "Thank you, your message has been sent. We will get back to you soon.",
  },
  about: { title: "About us" },
  legal: { terms: "Terms & conditions", privacy: "Privacy policy" },
  previewBanner: "Preview — this version is not published yet.",
  suspended: "This site is temporarily suspended. Please come back later.",
  notFound: "Page not found",
  notFoundText: "The page you requested does not exist or has been moved.",
};

export const DICTS: Record<StoreLanguage, StorefrontDict> = { fr, ar, en };

export function t(lang: StoreLanguage): StorefrontDict {
  return DICTS[lang] ?? fr;
}
