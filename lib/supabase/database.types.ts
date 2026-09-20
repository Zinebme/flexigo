/**
 * Hand-maintained database types for FlexiGo (equivalent to a
 * `supabase gen types` output). Keep in sync with supabase/migrations.
 *
 * Row types are strictly defined; Insert/Update are kept loose on purpose —
 * all writes go through validated Zod schemas in the API layer.
 */

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  last_login_at: string | null;
  dashboard_language: "fr" | "ar" | "en";
  dashboard_language_updated_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrganizationRow {
  id: string;
  name: string;
  owner_user_id: string | null;
  internal_notes: string | null;
  status: "active" | "suspended";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StoreSettings {
  contact: {
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    address: string | null;
  };
  business: {
    cod_enabled: boolean;
    reviews_enabled: boolean;
    faq_enabled: boolean;
    allow_negative_stock: boolean;
    max_items_per_order: number;
    office_delivery_enabled?: boolean;
  };
  appearance?: {
    accent_color?: string | null;
  };
}

export interface StoreRow {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  website_type: "ecommerce" | "single_product" | "portfolio";
  template_key: string;
  language: "fr" | "ar" | "en";
  currency: string;
  status: "draft" | "active" | "suspended" | "archived";
  settings: StoreSettings;
  published_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StoreMemberRow {
  id: string;
  store_id: string;
  user_id: string;
  role: "OWNER" | "MANAGER" | "ORDER_MANAGER" | "CONTENT_EDITOR" | "VIEWER";
  status: "invited" | "active" | "revoked";
  invited_by: string | null;
  created_at: string;
}

export interface PlatformAdminRow {
  id: string;
  user_id: string;
  role: "SUPER_ADMIN" | "STAFF";
  created_by: string | null;
  created_at: string;
}

export interface DomainRow {
  id: string;
  store_id: string;
  hostname: string;
  is_primary: boolean;
  status: "pending" | "verified" | "failed";
  verification_token: string;
  verification_data: Record<string, unknown> | null;
  verified_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface StoreCounterRow {
  id: string;
  store_id: string;
  key: string;
  value: number;
}

export interface PlatformSettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface TemplateRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  website_types: string[];
  is_system: boolean;
  screenshot_url: string | null;
  created_at: string;
}

export interface ThemeRow {
  id: string;
  store_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string | null;
  typography: string;
  button_shape: string;
  announcement: string | null;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  store_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductRow {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price_cents: number;
  cost_cents: number | null;
  is_digital: boolean;
  gallery_mode: "slideshow" | "stacked";
  landing_images: string[];
  min_order_quantity: number;
  shipping_label: string | null;
  stock_tracking_mode: "none" | "global" | "variants";
  related_product_ids: string[];
  cross_sell_product_ids: string[];
  page_element_order: string[];
  option_groups: unknown;

  compare_at_price_cents: number | null;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  name: string;
  options: Record<string, string>;
  price_cents: number | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  store_id: string;
  url: string;
  alt: string | null;
  position: number;
  created_at: string;
}

export interface QuantityOfferRow {
  id: string;
  store_id: string;
  product_id: string | null;
  min_quantity: number;
  total_price_cents: number;
  label: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
}

export interface ShippingZoneRow {
  id: string;
  store_id: string;
  wilaya_code: number;
  home_fee_cents: number | null;
  office_fee_cents: number | null;
  is_active: boolean;
}

export interface ReviewRow {
  id: string;
  store_id: string;
  product_id: string | null;
  order_id: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FaqItemRow {
  id: string;
  store_id: string;
  question: string;
  answer: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PageRow {
  id: string;
  store_id: string;
  key: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  content: Record<string, unknown> | null;
  published_content: Record<string, unknown> | null;
  version: number;
  published_at: string | null;
  updated_at: string;
}

export interface PageVersionRow {
  id: string;
  store_id: string;
  page_key: string;
  version: number;
  content: Record<string, unknown> | null;
  published_by: string | null;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  normalized_phone: string;
  email: string | null;
  notes: string | null;
  order_count: number;
  total_spent_cents: number;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrderRow {
  id: string;
  store_id: string;
  order_number: string;
  customer_id: string | null;
  full_name: string;
  phone: string;
  normalized_phone: string;
  wilaya_code: number;
  wilaya: string;
  commune: string;
  address: string | null;
  delivery_type: "home" | "office";
  office: string | null;
  subtotal_cents: number;
  shipping_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  status: string;
  internal_notes: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string | null;
  note: string | null;
  created_at: string;
}

export interface InventoryMovementRow {
  id: string;
  store_id: string;
  product_id: string;
  variant_id: string | null;
  change: number;
  reason: string;
  actor_user_id: string | null;
  created_at: string;
}

export interface ShippingIntegrationRow {
  id: string;
  store_id: string;
  provider_key: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  status: "unconfigured" | "configured" | "error";
  last_tested_at: string | null;
  last_error: string | null;
  updated_at: string;
}

export interface ShipmentRow {
  id: string;
  store_id: string;
  order_id: string;
  integration_id: string | null;
  provider_key: string;
  provider_shipment_id: string | null;
  tracking_number: string | null;
  status: string;
  last_synced_at: string | null;
  raw_status: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingIntegrationRow {
  id: string;
  store_id: string;
  provider_key: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  events_enabled: string[];
  position: number;
  updated_at: string;
}

export interface GoogleSheetIntegrationRow {
  id: string;
  store_id: string;
  spreadsheet_id: string | null;
  credential_encrypted: string | null;
  fields: string[];
  is_active: boolean;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
  updated_at: string;
}

export interface TelegramIntegrationRow {
  id: string;
  store_id: string;
  bot_token_encrypted: string;
  chat_id: string;
  enabled_events: string[];
  is_active: boolean;
  status: "pending" | "connected" | "error";
  last_error: string | null;
  last_test_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppIntegrationRow {
  id: string;
  store_id: string;
  is_active: boolean;
  phone: string | null;
  provider: string;
  config: Record<string, unknown> | null;
  status: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  store_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  support_session_id: string | null;
  ip: string | null;
  created_at: string;
}

export interface SystemEventRow {
  id: string;
  store_id: string | null;
  category: string;
  level: string;
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface IntegrationLogRow {
  id: string;
  store_id: string;
  integration_type: string;
  action: string;
  status: "success" | "failure";
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SupportSessionRow {
  id: string;
  admin_user_id: string;
  store_id: string;
  started_at: string;
  ended_at: string | null;
  expires_at: string;
  ip: string | null;
  created_at: string;
}

type LooseInsert = { [col: string]: unknown };

// Row is intersected with Record<string, unknown> because postgrest-js
// constrains GenericTable.Row to Record<string, unknown>; interfaces (our
// row definitions) carry no implicit index signature, so the intersection
// satisfies the constraint while keeping every concrete field typed.
type T<R> = {
  Row: R & Record<string, unknown>;
  Insert: LooseInsert;
  Update: LooseInsert;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: T<ProfileRow>;
      organizations: T<OrganizationRow>;
      stores: T<StoreRow>;
      store_members: T<StoreMemberRow>;
      platform_admins: T<PlatformAdminRow>;
      domains: T<DomainRow>;
      store_counters: T<StoreCounterRow>;
      platform_settings: T<PlatformSettingRow>;
      templates: T<TemplateRow>;
      themes: T<ThemeRow>;
      categories: T<CategoryRow>;
      products: T<ProductRow>;
      product_variants: T<ProductVariantRow>;
      product_images: T<ProductImageRow>;
      quantity_offers: T<QuantityOfferRow>;
      shipping_zones: T<ShippingZoneRow>;
      reviews: T<ReviewRow>;
      faq_items: T<FaqItemRow>;
      pages: T<PageRow>;
      page_versions: T<PageVersionRow>;
      customers: T<CustomerRow>;
      orders: T<OrderRow>;
      order_items: T<OrderItemRow>;
      order_status_history: T<OrderStatusHistoryRow>;
      inventory_movements: T<InventoryMovementRow>;
      shipping_integrations: T<ShippingIntegrationRow>;
      shipments: T<ShipmentRow>;
      marketing_integrations: T<MarketingIntegrationRow>;
      google_sheet_integrations: T<GoogleSheetIntegrationRow>;
      telegram_integrations: T<TelegramIntegrationRow>;
      whatsapp_integrations: T<WhatsAppIntegrationRow>;
      audit_logs: T<AuditLogRow>;
      system_events: T<SystemEventRow>;
      integration_logs: T<IntegrationLogRow>;
      support_sessions: T<SupportSessionRow>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      fn_next_order_number: {
        Args: { p_store_id: string };
        Returns: string;
      };
      fn_place_cod_order: {
        Args: {
          p_store_id: string;
          p_lines: Array<{ product_id: string; variant_id: string | null; quantity: number }>;
          p_full_name: string;
          p_phone: string;
          p_email: string | null;
          p_wilaya_code: number;
          p_commune: string;
          p_address: string | null;
          p_delivery_type: string;
          p_office: string | null;
          p_utm_source: string | null;
          p_utm_medium: string | null;
          p_utm_campaign: string | null;
          p_referrer: string | null;
          p_source: string;
        };
        Returns: Record<string, unknown>;
      };
      fn_create_store: {
        Args: {
          p_organization_id: string | null;
          p_name: string;
          p_slug: string;
          p_website_type: string;
          p_template_key: string;
          p_language: string;
          p_currency: string;
          p_identity: Record<string, unknown>;
          p_settings: Record<string, unknown>;
          p_pages: Array<{ key: string; title: string; content: Record<string, unknown> }>;
          p_zones: Array<{ wilaya_code: number; home_fee_cents: number; office_fee_cents: number }>;
          p_owner_user_id: string;
          p_creator_id: string;
        };
        Returns: string;
      };
      fn_publish_page: {
        Args: {
          p_store_id: string;
          p_page_key: string;
          p_expected_version: number;
          p_actor_id: string | null;
        };
        Returns: Record<string, unknown>;
      };
      fn_restore_page_version: {
        Args: {
          p_store_id: string;
          p_page_key: string;
          p_version: number;
          p_actor_id: string | null;
        };
        Returns: Record<string, unknown>;
      };
      fn_copy_store: {
        Args: {
          p_source_store_id: string;
          p_new_slug: string;
          p_new_name: string;
          p_actor_id: string;
        };
        Returns: string;
      };
      fn_activate_membership: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      fn_can_access_store: {
        Args: { p_user_id: string; p_store_id: string };
        Returns: boolean;
      };
      fn_has_store_role: {
        Args: { p_user_id: string; p_store_id: string; p_roles: string[] };
        Returns: boolean;
      };
      fn_is_platform_admin: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {}; // eslint-disable-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
