/**
 * Zod schemas for all API inputs (public checkout, merchant, admin).
 * Every server input is validated here before touching the database.
 * French error messages are shown directly to users.
 */
import { z } from "zod";
import { err } from "./errors";
import { MERCHANT_ROLES, ORDER_STATUSES, WEBSITE_TYPES, STORE_LANGUAGES, TYPOGRAPHY_PRESETS, BUTTON_SHAPES, MARKETING_PROVIDER_KEYS, SHIPPING_PROVIDER_KEYS, MARKETING_EVENTS } from "./types";
import { pageContentSchema, imageUrl, safeLink } from "./sections/definitions";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const uuid = z.string().uuid("Identifiant invalide");
export const priceDA = z.coerce.number("Prix invalide").positive("Le prix doit être positif").max(10_000_000, "Prix trop élevé");
export const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (ex: #1e293b)");

const socialUrl = z
  .string()
  .max(200)
  .regex(/^(https?:\/\/)?(www\.)?(instagram\.com|facebook\.com|tiktok\.com|wa\.me)\/[^\s"'<>]+$/, "Lien social invalide")
  .optional()
  .or(z.literal(""))
  .nullable();

// ---------------------------------------------------------------------------
// Public checkout (COD)
// ---------------------------------------------------------------------------

export const checkoutLineSchema = z.object({
  product_id: uuid,
  variant_id: uuid.nullable().optional(),
  quantity: z.number().int("Quantité invalide").min(1).max(50, "Quantité maximum : 50"),
});

export const checkoutSchema = z.object({
  lines: z.array(checkoutLineSchema).min(1, "Ajoutez un article à votre commande").max(10, "10 articles maximum par commande"),
  full_name: z.string().trim().min(3, "Veuillez indiquer votre nom complet").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[\d+\s().-]{8,20}$/, "Numéro de téléphone invalide"),
  email: z.string().trim().email("Email invalide").max(120).optional().or(z.literal("")).nullable(),
  wilaya_code: z.number().int().min(1).max(58, "Wilaya invalide"),
  commune: z.string().trim().min(2, "Commune requise").max(80),
  address: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
  delivery_type: z.enum(["home", "office"]).default("home"),
  office: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  // Tracking (never used for pricing)
  utm_source: z.string().max(100).optional().or(z.literal("")).nullable(),
  utm_medium: z.string().max(100).optional().or(z.literal("")).nullable(),
  utm_campaign: z.string().max(100).optional().or(z.literal("")).nullable(),
  referrer: z.string().max(500).optional().or(z.literal("")).nullable(),
  // Anti-spam: must stay empty
  website: z.string().max(200).optional().or(z.literal("")).nullable(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---------------------------------------------------------------------------
// Merchant — products
// ---------------------------------------------------------------------------

export const variantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  options: z.record(z.string().max(40), z.string().max(40)).max(3, "3 options maximum").optional().default({}),
  price_cents: z.number().int().positive().max(1_000_000_000).optional().nullable(),
  sku: z.string().max(60).optional().or(z.literal("")).nullable(),
  stock: z.number().int().min(0).max(1_000_000).optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120, "Nom trop long"),
  slug: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  description: z.string().trim().max(6000).optional().or(z.literal("")).nullable(),
  price: priceDA,
  compare_at_price: priceDA.optional().nullable(),
  sku: z.string().max(60).optional().or(z.literal("")).nullable(),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  low_stock_threshold: z.number().int().min(0).max(10_000).default(5),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  category_id: uuid.optional().nullable(),
  images: z.array(imageUrl).max(8).optional().default([]),
  variants: z.array(variantSchema).max(12).optional().default([]),
  seo_title: z.string().max(160).optional().or(z.literal("")).nullable(),
  seo_description: z.string().max(300).optional().or(z.literal("")).nullable(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const quantityOfferSchema = z.object({
  product_id: uuid.optional().nullable(),
  min_quantity: z.number().int().min(2, "L'offre démarre à 2 pièces").max(50),
  total_price_cents: z.number().int().positive().max(1_000_000_000),
  label: z.string().max(80).optional().or(z.literal("")).nullable(),
  is_active: z.boolean().default(true),
});

export const stockAdjustmentSchema = z.object({
  change: z.number().int().refine((v) => v !== 0, "Le mouvement doit être non nul"),
  reason: z.string().trim().min(3, "Indiquez la raison").max(200),
});

// ---------------------------------------------------------------------------
// Merchant — categories / FAQ / reviews
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional().or(z.literal("")).nullable(),
  description: z.string().max(500).optional().or(z.literal("")).nullable(),
  image_url: imageUrl,
  is_visible: z.boolean().default(true),
  position: z.number().int().min(0).max(1000).optional(),
});

export const faqSchema = z.object({
  question: z.string().trim().min(3).max(200),
  answer: z.string().trim().min(3).max(2000),
  is_visible: z.boolean().default(true),
  position: z.number().int().min(0).max(1000).optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES, { message: "Statut invalide" }),
  note: z.string().max(500).optional().or(z.literal("")).nullable(),
});

export const bulkOrderSchema = z.object({
  order_ids: z.array(uuid).min(1).max(100),
  status: z.enum(ORDER_STATUSES, { message: "Statut invalide" }),
  note: z.string().max(500).optional().or(z.literal("")).nullable(),
});

// ---------------------------------------------------------------------------
// Merchant — theme / shipping / integrations
// ---------------------------------------------------------------------------

export const themeSchema = z.object({
  logo_url: imageUrl,
  favicon_url: imageUrl,
  primary_color: color,
  secondary_color: color,
  background_color: z.union([color, z.literal("")]).optional().nullable(),
  typography: z.enum(TYPOGRAPHY_PRESETS),
  button_shape: z.enum(BUTTON_SHAPES),
  announcement: z.string().trim().max(160).optional().or(z.literal("")).nullable(),
});

export const shippingZoneSchema = z.object({
  wilaya_code: z.number().int().min(0).max(58),
  home_fee: priceDA,
  office_fee: priceDA,
  is_active: z.boolean().default(true),
});

export const shippingIntegrationSchema = z.object({
  provider_key: z.enum(SHIPPING_PROVIDER_KEYS),
  is_active: z.boolean().default(true),
  api_base_url: z.string().trim().url("URL invalide").max(200).optional().or(z.literal("")).nullable(),
  api_token: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
  account: z.string().trim().max(100).optional().or(z.literal("")).nullable(),
});

export const marketingIntegrationSchema = z.object({
  provider_key: z.enum(MARKETING_PROVIDER_KEYS),
  is_active: z.boolean().default(true),
  pixel_id: z
    .string()
    .max(60)
    .regex(/^[A-Za-z0-9._-]*$/, "Identifiant de pixel invalide")
    .optional()
    .or(z.literal(""))
    .nullable(),
  events_enabled: z.array(z.enum(MARKETING_EVENTS)).max(5).default(["PageView"]),
});

export const googleSheetsSchema = z.object({
  spreadsheet_id: z.string().max(100).optional().or(z.literal("")).nullable(),
  service_account_json: z.string().max(100_000).optional().or(z.literal("")).nullable(),
  fields: z.array(z.string().max(60)).max(20).default([]),
  is_active: z.boolean().default(true),
});

export const whatsappSchema = z.object({
  is_active: z.boolean().default(false),
  phone: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
  provider: z.enum(["none", "swivigo"]).default("none"),
});

export const pageUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  seo_title: z.string().max(160).optional().or(z.literal("")).nullable(),
  seo_description: z.string().max(300).optional().or(z.literal("")).nullable(),
  content: pageContentSchema.optional(),
});

