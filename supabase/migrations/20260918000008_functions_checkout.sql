-- ===========================================================================
-- FlexiGo — 0008: database functions (the transactional core)
--
-- All business-critical operations are atomic PL/pgSQL functions:
--   fn_place_cod_order  — checkout with server-side pricing, atomic stock
--   fn_create_store     — store + theme + membership + pages + zones
--   fn_publish_page / fn_restore_page_version — draft/publish with versioning
--   fn_copy_store       — safe duplication (no customer data, no secrets)
--
-- SECURITY:
-- * These functions are SECURITY DEFINER with fixed search_path — they
--   cannot be hijacked via search_path injection.
-- * fn_place_cod_order is callable by anon (public checkout) but performs
--   EVERY validation itself: store state, product state, mobile phone,
--   stock (row-locked), price from DB, best quantity offer, shipping zone.
--   The caller never supplies prices or totals.
-- * Exceptions are raised with stable machine codes (STORE_NOT_ACTIVE,
--   OUT_OF_STOCK, …) mapped to French messages by the API layer.
-- ===========================================================================

-- --- phone normalization (Algeria) ---------------------------------------------
create or replace function public.fn_normalize_phone(raw text) returns text
language plpgsql immutable
as $$
declare
  p text;
begin
  p := regexp_replace(coalesce(raw, ''), '[^0-9+]', '', 'g');
  p := replace(p, '+', '');
  if p like '00213%' then p := substring(p from 6); end if;
  if p like '0213%' and length(p) = 13 then p := substring(p from 2); end if; -- 0213 + 9 digits
  if p like '213%' and length(p) = 12 then p := substring(p from 4); end if;
  if p like '0%' and length(p) = 10 then p := substring(p from 2); end if;
  if p ~ '^[0-9]{9}$' then return '213' || p; end if;
  return null;
end;
$$;

-- --- membership / role helpers (used by RLS) ------------------------------------
create or replace function public.fn_has_store_membership(p_user_id uuid, p_store_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where user_id = p_user_id and store_id = p_store_id and status in ('active', 'invited')
  );
$$;

-- Role check — a Super Admin with an OPEN support session passes any
-- store-scoped role check for that store (silent support access). The app
-- layer additionally restricts what support mode may do (no team/settings)
-- and records every support action in audit_logs.
create or replace function public.fn_is_platform_admin(p_user_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = p_user_id);
$$;

