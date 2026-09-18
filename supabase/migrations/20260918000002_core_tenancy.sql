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
  ('platform_name', '{"value": "FlexiGo"}'),
  ('maintenance_mode', '{"value": false, "message": null}')
on conflict (key) do nothing;
