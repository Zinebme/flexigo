-- ===========================================================================
-- FlexiGo — 0014: security hardening
-- ===========================================================================
-- 1) Prevent public access to draft page content at the column-privilege level.
-- 2) Make function EXECUTE deny-by-default, then allow only intended RPC/helpers.
-- 3) Expire silent support sessions in the database (not only in the cookie).
-- 4) Align Storage policies with the canonical store-assets bucket/path layout.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Public pages: RLS filters rows, not columns. The anon role must NEVER be
-- able to request pages.content (draft). Restrict anon to published columns.
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
      select 1
      from public.stores s
      where s.id = public.pages.store_id
        and s.status = 'active'
        and s.deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- Functions: PostgreSQL grants EXECUTE on functions to PUBLIC by default and
-- migration 0001 also granted broad function privileges to application roles.
-- Revoke globally, then re-grant only the RPC/helpers intentionally exposed.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- Public checkout is the only anonymous RPC intentionally exposed.
do $$
declare
  r record;
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

-- RLS helper functions are required by authenticated policies.
do $$
declare
  r record;
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

-- Future functions should not become callable by PUBLIC automatically.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke execute on functions from authenticated;
alter default privileges in schema public grant execute on functions to service_role;

-- ---------------------------------------------------------------------------
-- Silent support: cookie expiry is not a database security boundary. Store an
-- authoritative expiry and require it in the RLS helper.
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

-- The replacement above occurs after the blanket revoke.
grant execute on function public.fn_is_support_open(uuid, uuid) to authenticated;
grant execute on function public.fn_is_support_open(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Storage: canonical bucket is store-assets and canonical object paths are:
-- stores/{store_id}/{purpose}/{filename}
-- so the tenant id is folder index 2, not index 1.
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
          array['OWNER', 'MANAGER', 'CONTENT_EDITOR']
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
          array['OWNER', 'MANAGER', 'CONTENT_EDITOR']
        )
      )
      with check (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] = 'stores'
        and public.fn_has_store_role(
          auth.uid(),
          ((storage.foldername(name))[2])::uuid,
          array['OWNER', 'MANAGER', 'CONTENT_EDITOR']
        )
      );
  end if;
end $$;
