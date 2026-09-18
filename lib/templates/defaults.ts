/**
 * Template registry + default content generated at store creation.
 * The wizard (and the "regenerate default sections" repair tool) use these
 * to build the initial pages. Content is structured JSON only.
 */
import type { WebsiteType } from "../types";
import type { Section } from "../sections/definitions";
import { shortId } from "../utils";
import type { StoreSettings } from "../supabase/database.types";

export interface TemplateMeta {
  key: string;
  name: string;
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
}

export const TEMPLATES: TemplateMeta[] = [
  {
    key: "ecommerce-modern",
    name: "Ecommerce Modern",
    description: "Boutique COD moderne et polyvalente : hero, collections, meilleures ventes, avis et FAQ.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/ecommerce-modern.png",
    theme: { primaryColor: "#1d4ed8", secondaryColor: "#f59e0b", backgroundColor: "#ffffff", typography: "modern", buttonShape: "rounded" },
  },
  {
    key: "fashion-luxury",
    name: "Fashion Luxury",
    description: "Style élégant pour mode, hijab et vêtements premium. Typographie fine, tons sobres.",
    websiteTypes: ["ecommerce"],
    screenshotUrl: "/images/templates/fashion-luxury.png",
    theme: { primaryColor: "#292524", secondaryColor: "#a16207", backgroundColor: "#faf9f7", typography: "elegant", buttonShape: "sharp" },
  },
  {
    key: "single-product",
    name: "Single Product COD",
    description: "Landing page de conversion pour un produit, optimisée Meta/TikTok Ads avec commande à la livraison.",
    websiteTypes: ["single_product"],
    screenshotUrl: "/images/templates/single-product.png",
    theme: { primaryColor: "#dc2626", secondaryColor: "#111827", backgroundColor: "#ffffff", typography: "bold", buttonShape: "pill" },
  },
  {
    key: "portfolio",
    name: "Portfolio Professional",
    description: "Vitrine professionnelle : médecins, architectes, consultants, agences, photographes…",
    websiteTypes: ["portfolio"],
    screenshotUrl: "/images/templates/portfolio.png",
    theme: { primaryColor: "#0f766e", secondaryColor: "#1e293b", backgroundColor: "#ffffff", typography: "minimal", buttonShape: "rounded" },
  },
];

export function getTemplate(key: string): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

// ---------------------------------------------------------------------------
// Default homepage sections per template
// ---------------------------------------------------------------------------

function s(type: Section["type"], data: Record<string, unknown>): Section {
  return { id: shortId(), type, enabled: true, ...data } as Section;
}

