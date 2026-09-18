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
