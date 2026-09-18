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