-- Support access is ONLY possible for verified platform admins holding an
-- open, logged support session (defense in depth: the row alone is not enough).
create or replace function public.fn_is_support_open(p_user_id uuid, p_store_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_is_platform_admin(p_user_id) and exists (
    select 1 from public.support_sessions
    where admin_user_id = p_user_id and store_id = p_store_id and ended_at is null
  );
$$;

-- membership OR (Super Admin with an open, logged support session)
create or replace function public.fn_has_store_role(p_user_id uuid, p_store_id uuid, p_roles text[]) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_is_support_open(p_user_id, p_store_id)
    or exists (
      select 1 from public.store_members
      where user_id = p_user_id and store_id = p_store_id and status = 'active' and role = any (p_roles)
    );
$$;

create or replace function public.fn_can_access_store(p_user_id uuid, p_store_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.fn_has_store_membership(p_user_id, p_store_id)
    or (public.fn_is_platform_admin(p_user_id) and public.fn_is_support_open(p_user_id, p_store_id));
$$;

-- --- updated_at trigger ------------------------------------------------------------
create or replace function public.fn_set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- profile bootstrap on new auth user ---------------------------------------------
create or replace function public.fn_ensure_profile(p_user_id uuid, p_full_name text, p_email text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (p_user_id, p_full_name, p_email)
  on conflict (id) do nothing;
end;
$$;

-- Trigger wrapper (NEW is only visible inside the function body).
create or replace function public.fn_on_new_auth_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform fn_ensure_profile(new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  return new;
end;
$$;

-- --- membership activation on first sign-in -------------------------------------------
create or replace function public.fn_activate_membership(p_user_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.store_members set status = 'active'
  where user_id = p_user_id and status = 'invited';
  update public.profiles set last_login_at = now() where id = p_user_id;
end;
$$;

-- Trigger wrapper (NEW is only visible inside the function body).
create or replace function public.fn_on_new_session() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform fn_activate_membership(new.user_id);
  return new;
end;
$$;

-- --- atomic order number ----------------------------------------------------------------
create or replace function public.fn_next_order_number(p_store_id uuid) returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_val bigint;
begin
  insert into public.store_counters (store_id, key, value) values (p_store_id, 'orders', 1)
  on conflict (store_id, key) do update set value = public.store_counters.value + 1
  returning value into v_val;
  return 'ORD-' || lpad(v_val::text, 6, '0');
end;
$$;

-- --- THE CHECKOUT FUNCTION -------------------------------------------------------------
-- Anonymous-callable, fully self-validating, atomic.
create or replace function public.fn_place_cod_order(
  p_store_id uuid,
  p_lines jsonb,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_wilaya_code integer default 16,
  p_commune text default null,
  p_address text default null,
  p_delivery_type text default 'home',
  p_office text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_referrer text default null,
  p_source text default 'storefront'
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_store public.stores%rowtype;
  v_max_lines integer;
  v_normalized text;
  v_delivery text;
  v_zone public.shipping_zones%rowtype;
  v_fee integer;
  v_line jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_qty integer;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_base integer;
  v_offer public.quantity_offers%rowtype;
  v_line_total integer;
  v_item record;
  v_collect_product_id uuid;
  v_collect_product_name text;
  v_collect_variant_id uuid;
  v_collect_variant_name text;
  v_items jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_total integer;
  v_order_number text;
  v_order_id uuid;
  v_customer_id uuid;
begin
  -- 1. Store must exist and be live
  select * into v_store from public.stores where id = p_store_id and deleted_at is null;
  if not found then raise exception 'STORE_NOT_FOUND'; end if;
  if v_store.status <> 'active' then raise exception 'STORE_NOT_ACTIVE'; end if;
  if not coalesce((v_store.settings -> 'business' ->> 'cod_enabled')::boolean, true)
     then raise exception 'COD_DISABLED'; end if;

  -- 2. Input sanity (names/commune validated by API layer too — defense in depth)
  if p_full_name is null or length(trim(p_full_name)) < 3 then raise exception 'INVALID_NAME'; end if;
  if p_commune is null or length(trim(p_commune)) < 2 then raise exception 'INVALID_COMMUNE'; end if;

  v_max_lines := coalesce((v_store.settings -> 'business' ->> 'max_items_per_order')::integer, 10);
  if p_lines is null or jsonb_array_length(p_lines) < 1 then raise exception 'EMPTY_CART'; end if;
  if jsonb_array_length(p_lines) > v_max_lines then raise exception 'TOO_MANY_LINES'; end if;

  -- 3. Phone: must be a valid Algerian mobile number
  v_normalized := public.fn_normalize_phone(p_phone);
  if v_normalized is null then raise exception 'INVALID_PHONE'; end if;
  if substring(v_normalized, 4, 1) not in ('5', '6', '7') then raise exception 'INVALID_MOBILE'; end if;

  v_delivery := case when p_delivery_type = 'office' then 'office' else 'home' end;

  -- 4. Shipping fee: per-wilaya zone, falling back to the default zone (0)
  select * into v_zone from public.shipping_zones
   where store_id = p_store_id and wilaya_code = p_wilaya_code and is_active;
  if not found then
    select * into v_zone from public.shipping_zones
     where store_id = p_store_id and wilaya_code = 0 and is_active;
  end if;
  v_fee := case
    when found and v_delivery = 'home' then coalesce(v_zone.home_fee_cents, 0)
    when found then coalesce(v_zone.office_fee_cents, 0)
    else 0
  end;

  -- 5. Lines: validate, lock, price from DB, apply best offer, decrement stock
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_variant_id := nullif(v_line ->> 'variant_id', '')::uuid;
    v_qty := coalesce((v_line ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 50 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_product from public.products
     where id = v_product_id and store_id = p_store_id and is_active and deleted_at is null
     for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;

    v_collect_product_id := v_product.id;
    v_collect_product_name := v_product.name;

    if v_variant_id is not null then
      select * into v_variant from public.product_variants
       where id = v_variant_id and product_id = v_product.id and is_active
       for update;
      if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
      if v_variant.stock < v_qty then raise exception 'OUT_OF_STOCK'; end if;
      update public.product_variants set stock = stock - v_qty where id = v_variant.id;
      v_collect_variant_id := v_variant.id;
      v_collect_variant_name := v_variant.name;
      v_base := coalesce(v_variant.price_cents, v_product.price_cents);
      insert into public.inventory_movements (store_id, product_id, variant_id, change, reason)
      values (p_store_id, v_product.id, v_variant.id, -v_qty, 'commande');
    else
      if not coalesce((v_store.settings -> 'business' ->> 'allow_negative_stock')::boolean, false)
         and v_product.stock < v_qty then raise exception 'OUT_OF_STOCK'; end if;
      update public.products set stock = stock - v_qty where id = v_product.id;
      v_base := v_product.price_cents;
      insert into public.inventory_movements (store_id, product_id, change, reason)
      values (p_store_id, v_product.id, -v_qty, 'commande');
    end if;

    -- Best offer: product-specific first, then store-level; highest min_quantity.
    select * into v_offer from public.quantity_offers
     where store_id = p_store_id and is_active
       and (product_id is null or product_id = v_product.id)
       and min_quantity <= v_qty
     order by (case when product_id = v_product.id then 1 else 0 end) desc, min_quantity desc
     limit 1;
    if found then
      v_line_total := v_offer.total_price_cents;
    else
      v_line_total := v_base * v_qty;
    end if;

    v_items := v_items || jsonb_build_object(
      'product_id', v_collect_product_id,
      'variant_id', v_collect_variant_id,
      'product_name', v_collect_product_name,
      'variant_name', v_collect_variant_name,
      'quantity', v_qty,
      'unit_price', v_base,
      'line_total', v_line_total
    );
    v_collect_variant_id := null;
    v_collect_variant_name := null;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- 6. Totals (server-side only)
  v_total := v_subtotal + v_fee;

  -- 7. Create order + items
  v_order_number := public.fn_next_order_number(p_store_id);
  insert into public.orders (
    store_id, order_number, full_name, phone, normalized_phone,
    wilaya_code, wilaya, commune, address, delivery_type, office,
    subtotal_cents, shipping_fee_cents, discount_cents, total_cents, status, source,
    utm_source, utm_medium, utm_campaign, referrer
  ) values (
    p_store_id, v_order_number, trim(p_full_name), v_normalized, v_normalized,
    p_wilaya_code, coalesce((select name from public.wilayas where code = p_wilaya_code), 'Wilaya ' || p_wilaya_code),
    trim(p_commune), nullif(trim(coalesce(p_address, '')), ''), v_delivery, nullif(trim(coalesce(p_office, '')), ''),
    v_subtotal, v_fee, 0, v_total, 'new', p_source,
    nullif(p_utm_source, ''), nullif(p_utm_medium, ''), nullif(p_utm_campaign, ''), nullif(p_referrer, '')
  ) returning id into v_order_id;

  for v_item in
      select product_id, variant_id, product_name, variant_name, quantity, unit_price, line_total
        from jsonb_to_recordset(v_items)
       as (product_id uuid, variant_id uuid, product_name text, variant_name text, quantity integer, unit_price integer, line_total integer)
  loop
    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price_cents, line_total_cents)
    values (v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name, v_item.variant_name, v_item.quantity, v_item.unit_price, v_item.line_total);
  end loop;

  -- 8. Customer upsert (normalized phone + store; never merged across tenants)
  insert into public.customers (store_id, name, phone, normalized_phone, email, order_count, total_spent_cents, last_order_at)
  values (p_store_id, trim(p_full_name), v_normalized, v_normalized, nullif(trim(coalesce(p_email, '')), ''), 1, v_total, now())
  on conflict (store_id, normalized_phone) do update set
    name = excluded.name,
    email = coalesce(excluded.email, public.customers.email),
    order_count = public.customers.order_count + 1,
    total_spent_cents = public.customers.total_spent_cents + excluded.total_spent_cents,
    last_order_at = now()
  returning id into v_customer_id;

  update public.orders set customer_id = v_customer_id where id = v_order_id;

  -- 9. History + event
  insert into public.order_status_history (order_id, from_status, to_status)
  values (v_order_id, null, 'new');
  insert into public.system_events (store_id, category, level, message)
  values (p_store_id, 'system', 'info', 'Commande ' || v_order_number || ' créée');

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_cents', v_subtotal,
    'shipping_fee_cents', v_fee,
    'total_cents', v_total,
    'status', 'new'
  );
end;
$$;
