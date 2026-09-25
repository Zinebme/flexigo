-- FlexiGo hosted Supabase setup (fresh project)
-- Does not create/alter Supabase-managed auth tables from migration 0001.
create extension if not exists pgcrypto;


-- >>> BEGIN 20260918000002_core_tenancy.sql >>>
-- ===========================================================================
-- FlexiGo — 0002: core tenancy
-- organization → stores → store_members ; platform_admins ; domains
--
-- Security model:
-- * Every tenant-owned entity carries store_id (FK → stores).
-- * store_members is the ONLY way a user accesses a store (no store_id on
--   profiles). Roles: OWNER, MANAGER, ORDER_MANAGER, CONTENT_EDITOR, VIEWER.
-- * platform_admins is a completely separate table (SUPER_ADMIN, STAFF) and
--   gets NO RLS policy at all — client sessions cannot read or write it;
--   privileged work happens server-side with the service key after authz.
-- ===========================================================================

-- --- profiles (1:1 with auth.users) -----------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  is_verified boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --- organizations (a client can own several stores) -------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references public.profiles(id) on delete set null,
  internal_notes text, -- Super Admin notes, never shown to merchants
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --- stores (one website / tenant) ------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  slug text not null unique, -- preview URL: /s/<slug>
  website_type text not null check (website_type in ('ecommerce', 'single_product', 'portfolio')),
  template_key text not null default 'ecommerce-modern',
  language text not null default 'fr' check (language in ('fr', 'ar', 'en')),
  currency text not null default 'DZD',
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended', 'archived')),
  settings jsonb not null default '{
    "contact": {"email": null, "phone": null, "whatsapp": null, "instagram": null, "facebook": null, "tiktok": null, "address": null},
    "business": {"cod_enabled": true, "reviews_enabled": true, "faq_enabled": true, "allow_negative_stock": false, "max_items_per_order": 10}
  }'::jsonb,
  published_version integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --- store_members (the ONLY user↔store link) --------------------------------
create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('OWNER', 'MANAGER', 'ORDER_MANAGER', 'CONTENT_EDITOR', 'VIEWER')),
  status text not null default 'active' check (status in ('invited', 'active', 'revoked')),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

-- --- platform_admins (separate from merchants — NO RLS policy) ---------------
create table public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN', 'STAFF')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- --- domains (custom domain per store, provider-neutral) ---------------------
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  hostname text not null,
  is_primary boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  verification_token text not null default gen_random_uuid()::text,
  verification_data jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (hostname)
);

-- at most one primary domain per store
create unique index domains_one_primary_per_store
  on public.domains (store_id)
  where is_primary and deleted_at is null;

-- --- store_counters (atomic order numbers etc.) ------------------------------
create table public.store_counters (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  key text not null,
  value bigint not null default 0,
  unique (store_id, key)
);

-- --- platform_settings (key/value, Super Admin) -------------------------------
create table public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('platform_name', '{"value": "Marqova"}'),
  ('maintenance_mode', '{"value": false, "message": null}')
on conflict (key) do nothing;
-- <<< END 20260918000002_core_tenancy.sql <<<


-- >>> BEGIN 20260918000003_catalog.sql >>>
-- ===========================================================================
-- FlexiGo — 0003: catalog (templates, themes, categories, products,
-- variants, images, quantity offers, shipping zones, reviews, FAQ)
-- ===========================================================================

-- --- templates (design system, platform-managed) ------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  website_types text[] not null default '{}',
  is_system boolean not null default true,
  screenshot_url text,
  created_at timestamptz not null default now()
);

-- --- themes (approved appearance options only — no raw CSS) -------------------
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  logo_url text,
  favicon_url text,
  primary_color text not null default '#1d4ed8',
  secondary_color text not null default '#f59e0b',
  background_color text,
  typography text not null default 'modern' check (typography in ('modern', 'elegant', 'bold', 'minimal')),
  button_shape text not null default 'rounded' check (button_shape in ('rounded', 'sharp', 'pill')),
  announcement text,
  updated_at timestamptz not null default now()
);

-- --- categories -----------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, slug)
);

-- --- products --------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  sku text,
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, slug)
);

-- --- product variants (colors/sizes/… configured options) ------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  options jsonb not null default '{}'::jsonb, -- e.g. {"Couleur": "Rouge", "Taille": "M"}
  price_cents integer check (price_cents >= 0), -- null → inherits product price
  sku text,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name)
);

-- --- product images ----------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  url text not null,
  alt text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- --- quantity offers (COD bundles: "2 pièces = 3900 DA") ---------------------------
-- product_id null → store-level default offer; product-specific offers win.
create table public.quantity_offers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  min_quantity integer not null check (min_quantity between 2 and 50),
  total_price_cents integer not null check (total_price_cents >= 0), -- TOTAL for the bundle
  label text,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- --- shipping zones (per-wilaya fees; wilaya_code 0 = default zone) ---------------
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  wilaya_code integer not null check (wilaya_code between 0 and 58),
  home_fee_cents integer check (home_fee_cents >= 0),
  office_fee_cents integer check (office_fee_cents >= 0),
  is_active boolean not null default true,
  unique (store_id, wilaya_code)
);

-- --- reviews (moderated) -----------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --- FAQ items ----------------------------------------------------------------------
create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  question text not null,
  answer text not null,
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
-- <<< END 20260918000003_catalog.sql <<<


-- >>> BEGIN 20260918000004_orders.sql >>>
-- ===========================================================================
-- FlexiGo — 0004: orders (customers, orders, items, history, inventory)
--
-- Order totals (subtotal / shipping / discount / total) are ALWAYS computed
-- server-side (fn_place_cod_order) from stored prices — never from the
-- browser. The stock check + decrement is atomic inside that function.
-- ===========================================================================

-- --- customers (matched by normalized phone + store, never across tenants) ------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null,
  normalized_phone text not null, -- "213XXXXXXXXX"
  email text,
  notes text,
  order_count integer not null default 0,
  total_spent_cents bigint not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, normalized_phone)
);

-- --- orders -------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  full_name text not null,
  phone text not null,
  normalized_phone text not null,
  wilaya_code integer not null check (wilaya_code between 1 and 58),
  wilaya text not null,
  commune text not null,
  address text,
  delivery_type text not null default 'home' check (delivery_type in ('home', 'office')),
  office text,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_fee_cents integer not null default 0 check (shipping_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'new' check (status in (
    'new', 'to_confirm', 'confirmed', 'postponed', 'no_answer',
    'cancelled_customer', 'preparation', 'shipped', 'in_transit',
    'at_office', 'out_for_delivery', 'delivered', 'returned',
    'delivery_failed', 'cancelled_store'
  )),
  internal_notes text,
  source text default 'storefront',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  tracking_number text,
  shipping_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order numbers are unique per store (each store counts from ORD-000001).
alter table public.orders add constraint orders_store_order_number_key unique (store_id, order_number);

-- --- order items (name/price snapshots survive product edits) -----------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

-- --- order status history (audit trail per order) ------------------------------------
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- --- inventory movements (adjustments with reason + actor) -----------------------------
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  change integer not null,
  reason text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
-- <<< END 20260918000004_orders.sql <<<


-- >>> BEGIN 20260918000005_content_pages.sql >>>
-- ===========================================================================
-- FlexiGo — 0005: content (pages, draft/publish versions)
--
-- pages.content         = current DRAFT (merchant edits land here)
-- pages.published_content = what the live site serves (until publish)
-- page_versions         = immutable history of every published version
-- The live site ALWAYS reads published_content; preview reads content.
-- ===========================================================================

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  key text not null, -- home | shop | about | faq | contact | legal-terms | legal-privacy
  title text not null,
  seo_title text,
  seo_description text,
  content jsonb,              -- draft: {"sections": [...]}
  published_content jsonb,    -- live snapshot
  version integer not null default 0, -- number of published snapshots
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (store_id, key)
);

create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  page_key text not null,
  version integer not null,
  content jsonb,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (store_id, page_key, version)
);
-- <<< END 20260918000005_content_pages.sql <<<


-- >>> BEGIN 20260918000006_integrations.sql >>>
-- ===========================================================================
-- FlexiGo — 0006: integrations (shipping, shipments, marketing pixels,
-- Google Sheets, WhatsApp)
--
-- Credential policy:
-- * shipping_integrations.config and google_sheet_integrations.credential_*
--   hold ONLY ENCRYPTED values (fxenc1.* prefix, AES-256-GCM).
-- * These tables have NO RLS policies: client sessions cannot read them
--   directly. The merchant API decrypts server-side, masks secrets in the
--   response, and re-encrypts on save.
-- * Marketing pixel IDs are public by design (they ship in storefront
--   HTML), so marketing_integrations is readable by store members — but
--   writes are role-restricted and values are validated (no code fields).
-- ===========================================================================

-- --- shipping provider configuration -------------------------------------------
create table public.shipping_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider_key text not null check (provider_key in ('manual', 'navex', 'mock')),
  is_active boolean not null default false,
  config jsonb not null default '{}'::jsonb, -- encrypted values only (fxenc1.*)
  status text not null default 'unconfigured' check (status in ('unconfigured', 'configured', 'error')),
  last_tested_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  unique (store_id, provider_key)
);

-- --- shipments (order ↔ provider) ---------------------------------------------------
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  integration_id uuid references public.shipping_integrations(id) on delete set null,
  provider_key text not null,
  provider_shipment_id text,
  tracking_number text,
  status text not null default 'pending',
  last_synced_at timestamptz,
  raw_status jsonb, -- sanitized provider payload (no credentials)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);

