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
