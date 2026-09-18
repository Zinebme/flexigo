-- ===========================================================================
-- FlexiGo — 0001: extensions + local auth stub
--
-- On Supabase the `auth` schema, auth.* tables and the anon/authenticated/
-- service_role roles already exist — every block below is guarded and
-- becomes a no-op there.
--
-- On plain PostgreSQL (local dev, CI, Docker) we create a minimal stub that
-- honors the SAME contract Supabase uses:
--   * auth.uid() reads the JWT subject from the `request.jwt.claims` GUC
--   * roles anon / authenticated / service_role exist so RLS policies are
--     identical and testable (SET ROLE + SET request.jwt.claims = ...)
-- ===========================================================================

create extension if not exists pgcrypto;

-- --- auth schema (local stub) ---------------------------------------------
do $$ begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    create schema auth;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text unique,
      encrypted_password text,
      email_confirmed_at timestamptz,
      raw_app_meta_data jsonb not null default '{}'::jsonb,
      raw_user_meta_data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;

  if not exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'identities') then
    create table auth.identities (
      id text primary key,
      user_id uuid references auth.users(id) on delete cascade,
      provider text not null default 'email',
      provider_id text,
      identity_data jsonb,
      created_at timestamptz not null default now(),
      last_sign_in_at timestamptz
    );
  end if;

  if not exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'sessions') then
    create table auth.sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

-- auth.uid() — same semantics as Supabase: the JWT subject claim.
-- (outer tag $fx$ differs from the inner $$ to avoid quote collision)
do $fx$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    create function auth.uid() returns uuid
    language sql stable
    as $$
      select coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
        nullif(current_setting('request.jwt.claim.sub', true), '')
      )::uuid
    $$;
  end if;
end
$fx$;

-- --- roles (local stub) -----------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

-- --- grants (mirror Supabase defaults; idempotent) --------------------------
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- auth schema access (mirror Supabase defaults)
--   * service_role: full access (bypassrls) — the only role that manages
--     auth.* rows from our backend;
--   * authenticated: read their OWN auth.users row only (RLS);
--   * anon: no read on auth tables.
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated;
grant select, insert, update, delete on auth.users to service_role;
grant select, insert, update, delete on auth.sessions, auth.identities to service_role;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'auth' and tablename = 'users' and policyname = 'users_select_own') then
    alter table auth.users enable row level security;
    create policy "users_select_own" on auth.users
      for select to authenticated
      using (id = auth.uid());
  end if;
end $$;