-- --- marketing pixels / tags (config = validated identifiers, never code) -----------
create table public.marketing_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider_key text not null check (provider_key in (
    'meta_pixel', 'tiktok_pixel', 'snapchat_pixel', 'pinterest_tag',
    'ga4', 'gtm', 'google_ads'
  )),
  is_active boolean not null default false,
  config jsonb not null default '{}'::jsonb, -- e.g. {"pixel_id": "123456789"} — no code
  events_enabled text[] not null default '{PageView}',
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (store_id, provider_key)
);

-- --- Google Sheets -------------------------------------------------------------------
create table public.google_sheet_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  spreadsheet_id text,
  credential_encrypted text, -- encrypted service-account JSON (fxenc1.*)
  fields text[] not null default '{}',
  is_active boolean not null default false,
  last_synced_at timestamptz,
  last_status text check (last_status is null or last_status in ('success', 'failure')),
  last_error text,
  updated_at timestamptz not null default now()
);

-- --- WhatsApp (future Swivigo plug-in point) -------------------------------------------
create table public.whatsapp_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  is_active boolean not null default false,
  phone text,
  provider text not null default 'none' check (provider in ('none', 'swivigo')),
  config jsonb not null default '{}'::jsonb,
  status text not null default 'idle' check (status in ('idle', 'connected', 'error')),
  updated_at timestamptz not null default now()
);
-- <<< END 20260918000006_integrations.sql <<<


-- >>> BEGIN 20260918000007_logs_health.sql >>>
-- ===========================================================================
-- FlexiGo — 0007: audit, system events, integration logs, support sessions
--
-- These tables have NO RLS policies: they are invisible to client sessions
-- by default (deny all) and are read exclusively by Super Admin
-- server-side routes (service role). Secrets are scrubbed before insert at
-- the application layer (lib/audit.ts).
-- ===========================================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  store_id uuid references public.stores(id) on delete cascade,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  support_session_id uuid,
  ip text,
  created_at timestamptz not null default now()
);

create table public.system_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  category text not null check (category in ('error', 'warning', 'integration', 'domain', 'system')),
  level text not null check (level in ('info', 'warning', 'error')),
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create table public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  integration_type text not null, -- shipping | google_sheets | meta_pixel | …
  action text not null,
  status text not null check (status in ('success', 'failure')),
  message text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- --- support sessions (silent Super Admin impersonation — fully logged) ----------
create table public.support_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ip text,
  created_at timestamptz not null default now()
);
-- <<< END 20260918000007_logs_health.sql <<<


-- >>> BEGIN 20260918000008_functions_checkout.sql >>>
-- ===========================================================================
-- FlexiGo — 0008: database functions (the transactional core)
--
-- All business-critical operations are atomic PL/pgSQL functions:
--   fn_place_cod_order  — checkout with server-side pricing, atomic stock
--   fn_create_store     — store + theme + membership + pages + zones
--   fn_publish_page / fn_restore_page_version — draft/publish with versioning
--   fn_copy_store       — safe duplication (no customer data, no secrets)
--
-- SECURITY:
-- * These functions are SECURITY DEFINER with fixed search_path — they
--   cannot be hijacked via search_path injection.
-- * fn_place_cod_order is callable by anon (public checkout) but performs
--   EVERY validation itself: store state, product state, mobile phone,
--   stock (row-locked), price from DB, best quantity offer, shipping zone.
--   The caller never supplies prices or totals.
-- * Exceptions are raised with stable machine codes (STORE_NOT_ACTIVE,
--   OUT_OF_STOCK, …) mapped to French messages by the API layer.
-- ===========================================================================

-- --- phone normalization (Algeria) ---------------------------------------------
create or replace function public.fn_normalize_phone(raw text) returns text
language plpgsql immutable
as $$
declare
  p text;
begin
  p := regexp_replace(coalesce(raw, ''), '[^0-9+]', '', 'g');
  p := replace(p, '+', '');
  if p like '00213%' then p := substring(p from 6); end if;
  if p like '0213%' and length(p) = 13 then p := substring(p from 2); end if; -- 0213 + 9 digits
  if p like '213%' and length(p) = 12 then p := substring(p from 4); end if;
  if p like '0%' and length(p) = 10 then p := substring(p from 2); end if;
  if p ~ '^[0-9]{9}$' then return '213' || p; end if;
  return null;
end;
$$;

-- --- membership / role helpers (used by RLS) ------------------------------------
create or replace function public.fn_has_store_membership(p_user_id uuid, p_store_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where user_id = p_user_id and store_id = p_store_id and status in ('active', 'invited')
  );
$$;

-- Role check — a Super Admin with an OPEN support session passes any
-- store-scoped role check for that store (silent support access). The app
-- layer additionally restricts what support mode may do (no team/settings)
-- and records every support action in audit_logs.
create or replace function public.fn_is_platform_admin(p_user_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = p_user_id);
$$;

