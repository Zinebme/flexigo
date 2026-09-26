-- Additive catalog and checkout fields. Supabase remains the sole data backend.
alter table public.products add column if not exists free_shipping boolean not null default false;
alter table public.quantity_offers add column if not exists free_shipping boolean not null default false;
alter table public.order_items add column if not exists selected_options jsonb not null default '{}'::jsonb;

create table if not exists public.abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  session_key uuid not null,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text,
  full_name text,
  phone text,
  wilaya_code integer check (wilaya_code is null or wilaya_code between 1 and 58),
  quantity integer not null default 1 check (quantity between 1 and 50),
  selected_options jsonb not null default '{}'::jsonb,
  estimated_total_cents integer check (estimated_total_cents is null or estimated_total_cents >= 0),
  stage text not null default 'started' check (stage in ('started','contact','delivery','submitted','converted')),
  reason_code text,
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, session_key)
);
create index if not exists abandoned_checkouts_store_updated_idx on public.abandoned_checkouts(store_id, updated_at desc);
alter table public.abandoned_checkouts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'abandoned_checkouts' and policyname = 'abandoned_checkouts_select') then
    create policy abandoned_checkouts_select on public.abandoned_checkouts for select to authenticated
      using (public.fn_can_access_store((select auth.uid()), store_id) or public.fn_is_platform_admin((select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'abandoned_checkouts' and policyname = 'abandoned_checkouts_insert') then
    create policy abandoned_checkouts_insert on public.abandoned_checkouts for insert to authenticated
      with check (public.fn_has_store_role((select auth.uid()), store_id, array['OWNER','MANAGER','ORDER_MANAGER']));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'abandoned_checkouts' and policyname = 'abandoned_checkouts_update') then
    create policy abandoned_checkouts_update on public.abandoned_checkouts for update to authenticated
      using (public.fn_has_store_role((select auth.uid()), store_id, array['OWNER','MANAGER','ORDER_MANAGER']))
      with check (public.fn_has_store_role((select auth.uid()), store_id, array['OWNER','MANAGER','ORDER_MANAGER']));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'abandoned_checkouts' and policyname = 'abandoned_checkouts_delete') then
    create policy abandoned_checkouts_delete on public.abandoned_checkouts for delete to authenticated
      using (public.fn_has_store_role((select auth.uid()), store_id, array['OWNER','MANAGER','ORDER_MANAGER']));
  end if;
end $$;
