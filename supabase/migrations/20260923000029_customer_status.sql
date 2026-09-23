-- Customer lifecycle controls for Super Admin and merchants.
-- Additive only: existing customers remain active and existing RLS policies stay unchanged.
alter table public.customers
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));

create index if not exists customers_store_status_idx
  on public.customers (store_id, status)
  where deleted_at is null;

comment on column public.customers.status is
  'Store-scoped customer lifecycle. Suspended customers cannot place new storefront orders.';
