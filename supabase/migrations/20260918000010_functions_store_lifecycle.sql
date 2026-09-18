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