// ---------------------------------------------------------------------------
// Team / clients / domains / wizard
// ---------------------------------------------------------------------------

export const inviteSchema = z.object({
  email: z.string().trim().email("Email invalide").max(120),
  role: z.enum(MERCHANT_ROLES as readonly [string, ...string[]]),
});

export const clientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  owner_name: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  owner_email: z.string().trim().email("Email invalide").max(120).optional().or(z.literal("")).nullable(),
  owner_phone: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
  internal_notes: z.string().max(2000).optional().or(z.literal("")).nullable(),
});

export const domainSchema = z.object({
  store_id: uuid,
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .max(253)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
      "Nom de domaine invalide (ex : www.monestore.com.dz)",
    ),
});

export const storeStatusSchema = z.object({
  status: z.enum(["draft", "active", "suspended", "archived"]),
});

export const wizardSchema = z.object({
  // Step 1 — client
  organization_id: uuid.optional().nullable(),
  create_new_client: z.boolean().default(true),
  client_name: z.string().trim().min(2).max(120),
  owner_name: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  owner_email: z.string().trim().email("Email du client invalide").max(120).optional().or(z.literal("")).nullable(),
  owner_phone: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
  // Step 2 — type
  website_type: z.enum(WEBSITE_TYPES),
  // Step 3 — template
  template_key: z.string().min(1).max(60),
  // Step 4 — identity
  business_name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional().or(z.literal("")).nullable(),
  logo_url: imageUrl,
  favicon_url: imageUrl,
  primary_color: color,
  secondary_color: color,
  language: z.enum(STORE_LANGUAGES).default("fr"),
  currency: z.string().length(3).default("DZD"),
  // Step 5 — contact
  contact_email: z.string().trim().email("Email invalide").max(120).optional().or(z.literal("")).nullable(),
  contact_phone: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
  whatsapp: socialUrl,
  instagram: socialUrl,
  facebook: socialUrl,
  tiktok: socialUrl,
  address: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
  // Step 6 — business
  cod_enabled: z.boolean().default(true),
  reviews_enabled: z.boolean().default(true),
  faq_enabled: z.boolean().default(true),
  default_home_fee: priceDA,
  default_office_fee: priceDA,
  office_delivery_enabled: z.boolean().default(true),
  initial_categories: z.array(z.object({ name: z.string().trim().min(2).max(80) })).max(10).default([]),
  initial_products: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        price: priceDA,
        description: z.string().max(6000).optional().or(z.literal("")).nullable(),
        image_url: imageUrl,
        category: z.string().trim().max(80).optional().or(z.literal("")).nullable(),
        stock: z.number().int().min(0).max(1_000_000).default(0),
      }),
    )
    .max(20)
    .default([]),
  // Step 7 — integrations
  meta_pixel_id: z.string().max(60).regex(/^[A-Za-z0-9._-]*$/).optional().or(z.literal("")).nullable(),
  tiktok_pixel_id: z.string().max(60).regex(/^[A-Za-z0-9._-]*$/).optional().or(z.literal("")).nullable(),
  ga4_measurement_id: z.string().max(60).regex(/^[A-Za-z0-9._-]*$/).optional().or(z.literal("")).nullable(),
  gtm_container_id: z.string().max(60).regex(/^[A-Za-z0-9._-]*$/).optional().or(z.literal("")).nullable(),
  google_ads_customer_id: z.string().max(60).regex(/^[A-Za-z0-9._-]*$/).optional().or(z.literal("")).nullable(),
});
export type WizardInput = z.infer<typeof wizardSchema>;

// ---------------------------------------------------------------------------
// Parse helper
// ---------------------------------------------------------------------------

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(" ");
    throw err(
      "VALIDATION",
      path ? `Champ « ${path} » : ${first?.message}` : (first?.message ?? "Données invalides."),
    );
  }
  return result.data;
}

/** Safe link re-export for API validation. */
export { safeLink };
