/**
 * Merchant dashboard i18n — FR/AR/EN per user preference, independent from storefront language.
 * AR is RTL.
 */

export type DashboardLang = "fr" | "ar" | "en";

export const DASHBOARD_LANGS: Array<{ code: DashboardLang; label: string; flag: string; dir: "ltr" | "rtl" }> = [
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇩🇿", dir: "rtl" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
];

type Dict = Record<string, string>;

const FR: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.orders": "Commandes",
  "nav.abandonedOrders": "Commandes abandonnées",
  "nav.products": "Produits",
  "nav.categories": "Catégories",
  "nav.customers": "Clients",
  "nav.statistics": "Statistiques",
  "nav.website": "Mon site web",
  "nav.delivery": "Livraison",
  "nav.marketing": "Marketing",
  "nav.settings": "Paramètres",
  "nav.inventory": "Inventaire",
  "nav.reviews": "Avis",
  "nav.faq": "FAQ",
  "nav.banners": "Bannières",
  "nav.team": "Équipe",
  "nav.logout": "Déconnexion",
  "topbar.support": "Mode support",
  "topbar.quit": "Quitter support",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.delete": "Supprimer",
  "common.edit": "Modifier",
  "common.create": "Créer",
  "common.search": "Rechercher",
  "common.loading": "Chargement…",
  "dashboard.welcome": "Bienvenue",
  "dashboard.overview": "Vue d'ensemble",
};

const AR: Dict = {
  "nav.dashboard": "لوحة التحكم",
  "nav.orders": "الطلبات",
  "nav.abandonedOrders": "الطلبات المتروكة",
  "nav.products": "المنتجات",
  "nav.categories": "الفئات",
  "nav.customers": "العملاء",
  "nav.statistics": "الإحصائيات",
  "nav.website": "موقعي",
  "nav.delivery": "التوصيل",
  "nav.marketing": "التسويق",
  "nav.settings": "الإعدادات",
  "nav.inventory": "المخزون",
  "nav.reviews": "التقييمات",
  "nav.faq": "الأسئلة الشائعة",
  "nav.banners": "اللافتات",
  "nav.team": "الفريق",
  "nav.logout": "تسجيل خروج",
  "topbar.support": "وضع الدعم",
  "topbar.quit": "الخروج من الدعم",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.create": "إنشاء",
  "common.search": "بحث",
  "common.loading": "جار التحميل…",
  "dashboard.welcome": "مرحبا",
  "dashboard.overview": "نظرة عامة",
};

const EN: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.orders": "Orders",
  "nav.abandonedOrders": "Abandoned orders",
  "nav.products": "Products",
  "nav.categories": "Categories",
  "nav.customers": "Customers",
  "nav.statistics": "Statistics",
  "nav.website": "My website",
  "nav.delivery": "Delivery",
  "nav.marketing": "Marketing",
  "nav.settings": "Settings",
  "nav.inventory": "Inventory",
  "nav.reviews": "Reviews",
  "nav.faq": "FAQ",
  "nav.banners": "Banners",
  "nav.team": "Team",
  "nav.logout": "Logout",
  "topbar.support": "Support mode",
  "topbar.quit": "Quit support",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.create": "Create",
  "common.search": "Search",
  "common.loading": "Loading…",
  "dashboard.welcome": "Welcome",
  "dashboard.overview": "Overview",
};

const DICTS: Record<DashboardLang, Dict> = { fr: FR, ar: AR, en: EN };

export function getDashboardDict(lang: DashboardLang): Dict {
  return DICTS[lang] ?? FR;
}

export function t(lang: DashboardLang, key: string, fallback?: string): string {
  const dict = getDashboardDict(lang);
  return dict[key] ?? fallback ?? key;
}

export function getLangDir(lang: DashboardLang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}
