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
