/**
 * Template registry + default content generated at store creation.
 * 8 production-quality templates with distinct visual identities (not just recolors).
 * The wizard and the "regenerate default sections" repair tool use these.
 * Content is structured JSON only.
 */
import type { WebsiteType } from "../types";
import type { Section } from "../sections/definitions";
import { shortId } from "../utils";
import type { StoreSettings } from "../supabase/database.types";
import { SOUQ_TEMPLATE_ALIASES, SOUQ_TEMPLATE_KEY, isSouqTemplate, souqContentPages, souqHomeSections } from "./souq";
import { LAMSA_TEMPLATE_KEY, isLamsaTemplate, lamsaContentPages, lamsaHomeSections } from "./lamsa";

export interface TemplateMeta {
  key: string;
  name: string;
  category: "Fashion" | "Beauty" | "Tech" | "Home" | "Baby" | "Sport" | "General store" | "Single product" | "Portfolio" | "Legacy";
  description: string;
  websiteTypes: WebsiteType[];
  screenshotUrl: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string | null;
    typography: "modern" | "elegant" | "bold" | "minimal";
    buttonShape: "rounded" | "sharp" | "pill";
  };
  sections: string[]; // list of section types used
  // --- Optional, additive metadata (existing templates: unchanged) ---------
  /** Short machine category used for filtering ("general", "fashion", …). */
  categoryKey?: string;
  /** Accepted alternative keys (never generated for new stores). */
  aliases?: readonly string[];
  /** Default storefront language for stores created with this template. */
  language?: "fr" | "ar" | "en";
  /** Reading direction of the template identity. */
  direction?: "ltr" | "rtl";
  /** Mobile preview image for the admin/wizard gallery. */
  previewMobileUrl?: string;
  /** Marketing badges shown in the selection gallery. */
  badges?: string[];
  /** Presentation capabilities (informational, drives nothing destructive). */
  highlights?: {
    dynamicVariants?: boolean;
    multiSelectOptions?: boolean;
    quantityOffers?: boolean;
    codForm?: boolean;
    rtl?: boolean;
  };
}

