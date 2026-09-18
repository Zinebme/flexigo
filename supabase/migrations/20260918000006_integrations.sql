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
