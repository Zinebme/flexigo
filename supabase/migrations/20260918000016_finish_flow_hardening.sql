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