export const TEMPLATES: TemplateMeta[] = [
  // --- 8 NEW PRODUCTION TEMPLATES ---
  {
    key: "elegance",
    name: "ELEGANCE",
    category: "Fashion",
    description: "Luxe éditorial pour mode, hijab, abaya — beige/taupe/noir/ivoire, imagerie fashion large, typographie raffinée, cartes collection premium.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/elegance.svg",
    theme: { primaryColor: "#1c1917", secondaryColor: "#a16207", backgroundColor: "#faf9f7", typography: "elegant", buttonShape: "sharp" },
    sections: ["Hero", "New arrivals", "Collections", "Best sellers", "Lifestyle banner", "Products", "Delivery benefits", "Reviews", "FAQ", "Social", "Footer"],
  },
  {
    key: "glow",
    name: "GLOW",
    category: "Beauty",
    description: "Clean, doux, nude/pastel/blanc, cartes arrondies, éditorial beauté, sections avant/après, focus bénéfices.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/glow.svg",
    theme: { primaryColor: "#db2777", secondaryColor: "#fce7f3", backgroundColor: "#ffffff", typography: "modern", buttonShape: "rounded" },
    sections: ["Hero", "Bestsellers", "Benefits", "Categories", "Before/after", "Routine", "Products", "Reviews", "FAQ", "COD CTA"],
  },
  {
    key: "tech",
    name: "TECH",
    category: "Tech",
    description: "Dark, graphite, bleu électrique, cartes techniques, badges spécifications, emphase détail produit.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/tech.svg",
    theme: { primaryColor: "#0f172a", secondaryColor: "#38bdf8", backgroundColor: "#020617", typography: "bold", buttonShape: "sharp" },
    sections: ["Hero", "Categories", "Trending products", "Features/specs", "Promotion banner", "Comparison", "Reviews", "COD benefits", "FAQ"],
  },
  {
    key: "casa",
    name: "CASA",
    category: "Home",
    description: "Chaleureux, crème, olive, terracotta, imagerie lifestyle, style éditorial maison.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/casa.svg",
    theme: { primaryColor: "#57534e", secondaryColor: "#a3a3a3", backgroundColor: "#fdfbf7", typography: "minimal", buttonShape: "rounded" },
    sections: ["Hero", "Categories", "Best sellers", "Usage/lifestyle", "Promotion banner", "Products", "Benefits", "Reviews", "FAQ"],
  },
  {
    key: "little",
    name: "LITTLE",
    category: "Baby",
    description: "Pastel doux, arrondi, amical, confiance/sécurité, sélection par âge.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/little.svg",
    theme: { primaryColor: "#f472b6", secondaryColor: "#fef3c7", backgroundColor: "#fff7ed", typography: "modern", buttonShape: "rounded" },
    sections: ["Hero", "Age/category selector", "New arrivals", "Popular products", "Promo banner", "Quality/safety", "Parent reviews", "FAQ"],
  },
  {
    key: "active",
    name: "ACTIVE",
    category: "Sport",
    description: "Dynamique, noir/blanc, accent vif, typographie forte, imagerie mouvement.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/active.svg",
    theme: { primaryColor: "#000000", secondaryColor: "#22c55e", backgroundColor: "#ffffff", typography: "bold", buttonShape: "pill" },
    sections: ["Hero", "Categories", "Best sellers", "Goals/use cases", "Products", "Stats", "Reviews", "Promo", "FAQ"],
  },
  {
    key: "market",
    name: "MARKET",
    category: "General store",
    description: "Template ultra-polyvalent pour magasin général algérien COD — commercial, clean, rapide, badges offres visibles, orienté conversion mobile. Extrêmement important.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/market.svg",
    theme: { primaryColor: "#2563eb", secondaryColor: "#f59e0b", backgroundColor: "#ffffff", typography: "modern", buttonShape: "rounded" },
    sections: ["Promo bar", "Hero", "Categories", "Trending products", "Flash offers", "New arrivals", "Products", "Reviews", "FAQ"],
  },
  {
    key: "convert",
    name: "CONVERT",
    category: "Single product",
    description: "Landing page COD ultra-optimisée pour trafic payant Meta/TikTok — galerie produit/vidéo, problème/solution, bénéfices, comment ça marche, avant/après, preuve sociale, offres quantité, avis, FAQ, formulaire COD, sticky CTA. Spécialement conversion mobile.",
    websiteTypes: ["single_product"],
    screenshotUrl: "/images/templates/convert.svg",
    theme: { primaryColor: "#dc2626", secondaryColor: "#111827", backgroundColor: "#ffffff", typography: "bold", buttonShape: "pill" },
    sections: ["Hero", "Product gallery/video", "Problem", "Solution", "Benefits", "How it works", "Before/after", "Social proof", "Quantity offers", "Reviews", "FAQ", "COD order form", "Sticky CTA"],
  },
  // --- LAMSA (premium Arabic modest-fashion storefront) ---
  {
    key: LAMSA_TEMPLATE_KEY,
    name: "LAMSA",
    category: "Fashion",
    categoryKey: "fashion",
    language: "ar",
    direction: "rtl",
    description:
      "LAMSA — قالب عربي فاخر للأزياء المحتشمة والحجاب والعبايات. هوية تحريرية هادئة، صور بنسبة 4:5، مجموعات بصرية، بحث سريع، صفحة منتج بمعرض ديناميكي وخيارات متعددة وعروض كمية ونموذج دفع عند الاستلام مباشر.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/lamsa-v1.svg",
    previewMobileUrl: "/images/templates/lamsa-v1-mobile.svg",
    badges: ["Arabic-first", "RTL", "Fashion", "COD", "Mobile-first"],
    highlights: { dynamicVariants: true, multiSelectOptions: true, quantityOffers: true, codForm: true, rtl: true },
    theme: {
      primaryColor: "#4A382F",
      secondaryColor: "#B79B6C",
      backgroundColor: "#FAF7F2",
      typography: "elegant",
      buttonShape: "rounded",
    },
    sections: [
      "Announcement bar", "Editorial hero", "New arrivals", "Image-led collections",
      "Best sellers", "Lifestyle editorial", "Campaign banner", "Featured products",
      "Trust benefits", "Editorial reviews", "Social gallery", "FAQ", "Footer",
      "4:5 product gallery", "Dynamic variants", "Color/image swatches",
      "Quantity offers", "Inline COD form", "Sticky mobile order CTA",
    ],
  },
  // --- SOUQ (first production storefront template, Arabic-first RTL) ---
  {
    key: SOUQ_TEMPLATE_KEY,
    name: "SOUQ",
    category: "General store",
    categoryKey: "general",
    aliases: SOUQ_TEMPLATE_ALIASES,
    language: "ar",
    direction: "rtl",
    description:
      "SOUQ — قالب المتاجر الجزائرية العامة (Arabic-first RTL). متجر حديث سريع موجّه للتحويل مع الدفع عند الاستلام، أقسام قوية، عروض الكمية، مواصفات ديناميكية (لون/مقاس/إضافات)، نموذج طلب COD أنيق وتجربة موبايل شبيهة بالتطبيقات. Sections: Promo bar/Hero/Categories/Trending/Flash offers/Best sellers/Banner/New arrivals/Why us/Reviews/FAQ/Contact/Footer + product page (gallery, dynamic options, quantity offers, COD form, sticky CTA).",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/souq-v1.svg",
    previewMobileUrl: "/images/templates/souq-v1-mobile.svg",
    badges: ["Arabic-first", "RTL", "COD", "Mobile-first"],
    highlights: { dynamicVariants: true, multiSelectOptions: true, quantityOffers: true, codForm: true, rtl: true },
    theme: {
      primaryColor: "#0f2a47",
      secondaryColor: "#f59e0b",
      backgroundColor: "#f8fafc",
      typography: "modern",
      buttonShape: "rounded",
    },
    sections: [
      "Promo bar",
      "Hero",
      "Categories",
      "Trending products",
      "Flash offers",
      "Best sellers",
      "Promotional banner",
      "New arrivals",
      "Why choose us",
      "Reviews",
      "FAQ",
      "Contact/Social",
      "Footer",
      "Product gallery",
      "Dynamic variants",
      "Quantity offers",
      "COD form",
      "Sticky CTA",
    ],
  },
  // --- LEGACY (kept for existing stores) ---
  {
    key: "ecommerce-modern",
    name: "Ecommerce Modern (Legacy)",
    category: "Legacy",
    description: "Boutique COD moderne et polyvalente — legacy, remplacé par MARKET.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/ecommerce-modern.png",
    theme: { primaryColor: "#1d4ed8", secondaryColor: "#f59e0b", backgroundColor: "#ffffff", typography: "modern", buttonShape: "rounded" },
    sections: ["Hero", "Collections", "Best sellers", "Banner", "Features", "Reviews", "FAQ"],
  },
  {
    key: "fashion-luxury",
    name: "Fashion Luxury (Legacy)",
    category: "Legacy",
    description: "Style élégant pour mode — legacy, remplacé par ELEGANCE.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/fashion-luxury.png",
    theme: { primaryColor: "#292524", secondaryColor: "#a16207", backgroundColor: "#faf9f7", typography: "elegant", buttonShape: "sharp" },
    sections: ["Hero", "Collections", "Best sellers", "Banner", "Reviews", "FAQ", "CTA"],
  },
  {
    key: "single-product",
    name: "Single Product COD (Legacy)",
    category: "Legacy",
    description: "Landing conversion — legacy, remplacé par CONVERT.",
    websiteTypes: ["single_product"],
    screenshotUrl: "/images/templates/single-product.png",
    theme: { primaryColor: "#dc2626", secondaryColor: "#111827", backgroundColor: "#ffffff", typography: "bold", buttonShape: "pill" },
    sections: ["Hero", "Features", "How it works", "Social proof", "Offer", "Reviews", "FAQ", "COD form", "Sticky CTA"],
  },
  {
    key: "portfolio",
    name: "Portfolio Professional",
    category: "Portfolio",
    description: "Vitrine professionnelle : médecins, architectes, consultants, agences, photographes…",
    websiteTypes: ["portfolio"],
    screenshotUrl: "/images/templates/portfolio.png",
    theme: { primaryColor: "#0f766e", secondaryColor: "#1e293b", backgroundColor: "#ffffff", typography: "minimal", buttonShape: "rounded" },
    sections: ["Hero", "Stats", "Services", "Gallery", "Testimonials", "Hours", "Map", "FAQ", "Contact"],
  },
];

