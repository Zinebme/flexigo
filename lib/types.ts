/**
 * Core domain types shared across the platform.
 * These mirror the PostgreSQL schema defined in supabase/migrations.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** Merchant (tenant) roles — scoped to a single store via store_members. */
export const MERCHANT_ROLES = [
  "OWNER",
  "MANAGER",
  "ORDER_MANAGER",
  "CONTENT_EDITOR",
  "VIEWER",
] as const;
export type MerchantRole = (typeof MERCHANT_ROLES)[number];

/** Platform roles — completely separate from merchant roles. */
export const PLATFORM_ROLES = ["SUPER_ADMIN", "STAFF"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

// ---------------------------------------------------------------------------
// Store / tenant
// ---------------------------------------------------------------------------

export const WEBSITE_TYPES = ["ecommerce", "single_product", "portfolio"] as const;
export type WebsiteType = (typeof WEBSITE_TYPES)[number];

export const STORE_STATUSES = ["draft", "active", "suspended", "archived"] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export const STORE_LANGUAGES = ["fr", "ar", "en"] as const;
export type StoreLanguage = (typeof STORE_LANGUAGES)[number];

export const DELIVERY_TYPES = ["home", "office"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const DOMAIN_STATUSES = ["pending", "verified", "failed"] as const;
export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

/**
 * Fine-grained capabilities used to authorize merchant dashboard actions.
 * RLS provides the database-level guarantee; capabilities drive the app layer.
 */
export const CAPABILITIES = [
  "orders.view",
  "orders.manage",
  "orders.ship",
  "products.manage",
  "categories.manage",
  "customers.view",
  "customers.manage",
  "content.manage",
  "appearance.manage",
  "reviews.manage",
  "faq.manage",
  "shipping.manage",
  "marketing.manage",
  "team.manage",
  "settings.manage",
  "stats.view",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/**
 * Role → capability matrix (French UI explanations in components/admin-role-info).
 * SUPER_ADMIN can never be granted from the merchant side — it only exists in
 * the platform_admins table and is managed by the platform owner.
 */
const ROLE_CAPABILITIES: Record<MerchantRole, readonly Capability[] | "*"> = {
  OWNER: "*",
  MANAGER: [
    "orders.view",
    "orders.manage",
    "orders.ship",
    "products.manage",
    "categories.manage",
    "customers.view",
    "customers.manage",
    "content.manage",
    "appearance.manage",
    "reviews.manage",
    "faq.manage",
    "shipping.manage",
    "marketing.manage",
    "stats.view",
  ],
  ORDER_MANAGER: ["orders.view", "orders.manage", "orders.ship", "customers.view", "customers.manage", "stats.view"],
  CONTENT_EDITOR: [
    "products.manage",
    "categories.manage",
    "content.manage",
    "appearance.manage",
    "reviews.manage",
    "faq.manage",
  ],
  VIEWER: ["orders.view", "customers.view", "stats.view"],
};

export function can(role: MerchantRole, capability: Capability): boolean {
  const caps = ROLE_CAPABILITIES[role];
  return caps === "*" || caps.includes(capability);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  "new",
  "to_confirm",
  "confirmed",
  "postponed",
  "no_answer",
  "cancelled_customer",
  "preparation",
  "shipped",
  "in_transit",
  "at_office",
  "out_for_delivery",
  "delivered",
  "returned",
  "delivery_failed",
  "cancelled_store",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nouveau",
  to_confirm: "À confirmer",
  confirmed: "Confirmé",
  postponed: "Reporté",
  no_answer: "Client ne répond pas",
  cancelled_customer: "Annulé client",
  preparation: "Préparation",
  shipped: "Expédié",
  in_transit: "En transit",
  at_office: "Au bureau",
  out_for_delivery: "En livraison",
  delivered: "Livré",
  returned: "Retour",
  delivery_failed: "Échec livraison",
  cancelled_store: "Annulé boutique",
};

/** Statuses that terminate an order (no further transitions except reopen by admin). */
export const ORDER_TERMINAL_STATUSES: OrderStatus[] = [
  "delivered",
  "cancelled_customer",
  "cancelled_store",
  "delivery_failed",
];

/** Statuses for which stock has been committed (already decremented at checkout). */
export const ORDER_ACTIVE_STATUSES: OrderStatus[] = [
  "new",
  "to_confirm",
  "confirmed",
  "postponed",
  "preparation",
  "shipped",
  "in_transit",
  "at_office",
  "out_for_delivery",
];

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const SHIPPING_PROVIDER_KEYS = ["manual", "navex", "yalidine", "ecotrack", "zr", "generic", "mock"] as const;
export type ShippingProviderKey = (typeof SHIPPING_PROVIDER_KEYS)[number];

export const MARKETING_PROVIDER_KEYS = [
  "meta_pixel",
  "tiktok_pixel",
  "snapchat_pixel",
  "pinterest_tag",
  "ga4",
  "gtm",
  "google_ads",
] as const;
export type MarketingProviderKey = (typeof MARKETING_PROVIDER_KEYS)[number];

export const MARKETING_PROVIDER_LABELS: Record<MarketingProviderKey, string> = {
  meta_pixel: "Meta Pixel",
  tiktok_pixel: "TikTok Pixel",
  snapchat_pixel: "Snapchat Pixel",
  pinterest_tag: "Pinterest Tag",
  ga4: "Google Analytics 4",
  gtm: "Google Tag Manager",
  google_ads: "Google Ads",
};

export const MARKETING_EVENTS = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
] as const;
export type MarketingEvent = (typeof MARKETING_EVENTS)[number];

// ---------------------------------------------------------------------------
// Page / content system
// ---------------------------------------------------------------------------

export const PAGE_KEYS = [
  "home",
  "shop",
  "about",
  "faq",
  "contact",
  "legal-terms",
  "legal-privacy",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const PAGE_LABELS: Record<PageKey, string> = {
  home: "Page d'accueil",
  shop: "Boutique",
  about: "À propos",
  faq: "FAQ",
  contact: "Contact",
  "legal-terms": "Conditions générales",
  "legal-privacy": "Confidentialité",
};

/** Typography presets offered to merchants (no free CSS). */
export const TYPOGRAPHY_PRESETS = ["modern", "elegant", "bold", "minimal"] as const;
export type TypographyPreset = (typeof TYPOGRAPHY_PRESETS)[number];

export const BUTTON_SHAPES = ["rounded", "sharp", "pill"] as const;
export type ButtonShape = (typeof BUTTON_SHAPES)[number];