export function defaultHomeSections(templateKey: string, websiteType: WebsiteType, businessName: string): Section[] {
  switch (templateKey) {
    case "fashion-luxury":
      return [
        s("hero", { title: businessName, subtitle: "Élégance, qualité et livraison dans toute l'Algérie.", image: "https://picsum.photos/seed/fashion-hero/1600/900", button_text: "Découvrir la collection", button_link: "/boutique", alignment: "center" }),
        s("collections", { title: "Nos collections", subtitle: "Des pièces sélectionnées avec soin.", category_id: null, max_items: 4 }),
        s("products", { title: "Nos meilleures ventes", subtitle: null, source: "featured", product_count: 4 }),
        s("banner", { title: "Livraison rapide", subtitle: "Paiement à la livraison — 58 wilayas", desktop_image: "https://picsum.photos/seed/fashion-banner/1600/700", mobile_image: null, button_text: "Voir la boutique", button_link: "/boutique", alignment: "left" }),
        s("reviews", { title: "Elles nous font confiance", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("cta", { title: `Rejoignez ${businessName}`, text: "Suivez-nous sur Instagram pour ne rien manquer des nouvelles collections.", button_text: "Suivre sur Instagram", button_link: null }),
      ];
    case "single-product":
      return [
        s("hero", { title: "Résultats visibles dès la première semaine", subtitle: "Le produit qui change votre routine — payez à la livraison.", image: "https://picsum.photos/seed/product-hero/1200/1200", button_text: "Commander maintenant", button_link: "/commande", alignment: "center" }),
        s("features", { title: "Pourquoi vous allez l'adorer", subtitle: null, items: [
          { title: "Efficace", text: "Résultats concrets dès les premiers jours d'utilisation." },
          { title: "Qualité premium", text: "Ingrédients soigneusement sélectionnés et contrôlés." },
          { title: "Livraison rapide", text: "Expédition sous 24h dans les principales wilayas." },
          { title: "Paiement à la livraison", text: "Payez uniquement à la réception de votre colis." },
        ] }),
        s("how_it_works", { title: "Comment ça marche", subtitle: null, steps: [
          { title: "Commandez", text: "Remplissez le formulaire en 30 secondes." },
          { title: "On expédie", text: "Votre colis part sous 24h avec suivi." },
          { title: "Vous payez à la réception", text: "Inspectez le colis, puis payez le livreur." },
        ] }),
        s("social_proof", { title: "", items: [
          { value: "5000+", label: "commandes livrées" },
          { value: "4,8/5", label: "note moyenne" },
          { value: "58", label: "wilayas desservies" },
        ] }),
        s("offer", { title: "Offre pack", subtitle: "Économisez en prenant plusieurs unités", text: "1 pièce : prix normal — 2 pièces : prix réduit. Plus vous prenez, plus vous économisez." }),
        s("reviews", { title: "Avis vérifiés", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("cod_form", { title: "Commandez maintenant", subtitle: "Stock limité — livraison dans toute l'Algérie" }),
        s("sticky_cta", { text: "Livraison 24-48h • Paiement à la livraison", button_text: "Commander" }),
      ];
    case "portfolio":
      return [
        s("hero", { title: businessName, subtitle: "Expertise, écoute et professionnalisme à votre service.", image: null, button_text: "Prendre contact", button_link: "/contact", alignment: "left" }),
        s("stats", { title: "", items: [
          { value: "15+", label: "années d'expérience" },
          { value: "2000+", label: "clients accompagnés" },
          { value: "100%", label: "engagement" },
        ] }),
        s("services", { title: "Nos services", subtitle: "Un accompagnement complet, du premier rendez-vous au suivi.", items: [
          { title: "Consultation", text: "Premier rendez-vous d'évaluation et de conseils personnalisés.", image: null },
          { title: "Suivi personnalisé", text: "Un plan adapté à votre situation, avec un suivi régulier.", image: null },
          { title: "Conseil expert", text: "Des recommandations claires, fondées sur votre cas.", image: null },
        ] }),
        s("gallery", { title: "Nos réalisations", subtitle: null, images: [
          "https://picsum.photos/seed/portfolio-1/800/600",
          "https://picsum.photos/seed/portfolio-2/800/600",
          "https://picsum.photos/seed/portfolio-3/800/600",
          "https://picsum.photos/seed/portfolio-4/800/600",
        ] }),
        s("testimonials", { title: "Ils nous font confiance", items: [
          { name: "Amine B.", role: "Client depuis 2023", text: "Un professionnalisme irréprochable, je recommande vivement." },
          { name: "Sara K.", role: "Cliente", text: "Accueil chaleureux et suivi attentif. Merci !" },
        ] }),
        s("hours", { title: "Horaires d'ouverture", days: [
          { day: "Lundi – Vendredi", value: "08h30 – 17h00" },
          { day: "Samedi", value: "09h00 – 13h00" },
          { day: "Dimanche", value: "Fermé" },
        ] }),
        s("map", { title: "Où nous trouver", address: null, note: "Accès facile, parking à proximité." }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
        s("contact", { title: "Contactez-nous", text: "Prenez rendez-vous ou posez-nous votre question.", show_phone: true, show_whatsapp: true, show_email: true }),
      ];
    case "ecommerce-modern":
    default:
      return [
        s("hero", { title: businessName, subtitle: "Qualité, prix justes et livraison rapide partout en Algérie.", image: "https://picsum.photos/seed/ecom-hero/1600/700", button_text: "Voir la boutique", button_link: "/boutique", alignment: "left" }),
        s("collections", { title: "Nos collections", subtitle: null, category_id: null, max_items: 4 }),
        s("products", { title: "Meilleures ventes", subtitle: null, source: "featured", product_count: 4 }),
        s("banner", { title: "Paiement à la livraison", subtitle: "Commandez sans risque, payez à la réception.", desktop_image: "https://picsum.photos/seed/ecom-banner/1600/700", mobile_image: null, button_text: "Commander", button_link: "/boutique", alignment: "center" }),
        s("features", { title: "Nos engagements", subtitle: null, items: [
          { title: "Livraison 24-48h", text: "Dans la plupart des wilayas." },
          { title: "Paiement à la livraison", text: "Zéro risque, payez à la réception." },
          { title: "Support 7j/7", text: "Une question ? Nous répondons vite." },
        ] }),
        s("reviews", { title: "Avis clients", subtitle: null }),
        s("faq", { title: "Questions fréquentes", subtitle: null, max_items: 6 }),
      ];
  }
}

/** Other pages (structured, minimal — mostly template-driven). */
export function defaultPages(templateKey: string, websiteType: WebsiteType, businessName: string): Array<{ key: string; title: string; content: { sections: Section[] } }> {
  const pages: Array<{ key: string; title: string; content: { sections: Section[] } }> = [
    { key: "home", title: "Accueil", content: { sections: defaultHomeSections(templateKey, websiteType, businessName) } },
    { key: "about", title: "À propos", content: { sections: [
      s("hero", { title: `À propos de ${businessName}`, subtitle: "Notre histoire, nos valeurs, notre engagement.", image: null, alignment: "center" }),
      s("contact", { title: "Parlons de votre projet", text: null, show_phone: true, show_whatsapp: true, show_email: true }),
    ] } },
    { key: "faq", title: "FAQ", content: { sections: [
      s("hero", { title: "Questions fréquentes", subtitle: null, image: null, alignment: "center" }),
      s("faq", { title: "FAQ", subtitle: null, max_items: 12 }),
    ] } },
    { key: "contact", title: "Contact", content: { sections: [
      s("hero", { title: "Contactez-nous", subtitle: "Réponse rapide garantie.", image: null, alignment: "center" }),
      s("contact", { title: "Coordonnées", text: null, show_phone: true, show_whatsapp: true, show_email: true }),
      s("map", { title: "Adresse", address: null, note: null }),
    ] } },
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
  business: { cod_enabled?: boolean; reviews_enabled?: boolean; faq_enabled?: boolean; allow_negative_stock?: boolean; max_items_per_order?: number },
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
      max_items_per_order: 10,
    },
  };
}

/** One default zone (wilaya_code = 0) that applies to every wilaya. */
export function defaultShippingZones(homeFeeDA: number, officeFeeDA: number): Array<{ wilaya_code: number; home_fee_cents: number; office_fee_cents: number }> {
  return [{ wilaya_code: 0, home_fee_cents: Math.round(homeFeeDA * 100), office_fee_cents: Math.round(officeFeeDA * 100) }];
}