export function getTemplate(key: string): TemplateMeta | undefined {
  const direct = TEMPLATES.find((t) => t.key === key);
  if (direct) return direct;
  // Alias-tolerant lookup (e.g. "souq" → "souq-v1"); existing keys are unaffected.
  return TEMPLATES.find((t) => t.aliases?.includes(key));
}

export function getTemplatesByCategory(category: string): TemplateMeta[] {
  if (category === "all") return TEMPLATES.filter((t) => t.category !== "Legacy");
  return TEMPLATES.filter((t) => t.category === category);
}

// ---------------------------------------------------------------------------
// Default homepage sections per template (distinct)
// ---------------------------------------------------------------------------

function s(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

export function defaultHomeSections(templateKey: string, websiteType: WebsiteType, businessName: string): Section[] {
  if (isLamsaTemplate(templateKey)) {
    return lamsaHomeSections(businessName);
  }
  if (isSouqTemplate(templateKey)) {
    return souqHomeSections(businessName);
  }
  switch (templateKey) {
    case "elegance":
      return [
        s("hero", { title: businessName, subtitle: "Collection exclusive — élégance intemporelle, livraison 58 wilayas.", image: "https://picsum.photos/seed/elegance-hero/1600/900", button_text: "Découvrir la collection", button_link: "/boutique", alignment: "center" }),
        s("collections", { title: "Nouveautés", subtitle: "Les dernières pièces sélectionnées avec soin.", category_id: null, max_items: 3 }),
        s("collections", { title: "Nos collections", subtitle: "Abayas, hijabs, ensembles — style premium.", category_id: null, max_items: 4 }),
        s("products", { title: "Best sellers", subtitle: "Les favorites de nos clientes.", source: "featured", product_count: 4 }),
        s("banner", { title: "Éditorial lifestyle", subtitle: "Inspirez-vous de nos looks — qualité premium, coupe parfaite.", desktop_image: "https://picsum.photos/seed/elegance-banner/1600/700", mobile_image: "https://picsum.photos/seed/elegance-banner-m/800/1000", button_text: "Voir le lookbook", button_link: "/boutique", alignment: "center" }),
        s("products", { title: "Sélection premium", subtitle: null, source: "latest", product_count: 4 }),
        s("features", { title: "Livraison & retours", subtitle: "Paiement à la livraison — essayez avant de payer.", items: [{ title: "Livraison 24-48h", text: "58 wilayas, suivi inclus." }, { title: "Échange facile", text: "Taille ne convient pas ? Échange sous 7 jours." }, { title: "Qualité premium", text: "Tissus haut de gamme, finitions soignées." }] }),
        s("reviews", { title: "Elles nous font confiance", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("cta", { title: `Rejoignez ${businessName}`, text: "Suivez-nous sur Instagram pour les nouveautés.", button_text: "Instagram", button_link: null }),
      ];
    case "glow":
      return [
        s("hero", { title: `${businessName} — Révélez votre éclat naturel`, subtitle: "Skincare clean, résultats visibles dès 7 jours — paiement à la livraison.", image: "https://picsum.photos/seed/glow-hero/1600/800", button_text: "Voir les bestsellers", button_link: "/boutique", alignment: "left" }),
        s("products", { title: "Bestsellers", subtitle: "Les produits les plus aimés.", source: "featured", product_count: 4 }),
        s("features", { title: "Bénéfices", subtitle: "Pourquoi vous allez l'adorer.", items: [{ title: "Naturel", text: "Formules clean, sans parabènes." }, { title: "Efficace", text: "Résultats cliniques prouvés." }, { title: "Doux", text: "Convient aux peaux sensibles." }] }),
        s("collections", { title: "Par besoin", subtitle: "Acné, anti-âge, hydratation, éclat.", category_id: null, max_items: 4 }),
        s("banner", { title: "Avant / Après", subtitle: "Résultats réels de nos clientes — photos non retouchées.", desktop_image: "https://picsum.photos/seed/glow-beforeafter/1600/700", mobile_image: null, button_text: "Voir les témoignages", button_link: "/boutique", alignment: "center" }),
        s("how_it_works", { title: "Votre routine", subtitle: "3 étapes simples.", steps: [{ title: "Nettoyez", text: "Matin et soir, base propre." }, { title: "Traitez", text: "Sérum ciblé selon besoin." }, { title: "Hydratez", text: "Crème + protection solaire." }] }),
        s("products", { title: "Nouveautés", subtitle: null, source: "latest", product_count: 4 }),
        s("reviews", { title: "Avis vérifiés", subtitle: "4,8/5 — 1200+ avis." }),
        s("faq", { title: "FAQ beauté", subtitle: null, max_items: 6 }),
        s("cod_form", { title: "Commandez maintenant", subtitle: "Livraison 24-48h · Paiement à la livraison" }),
      ];
    case "tech":
      return [
        s("hero", { title: `${businessName} — Tech de pointe, prix algérien`, subtitle: "Gadgets, accessoires, électronique — garantie, livraison rapide 58 wilayas.", image: "https://picsum.photos/seed/tech-hero/1600/700", button_text: "Voir les nouveautés", button_link: "/boutique", alignment: "left" }),
        s("collections", { title: "Catégories", subtitle: "Téléphonie, audio, gaming, maison connectée.", category_id: null, max_items: 6 }),
        s("products", { title: "Tendances", subtitle: "Les plus demandés cette semaine.", source: "featured", product_count: 4 }),
        s("features", { title: "Caractéristiques", subtitle: "Fiches techniques détaillées, badges specs.", items: [{ title: "Batterie longue durée", text: "Jusqu'à 48h d'autonomie." }, { title: "Garantie 12 mois", text: "SAV local réactif." }, { title: "Livraison express", text: "24h Alger, 48h autres wilayas." }] }),
        s("banner", { title: "Promotion du moment", subtitle: "Jusqu'à -30% sur sélection — stock limité.", desktop_image: "https://picsum.photos/seed/tech-banner/1600/400", mobile_image: null, button_text: "En profiter", button_link: "/boutique", alignment: "left" }),
        s("products", { title: "Comparatif", subtitle: "Choisissez selon vos besoins.", source: "all", product_count: 4 }),
        s("reviews", { title: "Avis tech", subtitle: null }),
        s("features", { title: "Avantages COD", subtitle: null, items: [{ title: "Testez avant de payer", text: "Ouvrez le colis avec le livreur." }, { title: "Paiement sécurisé", text: "Pas de carte, payez cash." }] }),
        s("faq", { title: "FAQ tech", subtitle: null, max_items: 6 }),
      ];
    case "casa":
      return [
        s("hero", { title: `${businessName} — Maison chaleureuse, prix doux`, subtitle: "Cuisine, rangement, déco — astuces pour une maison qui vous ressemble.", image: "https://picsum.photos/seed/casa-hero/1600/700", button_text: "Découvrir", button_link: "/boutique", alignment: "left" }),
        s("collections", { title: "Par pièce", subtitle: "Cuisine, salon, chambre, salle de bain.", category_id: null, max_items: 4 }),
        s("products", { title: "Best sellers maison", subtitle: null, source: "featured", product_count: 4 }),
        s("banner", { title: "Lifestyle — en situation", subtitle: "Voyez nos produits dans de vrais intérieurs algériens.", desktop_image: "https://picsum.photos/seed/casa-lifestyle/1600/700", mobile_image: "https://picsum.photos/seed/casa-lifestyle-m/800/1000", button_text: "Inspiration", button_link: "/boutique", alignment: "center" }),
        s("banner", { title: "Promo du mois", subtitle: "Jusqu'à -25% sur rangement & cuisine.", desktop_image: "https://picsum.photos/seed/casa-promo/1600/400", mobile_image: null, button_text: "Voir offres", button_link: "/boutique", alignment: "left" }),
        s("products", { title: "Nouveautés", subtitle: null, source: "latest", product_count: 4 }),
        s("features", { title: "Nos engagements", subtitle: null, items: [{ title: "Qualité durable", text: "Matériaux solides, finitions soignées." }, { title: "Livraison soignée", text: "Emballage protégé, suivi inclus." }] }),
        s("reviews", { title: "Avis clients", subtitle: null }),
        s("faq", { title: "FAQ", subtitle: null, max_items: 6 }),
      ];
    case "little":
      return [
        s("hero", { title: `${businessName} — Douceur & sécurité pour vos petits`, subtitle: "Vêtements, jouets, soins bébé — qualité, sécurité, livraison rapide.", image: "https://picsum.photos/seed/little-hero/1600/700", button_text: "Voir la collection bébé", button_link: "/boutique", alignment: "center" }),
        s("collections", { title: "Par âge", subtitle: "0-6 mois, 6-12 mois, 1-3 ans, 3-6 ans.", category_id: null, max_items: 4 }),
        s("products", { title: "Nouveautés", subtitle: "Les derniers arrivages.", source: "latest", product_count: 4 }),
        s("products", { title: "Populaires", subtitle: "Les favoris des parents.", source: "featured", product_count: 4 }),
        s("banner", { title: "Qualité & sécurité", subtitle: "Matières certifiées, sans produits nocifs, contrôles rigoureux.", desktop_image: "https://picsum.photos/seed/little-safety/1600/700", mobile_image: null, button_text: "Notre engagement", button_link: "/a-propos", alignment: "left" }),
        s("testimonials", { title: "Avis de parents", items: [{ name: "Amel M.", role: "Maman de 2 enfants", text: "Qualité au top, livraison rapide, je recommande !" }, { name: "Karim B.", role: "Papa", text: "Service client très réactif, produits conformes." }] }),
        s("faq", { title: "FAQ parents", subtitle: null, max_items: 6 }),
      ];
    case "active":
      return [
        s("hero", { title: `${businessName} — Dépassez vos limites`, subtitle: "Équipements sport, fitness, outdoor — performance, confort, style.", image: "https://picsum.photos/seed/active-hero/1600/700", button_text: "Shop maintenant", button_link: "/boutique", alignment: "left" }),
        s("collections", { title: "Par sport", subtitle: "Fitness, running, musculation, outdoor.", category_id: null, max_items: 4 }),
        s("products", { title: "Best sellers sport", subtitle: null, source: "featured", product_count: 4 }),
        s("features", { title: "Objectifs", subtitle: "Perte de poids, prise de masse, endurance, bien-être.", items: [{ title: "Performance", text: "Matériaux techniques respirants." }, { title: "Confort", text: "Coupe ergonomique, maintien optimal." }, { title: "Durabilité", text: "Résiste aux entraînements intensifs." }] }),
        s("products", { title: "Nouveautés", subtitle: null, source: "latest", product_count: 4 }),
        s("stats", { title: "", items: [{ value: "10k+", label: "clients actifs" }, { value: "4,9/5", label: "satisfaction" }, { value: "58", label: "wilayas livrées" }] }),
        s("reviews", { title: "Avis sportifs", subtitle: null }),
        s("banner", { title: "Promo active", subtitle: "Jusqu'à -30% sur packs fitness.", desktop_image: "https://picsum.photos/seed/active-promo/1600/400", mobile_image: null, button_text: "Voir packs", button_link: "/boutique", alignment: "center" }),
        s("faq", { title: "FAQ sport", subtitle: null, max_items: 6 }),
      ];
    case "market":
      return [
        s("banner", { title: "Livraison 24-48h — Paiement à la livraison", subtitle: "Offres flash tous les jours — 58 wilayas", desktop_image: "https://picsum.photos/seed/market-topbar/1600/200", mobile_image: null, button_text: "", button_link: null, alignment: "center" }),
        s("hero", { title: `${businessName} — Tout pour la maison, au meilleur prix`, subtitle: "Produits variés, offres quotidiennes, livraison rapide partout en Algérie.", image: "https://picsum.photos/seed/market-hero/1600/700", button_text: "Voir les offres", button_link: "/boutique", alignment: "left" }),
        s("collections", { title: "Catégories", subtitle: null, category_id: null, max_items: 8 }),
        s("products", { title: "Tendances", subtitle: "Les plus demandés aujourd'hui.", source: "featured", product_count: 8 }),
        s("banner", { title: "Offres flash — -50%", subtitle: "Stock limité, jusqu'à épuisement.", desktop_image: "https://picsum.photos/seed/market-flash/1600/400", mobile_image: "https://picsum.photos/seed/market-flash-m/800/600", button_text: "En profiter", button_link: "/boutique", alignment: "center" }),
        s("products", { title: "Nouveautés", subtitle: null, source: "latest", product_count: 8 }),
        s("products", { title: "Tous nos produits", subtitle: null, source: "all", product_count: 8 }),
        s("reviews", { title: "Avis clients", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
      ];
    case "convert":
      return [
        s("hero", { title: "Résultats visibles dès la première semaine", subtitle: "Le produit qui change votre routine — payez à la livraison.", image: "https://picsum.photos/seed/convert-hero/1200/1200", button_text: "Commander maintenant", button_link: "/commande", alignment: "center" }),
        s("gallery", { title: "Galerie produit / vidéo", subtitle: "Photos HD, démonstration, avant/après.", images: ["https://picsum.photos/seed/convert-1/800/800", "https://picsum.photos/seed/convert-2/800/800", "https://picsum.photos/seed/convert-3/800/800"] }),
        s("features", { title: "Le problème", subtitle: "Vous en avez marre de...", items: [{ title: "Problème 1", text: "Description du problème courant." }, { title: "Problème 2", text: "Autre frustration fréquente." }] }),
        s("features", { title: "La solution", subtitle: `${businessName} est la réponse.`, items: [{ title: "Solution 1", text: "Comment notre produit résout le problème." }, { title: "Solution 2", text: "Bénéfice clé différenciant." }] }),
        s("features", { title: "Bénéfices", subtitle: "Pourquoi vous allez l'adorer.", items: [{ title: "Efficace", text: "Résultats concrets dès premiers jours." }, { title: "Qualité premium", text: "Ingrédients contrôlés." }, { title: "Livraison rapide", text: "24h principales wilayas." }, { title: "Paiement à la livraison", text: "Payez à réception." }] }),
        s("how_it_works", { title: "Comment ça marche", subtitle: null, steps: [{ title: "Commandez", text: "Formulaire 30 sec." }, { title: "On expédie", text: "Colis sous 24h avec suivi." }, { title: "Payez à réception", text: "Inspectez puis payez livreur." }] }),
        s("banner", { title: "Avant / Après", subtitle: "Résultats réels clients.", desktop_image: "https://picsum.photos/seed/convert-beforeafter/1600/700", mobile_image: null, button_text: "", button_link: null, alignment: "center" }),
        s("social_proof", { title: "", items: [{ value: "5000+", label: "commandes livrées" }, { value: "4,8/5", label: "note moyenne" }, { value: "58", label: "wilayas" }] }),
        s("offer", { title: "Offre pack", subtitle: "Économisez en prenant plusieurs unités", text: "1 pièce : prix normal — 2 pièces : prix réduit. Plus vous prenez, plus vous économisez." }),
        s("reviews", { title: "Avis vérifiés", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("cod_form", { title: "Commandez maintenant", subtitle: "Stock limité — livraison dans toute l'Algérie" }),
        s("sticky_cta", { text: "Livraison 24-48h • Paiement à la livraison", button_text: "Commander" }),
      ];
    // Legacy fallbacks
    case "fashion-luxury":
      return [
        s("hero", { title: businessName, subtitle: "Élégance, qualité et livraison dans toute l'Algérie.", image: "https://picsum.photos/seed/fashion-hero/1600/900", button_text: "Découvrir la collection", button_link: "/boutique", alignment: "center" }),
        s("collections", { title: "Nos collections", subtitle: "Des pièces sélectionnées avec soin.", category_id: null, max_items: 4 }),
        s("products", { title: "Nos meilleures ventes", subtitle: null, source: "featured", product_count: 4 }),
        s("banner", { title: "Livraison rapide", subtitle: "Paiement à la livraison — 58 wilayas", desktop_image: "https://picsum.photos/seed/fashion-banner/1600/700", mobile_image: null, button_text: "Voir la boutique", button_link: "/boutique", alignment: "left" }),
        s("reviews", { title: "Elles nous font confiance", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("cta", { title: `Rejoignez ${businessName}`, text: "Suivez-nous sur Instagram.", button_text: "Suivre sur Instagram", button_link: null }),
      ];
    case "single-product":
      return [
        s("hero", { title: "Résultats visibles dès la première semaine", subtitle: "Le produit qui change votre routine — payez à la livraison.", image: "https://picsum.photos/seed/product-hero/1200/1200", button_text: "Commander maintenant", button_link: "/commande", alignment: "center" }),
        s("features", { title: "Pourquoi vous allez l'adorer", subtitle: null, items: [{ title: "Efficace", text: "Résultats concrets." }, { title: "Qualité premium", text: "Ingrédients contrôlés." }, { title: "Livraison rapide", text: "24h principales wilayas." }, { title: "Paiement à la livraison", text: "Payez à réception." }] }),
        s("how_it_works", { title: "Comment ça marche", subtitle: null, steps: [{ title: "Commandez", text: "Formulaire 30 sec." }, { title: "On expédie", text: "Sous 24h avec suivi." }, { title: "Vous payez à la réception", text: "Inspectez puis payez." }] }),
        s("social_proof", { title: "", items: [{ value: "5000+", label: "commandes livrées" }, { value: "4,8/5", label: "note moyenne" }, { value: "58", label: "wilayas" }] }),
        s("offer", { title: "Offre pack", subtitle: "Économisez en prenant plusieurs unités", text: "1 pièce : prix normal — 2 pièces : prix réduit." }),
        s("reviews", { title: "Avis vérifiés", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("cod_form", { title: "Commandez maintenant", subtitle: "Stock limité" }),
        s("sticky_cta", { text: "Livraison 24-48h • Paiement à la livraison", button_text: "Commander" }),
      ];
    case "portfolio":
      return [
        s("hero", { title: businessName, subtitle: "Expertise, écoute et professionnalisme à votre service.", image: null, button_text: "Prendre contact", button_link: "/contact", alignment: "left" }),
        s("stats", { title: "", items: [{ value: "15+", label: "années d'expérience" }, { value: "2000+", label: "clients accompagnés" }, { value: "100%", label: "engagement" }] }),
        s("services", { title: "Nos services", subtitle: "Accompagnement complet.", items: [{ title: "Consultation", text: "Premier rendez-vous d'évaluation.", image: null }, { title: "Suivi personnalisé", text: "Plan adapté avec suivi régulier.", image: null }, { title: "Conseil expert", text: "Recommandations claires.", image: null }] }),
        s("gallery", { title: "Nos réalisations", subtitle: null, images: ["https://picsum.photos/seed/portfolio-1/800/600", "https://picsum.photos/seed/portfolio-2/800/600", "https://picsum.photos/seed/portfolio-3/800/600", "https://picsum.photos/seed/portfolio-4/800/600"] }),
        s("testimonials", { title: "Ils nous font confiance", items: [{ name: "Amine B.", role: "Client depuis 2023", text: "Professionnalisme irréprochable." }, { name: "Sara K.", role: "Cliente", text: "Accueil chaleureux et suivi attentif." }] }),
        s("hours", { title: "Horaires d'ouverture", days: [{ day: "Lundi – Vendredi", value: "08h30 – 17h00" }, { day: "Samedi", value: "09h00 – 13h00" }, { day: "Dimanche", value: "Fermé" }] }),
        s("map", { title: "Où nous trouver", address: null, note: "Accès facile, parking à proximité." }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("contact", { title: "Contactez-nous", text: "Prenez rendez-vous.", show_phone: true, show_whatsapp: true, show_email: true }),
      ];
    case "ecommerce-modern":
    default:
      return [
        s("hero", { title: businessName, subtitle: "Qualité, prix justes et livraison rapide partout en Algérie.", image: "https://picsum.photos/seed/ecom-hero/1600/700", button_text: "Voir la boutique", button_link: "/boutique", alignment: "left" }),
        s("collections", { title: "Nos collections", subtitle: null, category_id: null, max_items: 4 }),
        s("products", { title: "Meilleures ventes", subtitle: null, source: "featured", product_count: 4 }),
        s("banner", { title: "Paiement à la livraison", subtitle: "Commandez sans risque, payez à la réception.", desktop_image: "https://picsum.photos/seed/ecom-banner/1600/700", mobile_image: null, button_text: "Commander", button_link: "/boutique", alignment: "center" }),
        s("features", { title: "Nos engagements", subtitle: null, items: [{ title: "Livraison 24-48h", text: "Dans la plupart des wilayas." }, { title: "Paiement à la livraison", text: "Zéro risque." }, { title: "Support 7j/7", text: "Réponse rapide." }] }),
        s("reviews", { title: "Avis clients", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
      ];
  }
}

export function defaultPages(templateKey: string, websiteType: WebsiteType, businessName: string): Array<{ key: string; title: string; content: { sections: Section[] } }> {
  if (isLamsaTemplate(templateKey)) {
    const pages: Array<{ key: string; title: string; content: { sections: Section[] } }> = [
      { key: "home", title: "الرئيسية", content: { sections: defaultHomeSections(templateKey, websiteType, businessName) } },
      ...lamsaContentPages(businessName),
      { key: "legal-terms", title: "الشروط العامة", content: { sections: [] } },
      { key: "legal-privacy", title: "سياسة الخصوصية", content: { sections: [] } },
    ];
    if (websiteType === "ecommerce") pages.push({ key: "shop", title: "المتجر", content: { sections: [] } });
    return pages;
  }
  if (isSouqTemplate(templateKey)) {
    // Arabic-first pages (titles + content), same structure as every template.
    const pages: Array<{ key: string; title: string; content: { sections: Section[] } }> = [
      { key: "home", title: "الرئيسية", content: { sections: defaultHomeSections(templateKey, websiteType, businessName) } },
      ...souqContentPages(businessName),
      { key: "legal-terms", title: "الشروط العامة", content: { sections: [] } },
      { key: "legal-privacy", title: "سياسة الخصوصية", content: { sections: [] } },
    ];
    if (websiteType === "ecommerce") {
      pages.push({ key: "shop", title: "المتجر", content: { sections: [] } });
    }
    return pages;
  }
  const pages: Array<{ key: string; title: string; content: { sections: Section[] } }> = [
    { key: "home", title: "Accueil", content: { sections: defaultHomeSections(templateKey, websiteType, businessName) } },
    { key: "about", title: "À propos", content: { sections: [s("hero", { title: `À propos de ${businessName}`, subtitle: "Notre histoire, nos valeurs, notre engagement.", image: null, alignment: "center" }), s("contact", { title: "Parlons de votre projet", text: null, show_phone: true, show_whatsapp: true, show_email: true })] } },
    { key: "faq", title: "FAQ", content: { sections: [s("hero", { title: "Questions fréquentes", subtitle: null, image: null, alignment: "center" }), s("faq", { title: "FAQ", subtitle: null, max_items: 12 })] } },
    { key: "contact", title: "Contact", content: { sections: [s("hero", { title: "Contactez-nous", subtitle: "Réponse rapide garantie.", image: null, alignment: "center" }), s("contact", { title: "Coordonnées", text: null, show_phone: true, show_whatsapp: true, show_email: true }), s("map", { title: "Adresse", address: null, note: null })] } },
    { key: "legal-terms", title: "Conditions générales", content: { sections: [] } },
    { key: "legal-privacy", title: "Confidentialité", content: { sections: [] } },
  ];
  if (websiteType === "ecommerce") {
    pages.push({ key: "shop", title: "Boutique", content: { sections: [] } });
  }
  return pages;
}

export function defaultSettings(
  contact: Record<string, string | null>,
  business: {
    cod_enabled?: boolean;
    reviews_enabled?: boolean;
    faq_enabled?: boolean;
    allow_negative_stock?: boolean;
    max_items_per_order?: number;
    office_delivery_enabled?: boolean;
    accent_color?: string | null;
  },
): StoreSettings {
  return {
    contact: {
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      whatsapp: contact.whatsapp ?? null,
      instagram: contact.instagram ?? null,
      facebook: contact.facebook ?? null,
      tiktok: contact.tiktok ?? null,
      address: contact.address ?? null,
    },
    business: {
      cod_enabled: business.cod_enabled ?? true,
      reviews_enabled: business.reviews_enabled ?? true,
      faq_enabled: business.faq_enabled ?? true,
      allow_negative_stock: false,
      max_items_per_order: business.max_items_per_order ?? 10,
      office_delivery_enabled: business.office_delivery_enabled ?? true,
    },
    appearance: {
      accent_color: business.accent_color ?? null,
    },
  };
}

export function defaultShippingZones(homeFeeDA: number, officeFeeDA: number): Array<{ wilaya_code: number; home_fee_cents: number; office_fee_cents: number }> {
  return [{ wilaya_code: 0, home_fee_cents: Math.round(homeFeeDA * 100), office_fee_cents: Math.round(officeFeeDA * 100) }];
}
