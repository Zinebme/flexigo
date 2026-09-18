-- ===========================================================================
-- FlexiGo — 0004: orders (customers, orders, items, history, inventory)
--
-- Order totals (subtotal / shipping / discount / total) are ALWAYS computed
-- server-side (fn_place_cod_order) from stored prices — never from the
-- browser. The stock check + decrement is atomic inside that function.
-- ===========================================================================

-- --- customers (matched by normalized phone + store, never across tenants) ------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null,
  normalized_phone text not null, -- "213XXXXXXXXX"
  email text,
  notes text,
  order_count integer not null default 0,
  total_spent_cents bigint not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, normalized_phone)
);

-- --- orders -------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  full_name text not null,
  phone text not null,
  normalized_phone text not null,
  wilaya_code integer not null check (wilaya_code between 1 and 58),
  wilaya text not null,
  commune text not null,
  address text,
  delivery_type text not null default 'home' check (delivery_type in ('home', 'office')),
  office text,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_fee_cents integer not null default 0 check (shipping_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'new' check (status in (
    'new', 'to_confirm', 'confirmed', 'postponed', 'no_answer',
    'cancelled_customer', 'preparation', 'shipped', 'in_transit',
    'at_office', 'out_for_delivery', 'delivered', 'returned',
    'delivery_failed', 'cancelled_store'
  )),
  internal_notes text,
  source text default 'storefront',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  tracking_number text,
  shipping_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order numbers are unique per store (each store counts from ORD-000001).
alter table public.orders add constraint orders_store_order_number_key unique (store_id, order_number);

-- --- order items (name/price snapshots survive product edits) -----------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

-- --- order status history (audit trail per order) ------------------------------------
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- --- inventory movements (adjustments with reason + actor) -----------------------------
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  change integer not null,
  reason text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