-- Support access is ONLY possible for verified platform admins holding an
-- open, logged support session (defense in depth: the row alone is not enough).
create or replace function public.fn_is_support_open(p_user_id uuid, p_store_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_is_platform_admin(p_user_id) and exists (
    select 1 from public.support_sessions
    where admin_user_id = p_user_id and store_id = p_store_id and ended_at is null
  );
$$;

-- membership OR (Super Admin with an open, logged support session)
create or replace function public.fn_has_store_role(p_user_id uuid, p_store_id uuid, p_roles text[]) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_is_support_open(p_user_id, p_store_id)
    or exists (
      select 1 from public.store_members
      where user_id = p_user_id and store_id = p_store_id and status = 'active' and role = any (p_roles)
    );
$$;

create or replace function public.fn_can_access_store(p_user_id uuid, p_store_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_has_store_membership(p_user_id, p_store_id)
    or (public.fn_is_platform_admin(p_user_id) and public.fn_is_support_open(p_user_id, p_store_id));
$$;

-- --- updated_at trigger ------------------------------------------------------------
create or replace function public.fn_set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- profile bootstrap on new auth user ---------------------------------------------
create or replace function public.fn_ensure_profile(p_user_id uuid, p_full_name text, p_email text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (p_user_id, p_full_name, p_email)
  on conflict (id) do nothing;
end;
$$;

-- Trigger wrapper (NEW is only visible inside the function body).
create or replace function public.fn_on_new_auth_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform fn_ensure_profile(new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  return new;
end;
$$;

-- --- membership activation on first sign-in -------------------------------------------
create or replace function public.fn_activate_membership(p_user_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.store_members set status = 'active'
  where user_id = p_user_id and status = 'invited';
  update public.profiles set last_login_at = now() where id = p_user_id;
end;
$$;

-- Trigger wrapper (NEW is only visible inside the function body).
create or replace function public.fn_on_new_session() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform fn_activate_membership(new.user_id);
  return new;
end;
$$;

-- --- atomic order number ----------------------------------------------------------------
create or replace function public.fn_next_order_number(p_store_id uuid) returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_val bigint;
begin
  insert into public.store_counters (store_id, key, value) values (p_store_id, 'orders', 1)
  on conflict (store_id, key) do update set value = public.store_counters.value + 1
  returning value into v_val;
  return 'ORD-' || lpad(v_val::text, 6, '0');
end;
$$;

-- --- THE CHECKOUT FUNCTION -------------------------------------------------------------
-- Anonymous-callable, fully self-validating, atomic.
create or replace function public.fn_place_cod_order(
  p_store_id uuid,
  p_lines jsonb,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_wilaya_code integer default 16,
  p_commune text default null,
  p_address text default null,
  p_delivery_type text default 'home',
  p_office text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_referrer text default null,
  p_source text default 'storefront'
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_store public.stores%rowtype;
  v_max_lines integer;
  v_normalized text;
  v_delivery text;
  v_zone public.shipping_zones%rowtype;
  v_fee integer;
  v_line jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_qty integer;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_base integer;
  v_offer public.quantity_offers%rowtype;
  v_line_total integer;
  v_item record;
  v_collect_product_id uuid;
  v_collect_product_name text;
  v_collect_variant_id uuid;
  v_collect_variant_name text;
  v_items jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_total integer;
  v_order_number text;
  v_order_id uuid;
  v_customer_id uuid;
begin
  -- 1. Store must exist and be live
  select * into v_store from public.stores where id = p_store_id and deleted_at is null;
  if not found then raise exception 'STORE_NOT_FOUND'; end if;
  if v_store.status <> 'active' then raise exception 'STORE_NOT_ACTIVE'; end if;
  if not coalesce((v_store.settings -> 'business' ->> 'cod_enabled')::boolean, true)
     then raise exception 'COD_DISABLED'; end if;

  -- 2. Input sanity (names/commune validated by API layer too — defense in depth)
  if p_full_name is null or length(trim(p_full_name)) < 3 then raise exception 'INVALID_NAME'; end if;
  if p_commune is null or length(trim(p_commune)) < 2 then raise exception 'INVALID_COMMUNE'; end if;

  v_max_lines := coalesce((v_store.settings -> 'business' ->> 'max_items_per_order')::integer, 10);
  if p_lines is null or jsonb_array_length(p_lines) < 1 then raise exception 'EMPTY_CART'; end if;
  if jsonb_array_length(p_lines) > v_max_lines then raise exception 'TOO_MANY_LINES'; end if;

  -- 3. Phone: must be a valid Algerian mobile number
  v_normalized := public.fn_normalize_phone(p_phone);
  if v_normalized is null then raise exception 'INVALID_PHONE'; end if;
  if substring(v_normalized, 4, 1) not in ('5', '6', '7') then raise exception 'INVALID_MOBILE'; end if;

  v_delivery := case when p_delivery_type = 'office' then 'office' else 'home' end;

  -- 4. Shipping fee: per-wilaya zone, falling back to the default zone (0)
  select * into v_zone from public.shipping_zones
   where store_id = p_store_id and wilaya_code = p_wilaya_code and is_active;
  if not found then
    select * into v_zone from public.shipping_zones
     where store_id = p_store_id and wilaya_code = 0 and is_active;
  end if;
  v_fee := case
    when found and v_delivery = 'home' then coalesce(v_zone.home_fee_cents, 0)
    when found then coalesce(v_zone.office_fee_cents, 0)
    else 0
  end;

  -- 5. Lines: validate, lock, price from DB, apply best offer, decrement stock
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_variant_id := nullif(v_line ->> 'variant_id', '')::uuid;
    v_qty := coalesce((v_line ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 50 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_product from public.products
     where id = v_product_id and store_id = p_store_id and is_active and deleted_at is null
     for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;

    v_collect_product_id := v_product.id;
    v_collect_product_name := v_product.name;

    if v_variant_id is not null then
      select * into v_variant from public.product_variants
       where id = v_variant_id and product_id = v_product.id and is_active
       for update;
      if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
      if v_variant.stock < v_qty then raise exception 'OUT_OF_STOCK'; end if;
      update public.product_variants set stock = stock - v_qty where id = v_variant.id;
      v_collect_variant_id := v_variant.id;
      v_collect_variant_name := v_variant.name;
      v_base := coalesce(v_variant.price_cents, v_product.price_cents);
      insert into public.inventory_movements (store_id, product_id, variant_id, change, reason)
      values (p_store_id, v_product.id, v_variant.id, -v_qty, 'commande');
    else
      if not coalesce((v_store.settings -> 'business' ->> 'allow_negative_stock')::boolean, false)
         and v_product.stock < v_qty then raise exception 'OUT_OF_STOCK'; end if;
      update public.products set stock = stock - v_qty where id = v_product.id;
      v_base := v_product.price_cents;
      insert into public.inventory_movements (store_id, product_id, change, reason)
      values (p_store_id, v_product.id, -v_qty, 'commande');
    end if;

    -- Best offer: product-specific first, then store-level; highest min_quantity.
    select * into v_offer from public.quantity_offers
     where store_id = p_store_id and is_active
       and (product_id is null or product_id = v_product.id)
       and min_quantity <= v_qty
     order by (case when product_id = v_product.id then 1 else 0 end) desc, min_quantity desc
     limit 1;
    if found then
      v_line_total := v_offer.total_price_cents;
    else
      v_line_total := v_base * v_qty;
    end if;

    v_items := v_items || jsonb_build_object(
      'product_id', v_collect_product_id,
      'variant_id', v_collect_variant_id,
      'product_name', v_collect_product_name,
      'variant_name', v_collect_variant_name,
      'quantity', v_qty,
      'unit_price', v_base,
      'line_total', v_line_total
    );
    v_collect_variant_id := null;
    v_collect_variant_name := null;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- 6. Totals (server-side only)
  v_total := v_subtotal + v_fee;

  -- 7. Create order + items
  v_order_number := public.fn_next_order_number(p_store_id);
  insert into public.orders (
    store_id, order_number, full_name, phone, normalized_phone,
    wilaya_code, wilaya, commune, address, delivery_type, office,
    subtotal_cents, shipping_fee_cents, discount_cents, total_cents, status, source,
    utm_source, utm_medium, utm_campaign, referrer
  ) values (
    p_store_id, v_order_number, trim(p_full_name), v_normalized, v_normalized,
    p_wilaya_code, coalesce((select name from public.wilayas where code = p_wilaya_code), 'Wilaya ' || p_wilaya_code),
    trim(p_commune), nullif(trim(coalesce(p_address, '')), ''), v_delivery, nullif(trim(coalesce(p_office, '')), ''),
    v_subtotal, v_fee, 0, v_total, 'new', p_source,
    nullif(p_utm_source, ''), nullif(p_utm_medium, ''), nullif(p_utm_campaign, ''), nullif(p_referrer, '')
  ) returning id into v_order_id;

  for v_item in
      select product_id, variant_id, product_name, variant_name, quantity, unit_price, line_total
        from jsonb_to_recordset(v_items)
       as (product_id uuid, variant_id uuid, product_name text, variant_name text, quantity integer, unit_price integer, line_total integer)
  loop
    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price_cents, line_total_cents)
    values (v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name, v_item.variant_name, v_item.quantity, v_item.unit_price, v_item.line_total);
  end loop;

  -- 8. Customer upsert (normalized phone + store; never merged across tenants)
  insert into public.customers (store_id, name, phone, normalized_phone, email, order_count, total_spent_cents, last_order_at)
  values (p_store_id, trim(p_full_name), v_normalized, v_normalized, nullif(trim(coalesce(p_email, '')), ''), 1, v_total, now())
  on conflict (store_id, normalized_phone) do update set
    name = excluded.name,
    email = coalesce(excluded.email, public.customers.email),
    order_count = public.customers.order_count + 1,
    total_spent_cents = public.customers.total_spent_cents + excluded.total_spent_cents,
    last_order_at = now()
  returning id into v_customer_id;

  update public.orders set customer_id = v_customer_id where id = v_order_id;

  -- 9. History + event
  insert into public.order_status_history (order_id, from_status, to_status)
  values (v_order_id, null, 'new');
  insert into public.system_events (store_id, category, level, message)
  values (p_store_id, 'system', 'info', 'Commande ' || v_order_number || ' créée');

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_cents', v_subtotal,
    'shipping_fee_cents', v_fee,
    'total_cents', v_total,
    'status', 'new'
  );
end;
$$;
-- <<< END 20260918000008_functions_checkout.sql <<<


-- >>> BEGIN 20260918000009_wilayas_ref.sql >>>
-- ===========================================================================
-- FlexiGo — 0009: wilayas reference table (Algeria, 58 wilayas)
-- Read-only reference data used by checkout and shipping zones.
-- ===========================================================================

create table public.wilayas (
  code integer primary key check (code between 1 and 58),
  name text not null unique
);

insert into public.wilayas (code, name) values
  (1, 'Adrar'), (2, 'Chlef'), (3, 'Laghouat'), (4, 'Oum El Bouaghi'), (5, 'Batna'),
  (6, 'Béjaïa'), (7, 'Biskra'), (8, 'Béchar'), (9, 'Blida'), (10, 'Bouira'),
  (11, 'Tamanrasset'), (12, 'Tébessa'), (13, 'Tlemcen'), (14, 'Tiaret'), (15, 'Tizi Ouzou'),
  (16, 'Alger'), (17, 'Djelfa'), (18, 'Jijel'), (19, 'Sétif'), (20, 'Saïda'),
  (21, 'Skikda'), (22, 'Sidi Bel Abbès'), (23, 'Annaba'), (24, 'Guelma'), (25, 'Constantine'),
  (26, 'Médéa'), (27, 'Mostaganem'), (28, 'M''Sila'), (29, 'Mascara'), (30, 'Ouargla'),
  (31, 'Oran'), (32, 'El Bayadh'), (33, 'Illizi'), (34, 'Bordj Bou Arréridj'), (35, 'Boumerdès'),
  (36, 'El Tarf'), (37, 'Tindouf'), (38, 'Tissemsilt'), (39, 'El Oued'), (40, 'Khenchela'),
  (41, 'Souk Ahras'), (42, 'Tipaza'), (43, 'Mila'), (44, 'Aïn Defla'), (45, 'Naâma'),
  (46, 'Aïn Témouchent'), (47, 'Ghardaïa'), (48, 'Relizane'), (49, 'Timimoun'), (50, 'Bordj Badji Mokhtar'),
  (51, 'Ouled Djellal'), (52, 'Béni Abbès'), (53, 'In Salah'), (54, 'In Guezzam'), (55, 'Touggourt'),
  (56, 'Djanet'), (57, 'El M''Ghair'), (58, 'El Meniaa')
on conflict (code) do nothing;
-- <<< END 20260918000009_wilayas_ref.sql <<<


-- >>> BEGIN 20260918000010_functions_store_lifecycle.sql >>>
-- ===========================================================================
-- FlexiGo — 0010: store lifecycle functions (create / publish / restore / copy)
-- Called server-side (service role) by the wizard, dashboard and repair tools.
-- ===========================================================================

-- --- atomic store creation (wizard) ---------------------------------------------------
create or replace function public.fn_create_store(
  p_organization_id uuid,
  p_name text,
  p_slug text,
  p_website_type text,
  p_template_key text,
  p_language text,
  p_currency text,
  p_identity jsonb,      -- {logo_url, favicon_url, primary_color, secondary_color, background_color, typography, button_shape}
  p_settings jsonb,      -- validated store settings (contact + business)
  p_pages jsonb,         -- [{key, title, content}]
  p_zones jsonb,         -- [{wilaya_code, home_fee_cents, office_fee_cents}]
  p_owner_user_id uuid,
  p_creator_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_store_id uuid;
  v_page jsonb;
  v_zone jsonb;
begin
  -- Service-role only: these lifecycle operations are privileged and must be
  -- driven exclusively by the platform backend, never by a client session.
  if coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
    if p_slug is null or p_slug !~ '^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$' then
    raise exception 'INVALID_SLUG';
  end if;
  if p_website_type not in ('ecommerce', 'single_product', 'portfolio') then
    raise exception 'INVALID_TYPE';
  end if;
  if p_language not in ('fr', 'ar', 'en') then raise exception 'INVALID_LANGUAGE'; end if;
  if not exists (select 1 from public.templates where key = p_template_key) then
    raise exception 'TEMPLATE_NOT_FOUND';
  end if;
  if exists (select 1 from public.stores where slug = p_slug and deleted_at is null) then
    raise exception 'SLUG_TAKEN';
  end if;
  if not exists (select 1 from public.profiles where id = p_owner_user_id) then
    raise exception 'OWNER_NOT_FOUND';
  end if;

  insert into public.stores (organization_id, name, slug, website_type, template_key, language, currency, status, settings, created_by)
  values (
    p_organization_id, p_name, p_slug, p_website_type, p_template_key,
    p_language, coalesce(p_currency, 'DZD'), 'draft',
    coalesce(p_settings, '{"contact":{"email":null,"phone":null,"whatsapp":null,"instagram":null,"facebook":null,"tiktok":null,"address":null},"business":{"cod_enabled":true,"reviews_enabled":true,"faq_enabled":true,"allow_negative_stock":false,"max_items_per_order":10}}'::jsonb),
    p_creator_id
  ) returning id into v_store_id;

  insert into public.themes (store_id, logo_url, favicon_url, primary_color, secondary_color, background_color, typography, button_shape)
  values (
    v_store_id,
    nullif(p_identity ->> 'logo_url', ''),
    nullif(p_identity ->> 'favicon_url', ''),
    coalesce(nullif(p_identity ->> 'primary_color', ''), '#1d4ed8'),
    coalesce(nullif(p_identity ->> 'secondary_color', ''), '#f59e0b'),
    nullif(p_identity ->> 'background_color', ''),
    coalesce(nullif(p_identity ->> 'typography', ''), 'modern'),
    coalesce(nullif(p_identity ->> 'button_shape', ''), 'rounded')
  );

  insert into public.store_members (store_id, user_id, role, status, invited_by)
  values (v_store_id, p_owner_user_id, 'OWNER', 'active', p_creator_id);

  for v_page in select * from jsonb_array_elements(coalesce(p_pages, '[]'::jsonb))
  loop
    insert into public.pages (store_id, key, title, content, published_content, version, published_at)
    values (
      v_store_id,
      v_page ->> 'key',
      coalesce(v_page ->> 'title', ''),
      v_page -> 'content',
      null,
      0,
      null
    )
    on conflict (store_id, key) do nothing;
  end loop;

  for v_zone in select * from jsonb_array_elements(coalesce(p_zones, '[]'::jsonb))
  loop
    insert into public.shipping_zones (store_id, wilaya_code, home_fee_cents, office_fee_cents)
    values (v_store_id, (v_zone ->> 'wilaya_code')::integer, (v_zone ->> 'home_fee_cents')::integer, (v_zone ->> 'office_fee_cents')::integer)
    on conflict (store_id, wilaya_code) do update
      set home_fee_cents = excluded.home_fee_cents, office_fee_cents = excluded.office_fee_cents;
  end loop;

  insert into public.store_counters (store_id, key) values (v_store_id, 'orders')
  on conflict (store_id, key) do nothing;

  return v_store_id;
end;
$$;

-- --- draft → publish (optimistic versioning) ---------------------------------------------
create or replace function public.fn_publish_page(
  p_store_id uuid,
  p_page_key text,
  p_expected_version integer,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_page public.pages%rowtype;
begin
  -- Service-role only: these lifecycle operations are privileged and must be
  -- driven exclusively by the platform backend, never by a client session.
  if coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
    select * into v_page from public.pages where store_id = p_store_id and key = p_page_key for update;
  if not found then raise exception 'PAGE_NOT_FOUND'; end if;
  if v_page.version <> p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  if v_page.content is null then raise exception 'NO_DRAFT_TO_PUBLISH'; end if;

  update public.pages
     set published_content = content, version = version + 1, published_at = now(), updated_at = now()
   where id = v_page.id
  returning * into v_page;

  insert into public.page_versions (store_id, page_key, version, content, published_by)
  values (p_store_id, p_page_key, v_page.version, v_page.content, p_actor_id);

  update public.stores
     set published_version = (select coalesce(max(version), 0) from public.pages where store_id = p_store_id),
         updated_at = now()
   where id = p_store_id;

  return jsonb_build_object('version', v_page.version, 'published_at', v_page.published_at);
end;
$$;

-- --- restore a previous published version (becomes a NEW version) --------------------------
create or replace function public.fn_restore_page_version(
  p_store_id uuid,
  p_page_key text,
  p_version integer,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_pv public.page_versions%rowtype;
  v_page public.pages%rowtype;
  v_new_version integer;
begin
  -- Service-role only: these lifecycle operations are privileged and must be
  -- driven exclusively by the platform backend, never by a client session.
  if coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
    select * into v_pv from public.page_versions
   where store_id = p_store_id and page_key = p_page_key and version = p_version;
  if not found then raise exception 'VERSION_NOT_FOUND'; end if;

  select * into v_page from public.pages where store_id = p_store_id and key = p_page_key for update;
  if not found then raise exception 'PAGE_NOT_FOUND'; end if;

  v_new_version := v_page.version + 1;
  update public.pages
     set content = v_pv.content, published_content = v_pv.content,
         version = v_new_version, published_at = now(), updated_at = now()
   where id = v_page.id;

  insert into public.page_versions (store_id, page_key, version, content, published_by)
  values (p_store_id, p_page_key, v_new_version, v_pv.content, p_actor_id);

  return jsonb_build_object('version', v_new_version, 'restored_from', p_version);
end;
$$;

-- --- safe store duplication (config + catalog only — NO customers/orders/secrets) -------------
create or replace function public.fn_copy_store(
  p_source_store_id uuid,
  p_new_slug text,
  p_new_name text,
  p_actor_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_src public.stores%rowtype;
  v_dst uuid;
  v_cat_map jsonb;
  v_prod_map jsonb;
begin
  -- Service-role only: these lifecycle operations are privileged and must be
  -- driven exclusively by the platform backend, never by a client session.
  if coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
    select * into v_src from public.stores where id = p_source_store_id and deleted_at is null;
  if not found then raise exception 'STORE_NOT_FOUND'; end if;
  if p_new_slug !~ '^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$' then raise exception 'INVALID_SLUG'; end if;
  if exists (select 1 from public.stores where slug = p_new_slug and deleted_at is null) then
    raise exception 'SLUG_TAKEN';
  end if;

  insert into public.stores (organization_id, name, slug, website_type, template_key, language, currency, status, settings, published_version, created_by)
  values (v_src.organization_id, p_new_name, p_new_slug, v_src.website_type, v_src.template_key, v_src.language, v_src.currency, 'draft', v_src.settings, 0, p_actor_id)
  returning id into v_dst;

  insert into public.themes (store_id, logo_url, favicon_url, primary_color, secondary_color, background_color, typography, button_shape, announcement)
  select v_dst, logo_url, favicon_url, primary_color, secondary_color, background_color, typography, button_shape, announcement
    from public.themes where store_id = v_src.id;

  -- categories (pass 1: copy without parent; pass 2: remap parent + visibility)
  insert into public.categories (store_id, name, slug, description, image_url, position, is_visible)
  select v_dst, name, slug, description, image_url, position, false
    from public.categories where store_id = v_src.id and deleted_at is null order by position;

  select coalesce(jsonb_object_agg(a.id::text, b.id::text), '{}'::jsonb) into v_cat_map
    from (select id, slug from public.categories where store_id = v_src.id and deleted_at is null) a
    join (select id, slug from public.categories where store_id = v_dst) b on a.slug = b.slug;

  update public.categories dst
     set parent_id = (v_cat_map ->> src.parent_id::text)::uuid, is_visible = src.is_visible
    from (select id, parent_id, slug, is_visible from public.categories where store_id = v_src.id and deleted_at is null) src
   where dst.store_id = v_dst and dst.slug = src.slug;

  -- products (inactive by default — merchant/super admin activates)
  insert into public.products (store_id, category_id, name, slug, description, price_cents, compare_at_price_cents, sku, stock, low_stock_threshold, is_active, is_featured, seo_title, seo_description, position)
  select v_dst, (v_cat_map ->> category_id::text)::uuid, name, slug, description, price_cents, compare_at_price_cents, sku, stock, low_stock_threshold, false, false, seo_title, seo_description, position
    from public.products where store_id = v_src.id and deleted_at is null order by position;

  select coalesce(jsonb_object_agg(a.id::text, b.id::text), '{}'::jsonb) into v_prod_map
    from (select id, slug from public.products where store_id = v_src.id and deleted_at is null) a
    join (select id, slug from public.products where store_id = v_dst) b on a.slug = b.slug;

  insert into public.product_variants (product_id, name, options, price_cents, sku, stock, is_active, position)
  select (v_prod_map ->> pv.product_id::text)::uuid, pv.name, pv.options, pv.price_cents, pv.sku, pv.stock, false, pv.position
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
   where p.store_id = v_src.id and p.deleted_at is null;

  insert into public.product_images (product_id, store_id, url, alt, position)
  select (v_prod_map ->> pi.product_id::text)::uuid, v_dst, pi.url, pi.alt, pi.position
    from public.product_images pi
    join public.products p on p.id = pi.product_id
   where p.store_id = v_src.id and p.deleted_at is null;

  insert into public.quantity_offers (store_id, product_id, min_quantity, total_price_cents, label, is_active, position)
  select v_dst, case when qo.product_id is null then null else (v_prod_map ->> qo.product_id::text)::uuid end,
         qo.min_quantity, qo.total_price_cents, qo.label, false, qo.position
    from public.quantity_offers qo where qo.store_id = v_src.id;

  insert into public.shipping_zones (store_id, wilaya_code, home_fee_cents, office_fee_cents, is_active)
  select v_dst, wilaya_code, home_fee_cents, office_fee_cents, is_active
    from public.shipping_zones where store_id = v_src.id;

  insert into public.pages (store_id, key, title, seo_title, seo_description, content, published_content, version, published_at)
  select v_dst, key, title, seo_title, seo_description, content, published_content, version, published_at
    from public.pages where store_id = v_src.id;

  insert into public.marketing_integrations (store_id, provider_key, is_active, config, events_enabled, position)
  select v_dst, provider_key, false, config, events_enabled, position
    from public.marketing_integrations where store_id = v_src.id;

  insert into public.faq_items (store_id, question, answer, position, is_visible)
  select v_dst, question, answer, position, is_visible
    from public.faq_items where store_id = v_src.id and deleted_at is null;

  insert into public.store_counters (store_id, key) values (v_dst, 'orders')
  on conflict (store_id, key) do nothing;

  return v_dst;
end;
$$;
-- <<< END 20260918000010_functions_store_lifecycle.sql <<<


-- >>> BEGIN 20260918000011_rls.sql >>>
-- ===========================================================================
-- FlexiGo — 0011: Row Level Security policies
--
-- SECURITY MODEL (defense in depth):
-- * RLS is ENABLED on every tenant-sensitive table.
-- * Merchants reach rows ONLY through store_members (membership model).
-- * Public storefront reads are granted to the ANON role ONLY (the
--   storefront has no customer accounts; server-side storefront code uses
--   the anon client for public reads). They are limited to ACTIVE stores
--   and PUBLISHED / APPROVED / ACTIVE records — drafts, suspended stores
--   and other tenants' data are never visible. A logged-in merchant
--   session therefore NEVER sees another tenant's rows.
-- * Platform admins (Super Admin) get cross-tenant READ-only policies
--   (fn_is_platform_admin) for the platform console; tenant mutations are
--   always service-role routes with application-level checks + audit.
-- * platform_admins, shipping_integrations, google_sheet_integrations
--   (encrypted credentials), store_counters and platform_settings have NO
--   policies: default deny, service key only.
-- * Write policies are deliberately restrictive: membership changes,
--   platform roles, integrations credentials, logs and deletes (soft-only)
--   happen exclusively through server-side service-role operations.
-- * Helper functions are SECURITY DEFINER (read store_members as the table
--   owner) which also prevents RLS recursion.
-- ===========================================================================

-- ===========================================================================
-- profiles
-- Docs: a user reads their own profile, and the profiles of teammates in
-- stores they belong to (team page). Users can insert/update only their own
-- row (self-bootstrap on first login; the DB trigger also creates it).
-- ===========================================================================
alter table public.profiles enable row level security;

create policy "profiles_select_own_and_team" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.store_members sm
      where sm.user_id = public.profiles.id
        and public.fn_has_store_membership(auth.uid(), sm.store_id)
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ===========================================================================
-- organizations
-- Docs: visible only to members of at least one store of the organization.
-- Writes are service-only (Super Admin creates clients).
-- ===========================================================================
alter table public.organizations enable row level security;

create policy "organizations_select_member" on public.organizations
  for select to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.organization_id = public.organizations.id
        and public.fn_has_store_membership(auth.uid(), s.id)
    )
  );

-- ===========================================================================
-- stores
-- Docs:
--  * any visitor (anon/authenticated) sees ACTIVE, not-deleted stores
--    (public identity data — name/slug/status/settings used by storefront);
--  * authenticated members (or Super Admin with an open support session)
--    see any status of stores they can access.
-- Writes (status changes, settings) are service-only.
-- ===========================================================================
alter table public.stores enable row level security;

create policy "stores_public_read" on public.stores
  for select to anon
  using (status = 'active' and deleted_at is null);

create policy "stores_member_read" on public.stores
  for select to authenticated
  using (public.fn_can_access_store(auth.uid(), id));

-- ===========================================================================
-- store_members
-- Docs: visible to the user themself and to members of the same store
-- (team management). NO write policies: invites, role changes and removals
-- are performed server-side (service role) after owner authorization —
-- this removes any path to self-escalation at the database level.
-- ===========================================================================
alter table public.store_members enable row level security;

create policy "store_members_select" on public.store_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_has_store_membership(auth.uid(), store_id)
  );

-- ===========================================================================
-- platform_admins
-- Docs: NO policies at all (default deny). Client sessions can neither read
-- nor write platform roles. SUPER_ADMIN is never assignable from any
-- merchant-facing surface — see lib/auth/admin-context.ts.
-- ===========================================================================
alter table public.platform_admins enable row level security;

-- ===========================================================================
-- domains
-- Docs: visible to OWNER/MANAGER of the store. Management (add/verify/
-- primary/remove) is service-only.
-- ===========================================================================
alter table public.domains enable row level security;

create policy "domains_select" on public.domains
  for select to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- templates (platform design assets — public metadata)
-- ===========================================================================
alter table public.templates enable row level security;

create policy "templates_platform_admin_read" on public.templates
  for select to authenticated
  using (public.fn_is_platform_admin(auth.uid()));

-- ===========================================================================
-- themes
-- Docs: public for active stores (storefront needs it); members of any
-- status can read their own; appearance edits by content roles.
-- ===========================================================================
alter table public.themes enable row level security;

create policy "themes_public_read" on public.themes
  for select to anon
  using (
    exists (
      select 1 from public.stores s
      where s.id = public.themes.store_id and s.status = 'active' and s.deleted_at is null
    )
  );

create policy "themes_member_read" on public.themes
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "themes_member_update" on public.themes
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- categories
-- Docs: public sees visible + not-deleted of active stores. CRUD for
-- content roles; deletion is soft-only at the app layer (no delete policy).
-- ===========================================================================
alter table public.categories enable row level security;

create policy "categories_public_read" on public.categories
  for select to anon
  using (
    is_visible and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.categories.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "categories_member_read" on public.categories
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "categories_member_insert" on public.categories
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "categories_member_update" on public.categories
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- products
-- Docs: public reads active + not-deleted products of active stores.
-- Writes for content roles. No delete policy (soft delete only).
-- ===========================================================================
alter table public.products enable row level security;

create policy "products_public_read" on public.products
  for select to anon
  using (
    is_active and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.products.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "products_member_read" on public.products
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "products_member_insert" on public.products
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "products_member_update" on public.products
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- product_variants / product_images
-- Docs: follow the parent product's public state; writes for content roles.
-- ===========================================================================
alter table public.product_variants enable row level security;

create policy "variants_public_read" on public.product_variants
  for select to anon
  using (
    is_active and
    exists (
      select 1 from public.products p
      where p.id = public.product_variants.product_id
        and p.is_active and p.deleted_at is null
        and exists (select 1 from public.stores s where s.id = p.store_id and s.status = 'active' and s.deleted_at is null)
    )
  );

create policy "variants_member_read" on public.product_variants
  for select to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_membership(auth.uid(), p.store_id))
  );

create policy "variants_member_write" on public.product_variants
  for insert to authenticated
  with check (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_role(auth.uid(), p.store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  );

create policy "variants_member_update" on public.product_variants
  for update to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_role(auth.uid(), p.store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  )
  with check (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_role(auth.uid(), p.store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  );

alter table public.product_images enable row level security;

create policy "images_public_read" on public.product_images
  for select to anon
  using (
    exists (
      select 1 from public.stores s where s.id = public.product_images.store_id and s.status = 'active' and s.deleted_at is null
    )
  );

create policy "images_member_read" on public.product_images
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "images_member_write" on public.product_images
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "images_member_update" on public.product_images
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- quantity_offers
-- Docs: pricing is public (shown on product pages); management by content
-- roles. (Offers affect real revenue — price.changed is audited at app layer.)
-- ===========================================================================
alter table public.quantity_offers enable row level security;

create policy "offers_public_read" on public.quantity_offers
  for select to anon
  using (
    is_active and
    exists (select 1 from public.stores s where s.id = public.quantity_offers.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "offers_member_read" on public.quantity_offers
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "offers_member_insert" on public.quantity_offers
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "offers_member_update" on public.quantity_offers
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- shipping_zones
-- Docs: fees are public (checkout displays them); management by commerce
-- roles (OWNER/MANAGER/ORDER_MANAGER).
-- ===========================================================================
alter table public.shipping_zones enable row level security;

create policy "zones_public_read" on public.shipping_zones
  for select to anon
  using (
    is_active and
    exists (select 1 from public.stores s where s.id = public.shipping_zones.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "zones_member_read" on public.shipping_zones
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "zones_member_insert" on public.shipping_zones
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "zones_member_update" on public.shipping_zones
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- reviews
-- Docs: public sees APPROVED reviews of active stores; moderation (approve,
-- soft-delete) by content roles.
-- ===========================================================================
alter table public.reviews enable row level security;

create policy "reviews_public_read" on public.reviews
  for select to anon
  using (
    is_approved and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.reviews.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "reviews_member_read" on public.reviews
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "reviews_member_insert" on public.reviews
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "reviews_member_update" on public.reviews
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- faq_items
-- ===========================================================================
alter table public.faq_items enable row level security;

create policy "faq_public_read" on public.faq_items
  for select to anon
  using (
    is_visible and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.faq_items.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "faq_member_read" on public.faq_items
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "faq_member_insert" on public.faq_items
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "faq_member_update" on public.faq_items
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- pages
-- Docs: the live site reads ONLY published_content of active stores;
-- members (any status) read their store's pages incl. drafts; edits by
-- content roles. Page creation happens server-side at store creation.
-- ===========================================================================
alter table public.pages enable row level security;

create policy "pages_public_read" on public.pages
  for select to anon
  using (
    published_content is not null and
    exists (select 1 from public.stores s where s.id = public.pages.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "pages_member_read" on public.pages
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "pages_member_update" on public.pages
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- page_versions (history)
-- Docs: members can read history (restore UI); inserts come from the
-- publish/restore functions (security definer).
-- ===========================================================================
alter table public.page_versions enable row level security;

create policy "page_versions_member_read" on public.page_versions
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

-- ===========================================================================
-- customers
-- Docs: commerce roles only (ORDER MANAGER included). Soft delete only.
-- ===========================================================================
alter table public.customers enable row level security;

create policy "customers_select" on public.customers
  for select to authenticated
  using (public.fn_can_access_store(auth.uid(), store_id));

create policy "customers_insert" on public.customers
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "customers_update" on public.customers
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- orders
-- Docs: commerce roles only. Orders are created by fn_place_cod_order
-- (security definer); merchants update status/notes. NO delete policy —
-- cancellation is a status change (audited).
-- ===========================================================================
alter table public.orders enable row level security;

create policy "orders_select" on public.orders
  for select to authenticated
  using (public.fn_can_access_store(auth.uid(), store_id));

create policy "orders_insert" on public.orders
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "orders_update" on public.orders
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- order_items / order_status_history
-- ===========================================================================
alter table public.order_items enable row level security;

create policy "order_items_select" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.order_items.order_id
        and public.fn_can_access_store(auth.uid(), o.store_id)
    )
  );

create policy "order_items_insert" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = public.order_items.order_id
        and public.fn_has_store_role(auth.uid(), o.store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER'])
    )
  );

alter table public.order_status_history enable row level security;

create policy "history_select" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.order_status_history.order_id
        and public.fn_can_access_store(auth.uid(), o.store_id)
    )
  );

create policy "history_insert" on public.order_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = public.order_status_history.order_id
        and public.fn_has_store_role(auth.uid(), o.store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER'])
    )
  );

-- ===========================================================================
-- inventory_movements (commerce: OWNER/MANAGER)
-- ===========================================================================
alter table public.inventory_movements enable row level security;

create policy "movements_select" on public.inventory_movements
  for select to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

create policy "movements_insert" on public.inventory_movements
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- shipping_integrations / google_sheet_integrations
-- Docs: NO policies (default deny) — they contain ENCRYPTED credentials.
-- The merchant API reads/writes them server-side (service role), decrypts
-- in memory, masks in responses. Direct client access is impossible.
-- ===========================================================================
alter table public.shipping_integrations enable row level security;
alter table public.google_sheet_integrations enable row level security;

-- ===========================================================================
-- shipments
-- ===========================================================================
alter table public.shipments enable row level security;

create policy "shipments_select" on public.shipments
  for select to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "shipments_insert" on public.shipments
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "shipments_update" on public.shipments
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- marketing_integrations
-- Docs: config holds public identifiers (pixel IDs) — readable by members;
-- writes restricted to OWNER/MANAGER; values validated (no code fields).
-- ===========================================================================
alter table public.marketing_integrations enable row level security;

create policy "marketing_select" on public.marketing_integrations
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "marketing_insert" on public.marketing_integrations
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

create policy "marketing_update" on public.marketing_integrations
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- whatsapp_integrations
-- ===========================================================================
alter table public.whatsapp_integrations enable row level security;

create policy "whatsapp_select" on public.whatsapp_integrations
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "whatsapp_insert" on public.whatsapp_integrations
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

create policy "whatsapp_update" on public.whatsapp_integrations
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- wilayas (public reference data)
-- ===========================================================================
alter table public.wilayas enable row level security;

create policy "wilayas_public_read" on public.wilayas
  for select to anon
  using (true);

-- ===========================================================================
-- audit_logs / system_events / integration_logs / support_sessions /
-- store_counters / platform_settings
-- Docs: cross-tenant read for platform admins (see admin policies below);
-- store_counters and platform_settings stay service-only (no policies).
-- ===========================================================================
alter table public.audit_logs enable row level security;
alter table public.system_events enable row level security;
alter table public.integration_logs enable row level security;
alter table public.support_sessions enable row level security;
alter table public.store_counters enable row level security;
alter table public.platform_settings enable row level security;


-- ===========================================================================
-- PLATFORM ADMIN READ POLICIES (Super Admin console)
-- Docs: the platform owner needs cross-tenant READ visibility (dashboard,
-- orders, health, audit, support). This is read-only: every mutation of
-- tenant data happens through service-role routes that re-check
-- authorization and write audit logs. These policies use
-- fn_is_platform_admin() (security definer, reads platform_admins which
-- itself has NO policies — no RLS recursion).
-- ===========================================================================
create policy "stores_platform_admin_read" on public.stores
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "orders_platform_admin_read" on public.orders
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "order_items_platform_admin_read" on public.order_items
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "history_platform_admin_read" on public.order_status_history
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "customers_platform_admin_read" on public.customers
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "products_platform_admin_read" on public.products
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "variants_platform_admin_read" on public.product_variants
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "images_platform_admin_read" on public.product_images
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "categories_platform_admin_read" on public.categories
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "offers_platform_admin_read" on public.quantity_offers
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "zones_platform_admin_read" on public.shipping_zones
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "reviews_platform_admin_read" on public.reviews
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "faq_platform_admin_read" on public.faq_items
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "pages_platform_admin_read" on public.pages
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "page_versions_platform_admin_read" on public.page_versions
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "themes_platform_admin_read" on public.themes
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "store_members_platform_admin_read" on public.store_members
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "domains_platform_admin_read" on public.domains
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "profiles_platform_admin_read" on public.profiles
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "organizations_platform_admin_read" on public.organizations
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "shipments_platform_admin_read" on public.shipments
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "movements_platform_admin_read" on public.inventory_movements
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "marketing_platform_admin_read" on public.marketing_integrations
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "whatsapp_platform_admin_read" on public.whatsapp_integrations
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "audit_platform_admin_read" on public.audit_logs
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "system_events_platform_admin_read" on public.system_events
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "integration_logs_platform_admin_read" on public.integration_logs
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "support_sessions_platform_admin_read" on public.support_sessions
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
-- ===========================================================================
-- Storage policies (public store-assets bucket)
-- On Supabase the `storage` schema exists; locally the block is skipped and
-- uploads are still fully validated server-side (lib/storage.ts).
-- ===========================================================================
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('store-assets', 'store-assets', true)
    on conflict (id) do update set public = true;

    -- Public read of assets of ACTIVE stores (folder path starts with store id)
    drop policy if exists "store_assets_public_read" on storage.objects;
    create policy "store_assets_public_read" on storage.objects
      for select to anon
      using (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] in (
          select id::text from public.stores where status = 'active' and deleted_at is null
        )
      );

    -- Writes: only for one's OWN stores, commerce/content roles. (In practice
    -- uploads go through the service-role API which validates more deeply;
    -- this policy is the direct-client safety net.)
    drop policy if exists "store_assets_member_write" on storage.objects;
    create policy "store_assets_member_write" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'store-assets'
        and public.fn_has_store_role(auth.uid(), ((storage.foldername(name))[1])::uuid, array['OWNER', 'MANAGER', 'CONTENT_EDITOR'])
      );

    drop policy if exists "store_assets_member_update" on storage.objects;
    create policy "store_assets_member_update" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'store-assets'
        and public.fn_has_store_role(auth.uid(), ((storage.foldername(name))[1])::uuid, array['OWNER', 'MANAGER', 'CONTENT_EDITOR'])
      );
  end if;
end $$;
-- <<< END 20260918000011_rls.sql <<<


-- >>> BEGIN 20260918000012_triggers_indexes.sql >>>
-- ===========================================================================
-- FlexiGo — 0012: triggers + indexes
-- ===========================================================================

-- --- updated_at triggers -----------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'stores', 'categories', 'products',
    'product_variants', 'reviews', 'faq_items', 'pages',
    'shipping_integrations', 'shipments', 'marketing_integrations',
    'google_sheet_integrations', 'whatsapp_integrations', 'customers', 'orders'
  ] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I for each row execute function public.fn_set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- --- profile bootstrap + membership activation on auth events -----------------
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    drop trigger if exists flexigo_on_new_user on auth.users;
    create trigger flexigo_on_new_user
      after insert on auth.users
      for each row execute function public.fn_on_new_auth_user();
  end if;
end;
$$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'sessions') then
    drop trigger if exists flexigo_on_new_session on auth.sessions;
    create trigger flexigo_on_new_session
      after insert on auth.sessions
      for each row execute function public.fn_on_new_session();
  end if;
end;
$$;

-- --- explicit execute grants (idempotent, mirror Supabase defaults) -----------
grant execute on all functions in schema public to anon, authenticated, service_role;

-- ===========================================================================
-- Indexes (performance: list pages, lookups, tenant scoping)
-- ===========================================================================

create index if not exists stores_status_idx        on public.stores (status);
create index if not exists stores_org_idx           on public.stores (organization_id);

create index if not exists store_members_user_idx   on public.store_members (user_id);
create index if not exists store_members_store_idx  on public.store_members (store_id);

create index if not exists domains_store_idx        on public.domains (store_id) where deleted_at is null;
create index if not exists domains_hostname_idx     on public.domains (lower(hostname));

create index if not exists categories_store_idx     on public.categories (store_id, position) where deleted_at is null;
create index if not exists products_store_idx       on public.products (store_id, position) where deleted_at is null;
create index if not exists products_featured_idx    on public.products (store_id) where is_featured and is_active and deleted_at is null;
create index if not exists products_category_idx    on public.products (category_id) where deleted_at is null;

create index if not exists variants_product_idx     on public.product_variants (product_id, position);
create index if not exists images_product_idx       on public.product_images (product_id, position);
create index if not exists offers_store_idx         on public.quantity_offers (store_id) where is_active;

create index if not exists zones_store_idx          on public.shipping_zones (store_id, wilaya_code);

create index if not exists reviews_store_idx        on public.reviews (store_id, created_at desc) where deleted_at is null;
create index if not exists reviews_product_idx      on public.reviews (product_id) where is_approved and deleted_at is null;
create index if not exists faq_store_idx            on public.faq_items (store_id, position) where deleted_at is null;

create index if not exists pages_store_idx          on public.pages (store_id, key);
create index if not exists page_versions_store_idx  on public.page_versions (store_id, page_key, version desc);

create index if not exists customers_phone_idx      on public.customers (store_id, normalized_phone);
create index if not exists customers_store_idx      on public.customers (store_id, last_order_at desc nulls last) where deleted_at is null;

create index if not exists orders_store_status_idx  on public.orders (store_id, status, created_at desc);
create index if not exists orders_store_created_idx on public.orders (store_id, created_at desc);
create index if not exists orders_customer_idx      on public.orders (customer_id);
create index if not exists order_items_order_idx    on public.order_items (order_id);
create index if not exists history_order_idx        on public.order_status_history (order_id, created_at);
create index if not exists movements_store_idx      on public.inventory_movements (store_id, created_at desc);

create index if not exists shipments_order_idx      on public.shipments (order_id);
create index if not exists shipments_store_idx      on public.shipments (store_id, created_at desc);

create index if not exists audit_store_idx          on public.audit_logs (store_id, created_at desc);
create index if not exists audit_actor_idx          on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_action_idx         on public.audit_logs (action, created_at desc);
create index if not exists sys_events_idx           on public.system_events (created_at desc);
create index if not exists sys_events_store_idx     on public.system_events (store_id, created_at desc);
create index if not exists integ_logs_idx           on public.integration_logs (store_id, created_at desc);
create index if not exists support_sessions_idx     on public.support_sessions (admin_user_id, ended_at);
-- <<< END 20260918000012_triggers_indexes.sql <<<


-- >>> BEGIN 20260918000013_seed_templates.sql >>>
-- ===========================================================================
-- FlexiGo — 0013: system templates (seeded, platform-managed)
-- Screenshots live in /public/images/templates (generated design previews).
-- ===========================================================================

insert into public.templates (key, name, description, website_types, is_system, screenshot_url) values
  (
    'ecommerce-modern',
    'Ecommerce Modern',
    'Boutique COD moderne et polyvalente : hero, collections, meilleures ventes, avis et FAQ.',
    array['ecommerce'],
    true,
    '/images/templates/ecommerce-modern.png'
  ),
  (
    'fashion-luxury',
    'Fashion Luxury',
    'Style élégant pour mode, hijab et vêtements premium. Typographie fine, tons sobres.',
    array['ecommerce'],
    true,
    '/images/templates/fashion-luxury.png'
  ),
  (
    'single-product',
    'Single Product COD',
    'Landing page de conversion pour un produit, optimisée Meta/TikTok Ads avec commande à la livraison.',
    array['single_product'],
    true,
    '/images/templates/single-product.png'
  ),
  (
    'portfolio',
    'Portfolio Professional',
    'Vitrine professionnelle : médecins, architectes, consultants, agences, photographes…',
    array['portfolio'],
    true,
    '/images/templates/portfolio.png'
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  website_types = excluded.website_types,
  screenshot_url = excluded.screenshot_url;
-- <<< END 20260918000013_seed_templates.sql <<<


-- >>> BEGIN 20260918000014_templates_v2_telegram.sql >>>
-- ===========================================================================
-- FlexiGo — 0014: 8 new production templates + Telegram + Google Sheets
-- ===========================================================================

-- Insert 8 new production templates
insert into public.templates (key, name, description, website_types, is_system, screenshot_url) values
  (
    'elegance',
    'ELEGANCE',
    'Luxe éditorial pour mode, hijab, abaya — beige/taupe/noir/ivoire, imagerie fashion large, typographie raffinée, cartes collection premium. Sections: Hero/New arrivals/Collections/Best sellers/Lifestyle banner/Products/Delivery benefits/Reviews/FAQ/Social/Footer',
    array['ecommerce'],
    true,
    '/images/templates/elegance.svg'
  ),
  (
    'glow',
    'GLOW',
    'Clean, doux, nude/pastel/blanc, cartes arrondies, éditorial beauté, sections avant/après, focus bénéfices. Sections: Hero/Bestsellers/Benefits/Categories/Before-after/Routine/Products/Reviews/FAQ/COD CTA',
    array['ecommerce'],
    true,
    '/images/templates/glow.svg'
  ),
  (
    'tech',
    'TECH',
    'Dark, graphite, bleu électrique, cartes techniques, badges spécifications. Sections: Hero/Categories/Trending products/Features-specs/Promotion banner/Comparison/Reviews/COD benefits/FAQ',
    array['ecommerce'],
    true,
    '/images/templates/tech.svg'
  ),
  (
    'casa',
    'CASA',
    'Chaleureux, crème, olive, terracotta, imagerie lifestyle. Sections: Hero/Categories/Best sellers/Usage-lifestyle/Promotion banner/Products/Benefits/Reviews/FAQ',
    array['ecommerce'],
    true,
    '/images/templates/casa.svg'
  ),
  (
    'little',
    'LITTLE',
    'Pastel doux, arrondi, amical, confiance/sécurité. Sections: Hero/Age-category/New arrivals/Popular products/Promo banner/Quality-safety/Parent reviews/FAQ',
    array['ecommerce'],
    true,
    '/images/templates/little.svg'
  ),
  (
    'active',
    'ACTIVE',
    'Dynamique, noir/blanc, accent vif, typographie forte, mouvement. Sections: Hero/Categories/Best sellers/Goals-use cases/Products/Stats/Reviews/Promo/FAQ',
    array['ecommerce'],
    true,
    '/images/templates/active.svg'
  ),
  (
    'market',
    'MARKET',
    'Template ultra-polyvalent pour magasin général algérien COD — commercial, clean, rapide, badges offres visibles, orienté conversion mobile. Sections: Promo bar/Hero/Categories/Trending/Flash offers/New arrivals/Products/Reviews/FAQ',
    array['ecommerce'],
    true,
    '/images/templates/market.svg'
  ),
  (
    'convert',
    'CONVERT',
    'Landing page COD ultra-optimisée pour trafic payant Meta/TikTok — galerie produit/vidéo, problème/solution, bénéfices, comment ça marche, avant/après, preuve sociale, offres quantité, avis, FAQ, formulaire COD, sticky CTA. Spécialement conversion mobile.',
    array['single_product'],
    true,
    '/images/templates/convert.svg'
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  website_types = excluded.website_types,
  screenshot_url = excluded.screenshot_url;

-- ===========================================================================
-- Telegram integrations per store (encrypted bot token)
-- ===========================================================================
create table if not exists public.telegram_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  bot_token_encrypted text not null, -- fxenc1.* encrypted
  chat_id text not null,
  enabled_events jsonb not null default '["new_order"]'::jsonb, -- new_order, cancelled, delivered, low_stock, delivery_error
  is_active boolean not null default true,
  status text not null default 'pending' check (status in ('pending','connected','error')),
  last_error text,
  last_test_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.telegram_integrations enable row level security;

-- Policies: tenant isolation via store_members (OWNER/MANAGER can read)
create policy "telegram_select_own"
  on public.telegram_integrations for select
  using (
    exists (
      select 1 from public.store_members sm
      where sm.store_id = telegram_integrations.store_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
    or public.fn_is_platform_admin(auth.uid())
  );

create policy "telegram_admin_all"
  on public.telegram_integrations for all
  using (public.fn_is_platform_admin(auth.uid()))
  with check (public.fn_is_platform_admin(auth.uid()));

-- Trigger updated_at
create or replace function public.tg_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_telegram_updated_at on public.telegram_integrations;
create trigger trg_telegram_updated_at before update on public.telegram_integrations
  for each row execute function public.tg_updated_at();

-- ===========================================================================
-- Google Sheets per-site (encrypted credentials)
-- ===========================================================================
create table if not exists public.google_sheets_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  spreadsheet_id text not null,
  credentials_encrypted text not null, -- service account JSON encrypted fxenc1.*
  selected_columns jsonb not null default '[]'::jsonb,
  sync_enabled boolean not null default false,
  sync_events jsonb not null default '["new_order"]'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  status text not null default 'pending' check (status in ('pending','connected','error','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_sheets_integrations enable row level security;

create policy "gsheets_select_own"
  on public.google_sheets_integrations for select
  using (
    exists (
      select 1 from public.store_members sm
      where sm.store_id = google_sheets_integrations.store_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
    or public.fn_is_platform_admin(auth.uid())
  );

create policy "gsheets_admin_all"
  on public.google_sheets_integrations for all
  using (public.fn_is_platform_admin(auth.uid()))
  with check (public.fn_is_platform_admin(auth.uid()));

drop trigger if exists trg_gsheets_updated_at on public.google_sheets_integrations;
create trigger trg_gsheets_updated_at before update on public.google_sheets_integrations
  for each row execute function public.tg_updated_at();

-- ===========================================================================
-- Indexes
-- ===========================================================================
create index if not exists idx_telegram_store on public.telegram_integrations(store_id);
create index if not exists idx_gsheets_store on public.google_sheets_integrations(store_id);
-- <<< END 20260918000014_templates_v2_telegram.sql <<<


-- >>> BEGIN 20260918000015_dashboard_i18n.sql >>>
-- Dashboard i18n per user preference (independent from storefront language)
alter table public.profiles add column if not exists dashboard_language text not null default 'fr' check (dashboard_language in ('fr','ar','en'));
alter table public.profiles add column if not exists dashboard_language_updated_at timestamptz not null default now();

-- Function to update timestamp
create or replace function public.profiles_dashboard_lang_updated() returns trigger language plpgsql as $$
begin
  new.dashboard_language_updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_dashboard_lang on public.profiles;
create trigger trg_profiles_dashboard_lang before update of dashboard_language on public.profiles
  for each row execute function public.profiles_dashboard_lang_updated();
-- <<< END 20260918000015_dashboard_i18n.sql <<<


-- >>> BEGIN 20260918000016_finish_flow_hardening.sql >>>
-- ===========================================================================
-- FlexiGo — 0016: finish-flow + security restoration
-- ===========================================================================
-- Restores production hardening after the product pivot, makes client account
-- optional at site-creation time, unifies Google Sheets storage, and expands
-- shipping provider keys without inventing third-party endpoints.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) Shipping provider registry: allow all UI-supported provider keys.
-- ---------------------------------------------------------------------------
alter table public.shipping_integrations
  drop constraint if exists shipping_integrations_provider_key_check;

alter table public.shipping_integrations
  add constraint shipping_integrations_provider_key_check
  check (provider_key in ('manual','navex','yalidine','ecotrack','zr','generic','mock'));

-- ---------------------------------------------------------------------------
-- 2) Unify Google Sheets integration table.
-- Keep google_sheet_integrations as the canonical table used by the app.
-- Migrate data from the accidental plural table if it exists, then remove it.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.google_sheets_integrations') is not null then
    insert into public.google_sheet_integrations (
      store_id,
      spreadsheet_id,
      credential_encrypted,
      fields,
      is_active,
      last_synced_at,
      last_status,
      last_error,
      updated_at
    )
    select
      store_id,
      nullif(spreadsheet_id, ''),
      nullif(credentials_encrypted, ''),
      coalesce(
        (
          select array_agg(value::text)
          from jsonb_array_elements_text(coalesce(selected_columns, '[]'::jsonb)) value
        ),
        '{}'::text[]
      ),
      sync_enabled,
      last_sync_at,
      case
        when status = 'connected' then 'success'
        when status = 'error' then 'failure'
        else null
      end,
      last_error,
      updated_at
    from public.google_sheets_integrations
    on conflict (store_id) do update set
      spreadsheet_id = coalesce(excluded.spreadsheet_id, public.google_sheet_integrations.spreadsheet_id),
      credential_encrypted = coalesce(excluded.credential_encrypted, public.google_sheet_integrations.credential_encrypted),
      fields = case when cardinality(excluded.fields) > 0 then excluded.fields else public.google_sheet_integrations.fields end,
      is_active = excluded.is_active,
      last_synced_at = coalesce(excluded.last_synced_at, public.google_sheet_integrations.last_synced_at),
      last_status = coalesce(excluded.last_status, public.google_sheet_integrations.last_status),
      last_error = coalesce(excluded.last_error, public.google_sheet_integrations.last_error),
      updated_at = greatest(excluded.updated_at, public.google_sheet_integrations.updated_at);

    drop table public.google_sheets_integrations;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Client account can be assigned later.
-- Replace fn_create_store so p_owner_user_id may be NULL. When NULL, the store
-- is created without membership; Super Admin can invite/attach the owner later.
-- ---------------------------------------------------------------------------
create or replace function public.fn_create_store(
  p_organization_id uuid,
  p_name text,
  p_slug text,
  p_website_type text,
  p_template_key text,
  p_language text,
  p_currency text,
  p_identity jsonb,
  p_settings jsonb,
  p_pages jsonb,
  p_zones jsonb,
  p_owner_user_id uuid,
  p_creator_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_store_id uuid;
  v_page jsonb;
  v_zone jsonb;
begin
  if coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$' then
    raise exception 'INVALID_SLUG';
  end if;
  if p_website_type not in ('ecommerce', 'single_product', 'portfolio') then
    raise exception 'INVALID_TYPE';
  end if;
  if p_language not in ('fr', 'ar', 'en') then raise exception 'INVALID_LANGUAGE'; end if;
  if not exists (select 1 from public.templates where key = p_template_key) then
    raise exception 'TEMPLATE_NOT_FOUND';
  end if;
  if exists (select 1 from public.stores where slug = p_slug and deleted_at is null) then
    raise exception 'SLUG_TAKEN';
  end if;
  if p_owner_user_id is not null and not exists (select 1 from public.profiles where id = p_owner_user_id) then
    raise exception 'OWNER_NOT_FOUND';
  end if;

  insert into public.stores (
    organization_id, name, slug, website_type, template_key, language,
    currency, status, settings, created_by
  ) values (
    p_organization_id, p_name, p_slug, p_website_type, p_template_key,
    p_language, coalesce(p_currency, 'DZD'), 'draft',
    coalesce(
      p_settings,
      '{"contact":{"email":null,"phone":null,"whatsapp":null,"instagram":null,"facebook":null,"tiktok":null,"address":null},"business":{"cod_enabled":true,"reviews_enabled":true,"faq_enabled":true,"allow_negative_stock":false,"max_items_per_order":10}}'::jsonb
    ),
    p_creator_id
  )
  returning id into v_store_id;

  insert into public.themes (
    store_id, logo_url, favicon_url, primary_color, secondary_color,
    background_color, typography, button_shape
  ) values (
    v_store_id,
    nullif(p_identity ->> 'logo_url', ''),
    nullif(p_identity ->> 'favicon_url', ''),
    coalesce(nullif(p_identity ->> 'primary_color', ''), '#1d4ed8'),
    coalesce(nullif(p_identity ->> 'secondary_color', ''), '#f59e0b'),
    nullif(p_identity ->> 'background_color', ''),
    coalesce(nullif(p_identity ->> 'typography', ''), 'modern'),
    coalesce(nullif(p_identity ->> 'button_shape', ''), 'rounded')
  );

  if p_owner_user_id is not null then
    insert into public.store_members (store_id, user_id, role, status, invited_by)
    values (v_store_id, p_owner_user_id, 'OWNER', 'active', p_creator_id)
    on conflict (store_id, user_id) do update
      set role = 'OWNER', status = 'active';
  end if;

  for v_page in select * from jsonb_array_elements(coalesce(p_pages, '[]'::jsonb))
  loop
    insert into public.pages (
      store_id, key, title, content, published_content, version, published_at
    ) values (
      v_store_id,
      v_page ->> 'key',
      coalesce(v_page ->> 'title', ''),
      v_page -> 'content',
      null,
      0,
      null
    )
    on conflict (store_id, key) do nothing;
  end loop;

  for v_zone in select * from jsonb_array_elements(coalesce(p_zones, '[]'::jsonb))
  loop
    insert into public.shipping_zones (
      store_id, wilaya_code, home_fee_cents, office_fee_cents
    ) values (
      v_store_id,
      (v_zone ->> 'wilaya_code')::integer,
      (v_zone ->> 'home_fee_cents')::integer,
      (v_zone ->> 'office_fee_cents')::integer
    )
    on conflict (store_id, wilaya_code) do update
      set home_fee_cents = excluded.home_fee_cents,
          office_fee_cents = excluded.office_fee_cents;
  end loop;

  insert into public.store_counters (store_id, key)
  values (v_store_id, 'orders')
  on conflict (store_id, key) do nothing;

  return v_store_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Restore hardening: anon must never read pages.content (draft).
-- ---------------------------------------------------------------------------
drop policy if exists "pages_public_read" on public.pages;

revoke select on table public.pages from anon;

grant select (
  id,
  store_id,
  key,
  title,
  seo_title,
  seo_description,
  published_content,
  version,
  published_at,
  updated_at
) on table public.pages to anon;

create policy "pages_public_read" on public.pages
  for select to anon
  using (
    published_content is not null
    and exists (
      select 1 from public.stores s
      where s.id = public.pages.store_id
        and s.status = 'active'
        and s.deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- 5) Restore deny-by-default function EXECUTE privileges.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_place_cod_order'
  loop
    execute format('grant execute on function %s to anon', r.signature);
  end loop;
end $$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'fn_has_store_membership',
        'fn_has_store_role',
        'fn_is_platform_admin',
        'fn_is_support_open',
        'fn_can_access_store'
      )
  loop
    execute format('grant execute on function %s to authenticated', r.signature);
  end loop;
end $$;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke execute on functions from authenticated;
alter default privileges in schema public grant execute on functions to service_role;

-- ---------------------------------------------------------------------------
-- 6) Support-session expiry is authoritative in the database.
-- ---------------------------------------------------------------------------
alter table public.support_sessions
  add column if not exists expires_at timestamptz;

update public.support_sessions
set expires_at = coalesce(expires_at, started_at + interval '8 hours')
where expires_at is null;

alter table public.support_sessions
  alter column expires_at set default (now() + interval '8 hours'),
  alter column expires_at set not null;

create or replace function public.fn_is_support_open(
  p_user_id uuid,
  p_store_id uuid
) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_is_platform_admin(p_user_id)
    and exists (
      select 1
      from public.support_sessions
      where admin_user_id = p_user_id
        and store_id = p_store_id
        and ended_at is null
        and expires_at > now()
    );
$$;

grant execute on function public.fn_is_support_open(uuid, uuid) to authenticated;
grant execute on function public.fn_is_support_open(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 7) Canonical Storage bucket/path: stores/{store_id}/{purpose}/{filename}
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('store-assets', 'store-assets', true)
    on conflict (id) do update set public = true;

    drop policy if exists "store_assets_public_read" on storage.objects;
    create policy "store_assets_public_read" on storage.objects
      for select to anon
      using (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] = 'stores'
        and (storage.foldername(name))[2] in (
          select id::text
          from public.stores
          where status = 'active' and deleted_at is null
        )
      );

    drop policy if exists "store_assets_member_write" on storage.objects;
    create policy "store_assets_member_write" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] = 'stores'
        and public.fn_has_store_role(
          auth.uid(),
          ((storage.foldername(name))[2])::uuid,
          array['OWNER','MANAGER','CONTENT_EDITOR']
        )
      );

    drop policy if exists "store_assets_member_update" on storage.objects;
    create policy "store_assets_member_update" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] = 'stores'
        and public.fn_has_store_role(
          auth.uid(),
          ((storage.foldername(name))[2])::uuid,
          array['OWNER','MANAGER','CONTENT_EDITOR']
        )
      )
      with check (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] = 'stores'
        and public.fn_has_store_role(
          auth.uid(),
          ((storage.foldername(name))[2])::uuid,
          array['OWNER','MANAGER','CONTENT_EDITOR']
        )
      );
  end if;
end $$;
-- <<< END 20260918000016_finish_flow_hardening.sql <<<
