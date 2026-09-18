-- ===========================================================================
-- FlexiGo — 0012: triggers + indexes
-- ===========================================================================

-- --- updated_at triggers -----------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'stores', 'categories', 'products',
    'product_variants', 'reviews', 'faq_items', 'pages',
    'shipping_integrations', 'shipments', 'marketing_integrations',
    'google_sheet_integrations', 'whatsapp_integrations', 'customers', 'orders'
  ] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I for each row execute function public.fn_set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- --- profile bootstrap + membership activation on auth events -----------------
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    drop trigger if exists flexigo_on_new_user on auth.users;
    create trigger flexigo_on_new_user
      after insert on auth.users
      for each row execute function public.fn_on_new_auth_user();
  end if;
end;
$$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'sessions') then
    drop trigger if exists flexigo_on_new_session on auth.sessions;
    create trigger flexigo_on_new_session
      after insert on auth.sessions
      for each row execute function public.fn_on_new_session();
  end if;
end;
$$;

-- --- explicit execute grants (idempotent, mirror Supabase defaults) -----------
grant execute on all functions in schema public to anon, authenticated, service_role;

-- ===========================================================================
-- Indexes (performance: list pages, lookups, tenant scoping)
-- ===========================================================================

create index if not exists stores_status_idx        on public.stores (status);
create index if not exists stores_org_idx           on public.stores (organization_id);

create index if not exists store_members_user_idx   on public.store_members (user_id);
create index if not exists store_members_store_idx  on public.store_members (store_id);

create index if not exists domains_store_idx        on public.domains (store_id) where deleted_at is null;
create index if not exists domains_hostname_idx     on public.domains (lower(hostname));

create index if not exists categories_store_idx     on public.categories (store_id, position) where deleted_at is null;
create index if not exists products_store_idx       on public.products (store_id, position) where deleted_at is null;
create index if not exists products_featured_idx    on public.products (store_id) where is_featured and is_active and deleted_at is null;
create index if not exists products_category_idx    on public.products (category_id) where deleted_at is null;

create index if not exists variants_product_idx     on public.product_variants (product_id, position);
create index if not exists images_product_idx       on public.product_images (product_id, position);
create index if not exists offers_store_idx         on public.quantity_offers (store_id) where is_active;

create index if not exists zones_store_idx          on public.shipping_zones (store_id, wilaya_code);

create index if not exists reviews_store_idx        on public.reviews (store_id, created_at desc) where deleted_at is null;
create index if not exists reviews_product_idx      on public.reviews (product_id) where is_approved and deleted_at is null;
create index if not exists faq_store_idx            on public.faq_items (store_id, position) where deleted_at is null;

create index if not exists pages_store_idx          on public.pages (store_id, key);
create index if not exists page_versions_store_idx  on public.page_versions (store_id, page_key, version desc);

create index if not exists customers_phone_idx      on public.customers (store_id, normalized_phone);
create index if not exists customers_store_idx      on public.customers (store_id, last_order_at desc nulls last) where deleted_at is null;

create index if not exists orders_store_status_idx  on public.orders (store_id, status, created_at desc);
create index if not exists orders_store_created_idx on public.orders (store_id, created_at desc);
create index if not exists orders_customer_idx      on public.orders (customer_id);
create index if not exists order_items_order_idx    on public.order_items (order_id);
create index if not exists history_order_idx        on public.order_status_history (order_id, created_at);
create index if not exists movements_store_idx      on public.inventory_movements (store_id, created_at desc);

create index if not exists shipments_order_idx      on public.shipments (order_id);
create index if not exists shipments_store_idx      on public.shipments (store_id, created_at desc);

create index if not exists audit_store_idx          on public.audit_logs (store_id, created_at desc);
create index if not exists audit_actor_idx          on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_action_idx         on public.audit_logs (action, created_at desc);
create index if not exists sys_events_idx           on public.system_events (created_at desc);
create index if not exists sys_events_store_idx     on public.system_events (store_id, created_at desc);
create index if not exists integ_logs_idx           on public.integration_logs (store_id, created_at desc);
create index if not exists support_sessions_idx     on public.support_sessions (admin_user_id, ended_at);
