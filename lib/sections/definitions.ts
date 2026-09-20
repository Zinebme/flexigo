/**
 * Structured content system (deliberately NOT a Wix-like builder).
 *
 * Templates control the design. Merchants control content only, through a
 * fixed catalog of predefined section types with strictly validated fields.
 * There is no raw HTML, no JavaScript, no CSS. Button links and images are
 * validated against allow-lists. Everything is stored as validated JSON.
 */
import { z } from "zod";
import type { WebsiteType } from "../types";

// ---------------------------------------------------------------------------
// Field validators (shared)
// ---------------------------------------------------------------------------

/** HTTPS/HTTP image, safe bundled `/images/` asset, or small data URI. */
export const imageUrl = z
  .string()
  .max(2000)
  .regex(
    /^(https?:\/\/[^\s"'<>\\`]+|\/images\/[A-Za-z0-9_./-]+\.(?:svg|png|jpe?g|webp|gif)|data:image\/(?:svg\+xml|png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+)$/,
    "Image invalide",
  )
  .refine((value) => !value.startsWith("/images/") || !value.includes(".."), "Image invalide")
  .optional()
  .nullable();

/**
 * Button/CTA links: strict allow-list.
 * - internal storefront routes
 * - tel: / mailto:
 * - WhatsApp wa.me with a number
 * - social profile URLs (instagram/facebook/tiktok)
 */
export const safeLink = z
  .string()
  .max(300)
  .regex(
    /^(\/(?:boutique|produit\/[a-z0-9-]+|categorie\/[a-z0-9-]+|contact|faq|a-propos|commande|recherche|mentions-legales|confidentialite)?)$|^tel:\+?\d{8,15}$|^mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$|^https:\/\/wa\.me\/\d{9,15}$|^https:\/\/(?:www\.)?(?:instagram\.com|facebook\.com|tiktok\.com)\/[A-Za-z0-9._-]+\/?$/,
    "Lien non autorisé",
  )
  .optional()
  .nullable();

export const textField = (max = 120) => z.string().trim().max(max, `Maximum ${max} caractères`).optional().nullable();
export const richTextField = (max = 2000) => z.string().trim().max(max, `Maximum ${max} caractères`).optional().nullable();

const alignment = z.enum(["left", "center", "right"]);

// ---------------------------------------------------------------------------
// Section data schemas (one per allowed type)
// ---------------------------------------------------------------------------

const hero = z.object({
  title: textField(120),
  subtitle: textField(240),
  image: imageUrl,
  // Optional, additive (SOUQ uses them): the historical single `image` stays
  // the desktop/default image, so every existing store keeps rendering.
  desktop_image: imageUrl,
  mobile_image: imageUrl,
  badge: textField(60),
  promo_text: textField(160),
  button_text: textField(40),
  button_link: safeLink,
  alignment: alignment.optional(),
});

const banner = z.object({
  title: textField(120),
  subtitle: textField(240),
  desktop_image: imageUrl,
  mobile_image: imageUrl,
  button_text: textField(40),
  button_link: safeLink,
  alignment: alignment.optional(),
  show_desktop: z.boolean().optional(),
  show_mobile: z.boolean().optional(),
});

const collections = z.object({
  title: textField(120),
  subtitle: textField(200),
  category_id: z.string().uuid().optional().nullable(),
  max_items: z.number().int().min(1).max(12).optional(),
});

const products = z.object({
  title: textField(120),
  subtitle: textField(200),
  source: z.enum(["featured", "latest", "all"]).optional(),
  product_count: z.number().int().min(1).max(12).optional(),
});

const features = z.object({
  title: textField(120),
  subtitle: textField(200),
  items: z
    .array(z.object({ title: textField(80), text: richTextField(300) }))
    .max(6),
});

const howItWorks = z.object({
  title: textField(120),
  subtitle: textField(200),
  steps: z
    .array(z.object({ title: textField(80), text: richTextField(300) }))
    .max(6),
});

const socialProof = z.object({
  title: textField(120),
  items: z
    .array(z.object({ value: textField(20), label: textField(60) }))
    .max(4),
});

const reviewsSection = z.object({
  title: textField(120),
  subtitle: textField(200),
});

const faqSection = z.object({
  title: textField(120),
  subtitle: textField(200),
  max_items: z.number().int().min(1).max(20).optional(),
});

const offer = z.object({
  title: textField(120),
  subtitle: textField(240),
  text: richTextField(500),
});

const gallery = z.object({
  title: textField(120),
  subtitle: textField(200),
  images: z.array(imageUrl).max(12).optional(),
});

// NOOR — optional, strictly data-driven before/after block. It only renders
// when the merchant supplies BOTH valid images; the storefront never invents
// results or implies guaranteed outcomes (see noor-before-after component).
const beforeAfter = z.object({
  title: textField(120),
  subtitle: textField(200),
  before_image: imageUrl,
  after_image: imageUrl,
  before_label: textField(40),
  after_label: textField(40),
  /** Honest merchant note (e.g. usage period) — informational only. */
  note: richTextField(300),
  layout: z.enum(["split", "slider", "side"]).optional(),
});

const services = z.object({
  title: textField(120),
  subtitle: textField(240),
  items: z
    .array(z.object({ title: textField(80), text: richTextField(300), image: imageUrl }))
    .max(9),
});

const testimonials = z.object({
  title: textField(120),
  items: z
    .array(z.object({ name: textField(60), role: textField(60), text: richTextField(400) }))
    .max(6),
});

const stats = z.object({
  title: textField(120),
  items: z
    .array(z.object({ value: textField(20), label: textField(60) }))
    .max(4),
});

const hours = z.object({
  title: textField(120),
  days: z
    .array(z.object({ day: textField(20), value: textField(40) }))
    .max(8),
});

const map = z.object({
  title: textField(120),
  address: textField(200),
  note: textField(200),
});

const contactSection = z.object({
  title: textField(120),
  text: richTextField(400),
  show_phone: z.boolean().optional(),
  show_whatsapp: z.boolean().optional(),
  show_email: z.boolean().optional(),
});

const cta = z.object({
  title: textField(120),
  text: richTextField(300),
  button_text: textField(40),
  button_link: safeLink,
});

const codForm = z.object({
  title: textField(120),
  subtitle: textField(240),
});

const stickyCta = z.object({
  text: textField(120),
  button_text: textField(40),
});

// ---------------------------------------------------------------------------
// Discriminated union — the single source of truth for validation
// ---------------------------------------------------------------------------

export const sectionSchemas = {
  hero,
  banner,
  collections,
  products,
  features,
  how_it_works: howItWorks,
  social_proof: socialProof,
  reviews: reviewsSection,
  faq: faqSection,
  offer,
  gallery,
  before_after: beforeAfter,
  services,
  testimonials,
  stats,
  hours,
  map,
  contact: contactSection,
  cta,
  cod_form: codForm,
  sticky_cta: stickyCta,
} as const;

export type SectionType = keyof typeof sectionSchemas;

export const sectionSchema = z.discriminatedUnion("type", [
  hero.extend({ type: z.literal("hero"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  banner.extend({ type: z.literal("banner"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  collections.extend({ type: z.literal("collections"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  products.extend({ type: z.literal("products"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  features.extend({ type: z.literal("features"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  howItWorks.extend({ type: z.literal("how_it_works"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  socialProof.extend({ type: z.literal("social_proof"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  reviewsSection.extend({ type: z.literal("reviews"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  faqSection.extend({ type: z.literal("faq"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  offer.extend({ type: z.literal("offer"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  gallery.extend({ type: z.literal("gallery"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  beforeAfter.extend({ type: z.literal("before_after"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  services.extend({ type: z.literal("services"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  testimonials.extend({ type: z.literal("testimonials"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  stats.extend({ type: z.literal("stats"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  hours.extend({ type: z.literal("hours"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  map.extend({ type: z.literal("map"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  contactSection.extend({ type: z.literal("contact"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  cta.extend({ type: z.literal("cta"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  codForm.extend({ type: z.literal("cod_form"), id: z.string().min(1).max(32), enabled: z.boolean() }),
  stickyCta.extend({ type: z.literal("sticky_cta"), id: z.string().min(1).max(32), enabled: z.boolean() }),
]);

export type Section = z.infer<typeof sectionSchema>;

/** Page content = ordered list of sections (homepage editor). */
export const pageContentSchema = z.object({
  sections: z.array(sectionSchema).max(24),
});
export type PageContent = z.infer<typeof pageContentSchema>;

// ---------------------------------------------------------------------------
// Editor metadata (labels + which website types may use which sections)
// ---------------------------------------------------------------------------

export interface SectionDef {
  label: string;
  description: string;
  allowedFor: WebsiteType[];
  defaultData: Record<string, unknown>;
}

export const SECTION_DEFS: Record<SectionType, SectionDef> = {
  hero: {
    label: "Bannière principale",
    description: "Grande section d'accroche avec image et bouton.",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: {
      title: "",
      subtitle: "",
      image: null,
      desktop_image: null,
      mobile_image: null,
      badge: null,
      promo_text: null,
      button_text: "",
      button_link: null,
      alignment: "center",
    },
  },
  banner: {
    label: "Bannière",
    description: "Bannière publicitaire (images desktop + mobile).",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: { title: "", subtitle: "", desktop_image: null, mobile_image: null, button_text: "", button_link: null, alignment: "left", show_desktop: true, show_mobile: true },
  },
  collections: {
    label: "Collections",
    description: "Grille de catégories du site.",
    allowedFor: ["ecommerce"],
    defaultData: { title: "Nos collections", subtitle: null, category_id: null, max_items: 4 },
  },
  products: {
    label: "Produits populaires",
    description: "Sélection de produits mis en avant.",
    allowedFor: ["ecommerce", "single_product"],
    defaultData: { title: "Nos meilleures ventes", subtitle: null, source: "featured", product_count: 4 },
  },
  features: {
    label: "Avantages",
    description: "Liste d'avantages (livraison, paiement à la livraison…).",
    allowedFor: ["ecommerce", "single_product"],
    defaultData: { title: "Pourquoi nous choisir", subtitle: null, items: [] },
  },
  how_it_works: {
    label: "Comment ça marche",
    description: "Étapes du processus (commande, livraison, paiement).",
    allowedFor: ["single_product", "portfolio", "ecommerce"],
    defaultData: { title: "Comment ça marche", subtitle: null, steps: [] },
  },
  social_proof: {
    label: "Preuve sociale",
    description: "Chiffres clés (clients livrés, note moyenne…).",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: { title: "", items: [] },
  },
  reviews: {
    label: "Avis clients",
    description: "Avis approuvés du site.",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: { title: "Ils nous font confiance", subtitle: null },
  },
  faq: {
    label: "FAQ",
    description: "Questions fréquentes du site.",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: { title: "Questions fréquentes", subtitle: null, max_items: 6 },
  },
  offer: {
    label: "Offre",
    description: "Section offre / pack (ex. « 2 pour 3 900 DA »).",
    allowedFor: ["single_product", "ecommerce"],
    defaultData: { title: "", subtitle: null, text: null },
  },
  gallery: {
    label: "Galerie",
    description: "Galerie d'images (projets, réalisations, réseaux sociaux).",
    allowedFor: ["portfolio", "ecommerce"],
    defaultData: { title: "Nos réalisations", subtitle: null, images: [] },
  },
  before_after: {
    label: "Avant / après",
    description: "Bloc avant/après affiché uniquement si le marchand fournit les deux images (jamais inventé).",
    allowedFor: ["ecommerce", "single_product"],
    defaultData: { title: "", subtitle: null, before_image: null, after_image: null, before_label: "Avant", after_label: "Après", note: null, layout: "split" },
  },
  services: {
    label: "Services",
    description: "Liste de services avec descriptions.",
    allowedFor: ["portfolio", "ecommerce"],
    defaultData: { title: "Nos services", subtitle: null, items: [] },
  },
  testimonials: {
    label: "Témoignages",
    description: "Témoignages de patients / clients / partenaires.",
    allowedFor: ["portfolio"],
    defaultData: { title: "Témoignages", items: [] },
  },
  stats: {
    label: "Statistiques",
    description: "Chiffres clés (années d'expérience, patients…).",
    allowedFor: ["portfolio"],
    defaultData: { title: "", items: [] },
  },
  hours: {
    label: "Horaires d'ouverture",
    description: "Planning hebdomadaire.",
    allowedFor: ["portfolio"],
    defaultData: { title: "Horaires d'ouverture", days: [] },
  },
  map: {
    label: "Adresse & plan",
    description: "Adresse du cabinet avec emplacement.",
    allowedFor: ["portfolio"],
    defaultData: { title: "Où nous trouver", address: null, note: null },
  },
  contact: {
    label: "Contact",
    description: "Coordonnées et boutons de contact.",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: { title: "Contactez-nous", text: null, show_phone: true, show_whatsapp: true, show_email: true },
  },
  cta: {
    label: "Appel à l'action",
    description: "Bloc d'incitation avec bouton.",
    allowedFor: ["ecommerce", "single_product", "portfolio"],
    defaultData: { title: "", text: null, button_text: "", button_link: null },
  },
  cod_form: {
    label: "Formulaire de commande",
    description: "Commande avec paiement à la livraison.",
    allowedFor: ["single_product", "ecommerce"],
    defaultData: { title: "Commandez maintenant", subtitle: "Paiement à la livraison — livraison dans toute l'Algérie" },
  },
  sticky_cta: {
    label: "Bouton fixe",
    description: "Bouton d'achat toujours visible en bas d'écran.",
    allowedFor: ["single_product", "ecommerce"],
    defaultData: { text: "", button_text: "Commander" },
  },
};

export const SECTION_ORDER: SectionType[] = [
  "hero",
  "banner",
  "collections",
  "products",
  "features",
  "offer",
  "how_it_works",
  "social_proof",
  "stats",
  "services",
  "gallery",
  "before_after",
  "testimonials",
  "reviews",
  "hours",
  "map",
  "faq",
  "contact",
  "cta",
  "cod_form",
  "sticky_cta",
];

export function createSection(type: SectionType, id: string): Section {
  return {
    id,
    type,
    enabled: true,
    ...(SECTION_DEFS[type].defaultData as Record<string, unknown>),
  } as Section;
}
