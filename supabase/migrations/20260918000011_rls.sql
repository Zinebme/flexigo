-- ===========================================================================
-- FlexiGo — 0011: Row Level Security policies
--
-- SECURITY MODEL (defense in depth):
-- * RLS is ENABLED on every tenant-sensitive table.
-- * Merchants reach rows ONLY through store_members (membership model).
-- * Public storefront reads are granted to the ANON role ONLY (the
--   storefront has no customer accounts; server-side storefront code uses
--   the anon client for public reads). They are limited to ACTIVE stores
--   and PUBLISHED / APPROVED / ACTIVE records — drafts, suspended stores
--   and other tenants' data are never visible. A logged-in merchant
--   session therefore NEVER sees another tenant's rows.
-- * Platform admins (Super Admin) get cross-tenant READ-only policies
--   (fn_is_platform_admin) for the platform console; tenant mutations are
--   always service-role routes with application-level checks + audit.
-- * platform_admins, shipping_integrations, google_sheet_integrations
--   (encrypted credentials), store_counters and platform_settings have NO
--   policies: default deny, service key only.
-- * Write policies are deliberately restrictive: membership changes,
--   platform roles, integrations credentials, logs and deletes (soft-only)
--   happen exclusively through server-side service-role operations.
-- * Helper functions are SECURITY DEFINER (read store_members as the table
--   owner) which also prevents RLS recursion.
-- ===========================================================================

-- ===========================================================================
-- profiles
-- Docs: a user reads their own profile, and the profiles of teammates in
-- stores they belong to (team page). Users can insert/update only their own
-- row (self-bootstrap on first login; the DB trigger also creates it).
-- ===========================================================================
alter table public.profiles enable row level security;

create policy "profiles_select_own_and_team" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.store_members sm
      where sm.user_id = public.profiles.id
        and public.fn_has_store_membership(auth.uid(), sm.store_id)
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ===========================================================================
-- organizations
-- Docs: visible only to members of at least one store of the organization.
-- Writes are service-only (Super Admin creates clients).
-- ===========================================================================
alter table public.organizations enable row level security;

create policy "organizations_select_member" on public.organizations
  for select to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.organization_id = public.organizations.id
        and public.fn_has_store_membership(auth.uid(), s.id)
    )
  );

-- ===========================================================================
-- stores
-- Docs:
--  * any visitor (anon/authenticated) sees ACTIVE, not-deleted stores
--    (public identity data — name/slug/status/settings used by storefront);
--  * authenticated members (or Super Admin with an open support session)
--    see any status of stores they can access.
-- Writes (status changes, settings) are service-only.
-- ===========================================================================
alter table public.stores enable row level security;

create policy "stores_public_read" on public.stores
  for select to anon
  using (status = 'active' and deleted_at is null);

create policy "stores_member_read" on public.stores
  for select to authenticated
  using (public.fn_can_access_store(auth.uid(), id));

-- ===========================================================================
-- store_members
-- Docs: visible to the user themself and to members of the same store
-- (team management). NO write policies: invites, role changes and removals
-- are performed server-side (service role) after owner authorization —
-- this removes any path to self-escalation at the database level.
-- ===========================================================================
alter table public.store_members enable row level security;

create policy "store_members_select" on public.store_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_has_store_membership(auth.uid(), store_id)
  );

-- ===========================================================================
-- platform_admins
-- Docs: NO policies at all (default deny). Client sessions can neither read
-- nor write platform roles. SUPER_ADMIN is never assignable from any
-- merchant-facing surface — see lib/auth/admin-context.ts.
-- ===========================================================================
alter table public.platform_admins enable row level security;

-- ===========================================================================
-- domains
-- Docs: visible to OWNER/MANAGER of the store. Management (add/verify/
-- primary/remove) is service-only.
-- ===========================================================================
alter table public.domains enable row level security;

create policy "domains_select" on public.domains
  for select to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- templates (platform design assets — public metadata)
-- ===========================================================================
alter table public.templates enable row level security;

create policy "templates_platform_admin_read" on public.templates
  for select to authenticated
  using (public.fn_is_platform_admin(auth.uid()));

-- ===========================================================================
-- themes
-- Docs: public for active stores (storefront needs it); members of any
-- status can read their own; appearance edits by content roles.
-- ===========================================================================
alter table public.themes enable row level security;

create policy "themes_public_read" on public.themes
  for select to anon
  using (
    exists (
      select 1 from public.stores s
      where s.id = public.themes.store_id and s.status = 'active' and s.deleted_at is null
    )
  );

create policy "themes_member_read" on public.themes
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "themes_member_update" on public.themes
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- categories
-- Docs: public sees visible + not-deleted of active stores. CRUD for
-- content roles; deletion is soft-only at the app layer (no delete policy).
-- ===========================================================================
alter table public.categories enable row level security;

create policy "categories_public_read" on public.categories
  for select to anon
  using (
    is_visible and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.categories.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "categories_member_read" on public.categories
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "categories_member_insert" on public.categories
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "categories_member_update" on public.categories
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- products
-- Docs: public reads active + not-deleted products of active stores.
-- Writes for content roles. No delete policy (soft delete only).
-- ===========================================================================
alter table public.products enable row level security;

create policy "products_public_read" on public.products
  for select to anon
  using (
    is_active and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.products.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "products_member_read" on public.products
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "products_member_insert" on public.products
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "products_member_update" on public.products
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- product_variants / product_images
-- Docs: follow the parent product's public state; writes for content roles.
-- ===========================================================================
alter table public.product_variants enable row level security;

create policy "variants_public_read" on public.product_variants
  for select to anon
  using (
    is_active and
    exists (
      select 1 from public.products p
      where p.id = public.product_variants.product_id
        and p.is_active and p.deleted_at is null
        and exists (select 1 from public.stores s where s.id = p.store_id and s.status = 'active' and s.deleted_at is null)
    )
  );

create policy "variants_member_read" on public.product_variants
  for select to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_membership(auth.uid(), p.store_id))
  );

create policy "variants_member_write" on public.product_variants
  for insert to authenticated
  with check (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_role(auth.uid(), p.store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  );

create policy "variants_member_update" on public.product_variants
  for update to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_role(auth.uid(), p.store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  )
  with check (
    exists (select 1 from public.products p where p.id = product_id and public.fn_has_store_role(auth.uid(), p.store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  );

alter table public.product_images enable row level security;

create policy "images_public_read" on public.product_images
  for select to anon
  using (
    exists (
      select 1 from public.stores s where s.id = public.product_images.store_id and s.status = 'active' and s.deleted_at is null
    )
  );

create policy "images_member_read" on public.product_images
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "images_member_write" on public.product_images
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "images_member_update" on public.product_images
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- quantity_offers
-- Docs: pricing is public (shown on product pages); management by content
-- roles. (Offers affect real revenue — price.changed is audited at app layer.)
-- ===========================================================================
alter table public.quantity_offers enable row level security;

create policy "offers_public_read" on public.quantity_offers
  for select to anon
  using (
    is_active and
    exists (select 1 from public.stores s where s.id = public.quantity_offers.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "offers_member_read" on public.quantity_offers
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "offers_member_insert" on public.quantity_offers
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "offers_member_update" on public.quantity_offers
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- shipping_zones
-- Docs: fees are public (checkout displays them); management by commerce
-- roles (OWNER/MANAGER/ORDER_MANAGER).
-- ===========================================================================
alter table public.shipping_zones enable row level security;

create policy "zones_public_read" on public.shipping_zones
  for select to anon
  using (
    is_active and
    exists (select 1 from public.stores s where s.id = public.shipping_zones.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "zones_member_read" on public.shipping_zones
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "zones_member_insert" on public.shipping_zones
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "zones_member_update" on public.shipping_zones
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- reviews
-- Docs: public sees APPROVED reviews of active stores; moderation (approve,
-- soft-delete) by content roles.
-- ===========================================================================
alter table public.reviews enable row level security;

create policy "reviews_public_read" on public.reviews
  for select to anon
  using (
    is_approved and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.reviews.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "reviews_member_read" on public.reviews
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "reviews_member_insert" on public.reviews
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "reviews_member_update" on public.reviews
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- faq_items
-- ===========================================================================
alter table public.faq_items enable row level security;

create policy "faq_public_read" on public.faq_items
  for select to anon
  using (
    is_visible and deleted_at is null and
    exists (select 1 from public.stores s where s.id = public.faq_items.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "faq_member_read" on public.faq_items
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "faq_member_insert" on public.faq_items
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

create policy "faq_member_update" on public.faq_items
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- pages
-- Docs: the live site reads ONLY published_content of active stores;
-- members (any status) read their store's pages incl. drafts; edits by
-- content roles. Page creation happens server-side at store creation.
-- ===========================================================================
alter table public.pages enable row level security;

create policy "pages_public_read" on public.pages
  for select to anon
  using (
    published_content is not null and
    exists (select 1 from public.stores s where s.id = public.pages.store_id and s.status = 'active' and s.deleted_at is null)
  );

create policy "pages_member_read" on public.pages
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "pages_member_update" on public.pages
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'CONTENT_EDITOR']));

-- ===========================================================================
-- page_versions (history)
-- Docs: members can read history (restore UI); inserts come from the
-- publish/restore functions (security definer).
-- ===========================================================================
alter table public.page_versions enable row level security;

create policy "page_versions_member_read" on public.page_versions
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

-- ===========================================================================
-- customers
-- Docs: commerce roles only (ORDER MANAGER included). Soft delete only.
-- ===========================================================================
alter table public.customers enable row level security;

create policy "customers_select" on public.customers
  for select to authenticated
  using (public.fn_can_access_store(auth.uid(), store_id));

create policy "customers_insert" on public.customers
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "customers_update" on public.customers
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- orders
-- Docs: commerce roles only. Orders are created by fn_place_cod_order
-- (security definer); merchants update status/notes. NO delete policy —
-- cancellation is a status change (audited).
-- ===========================================================================
alter table public.orders enable row level security;

create policy "orders_select" on public.orders
  for select to authenticated
  using (public.fn_can_access_store(auth.uid(), store_id));

create policy "orders_insert" on public.orders
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "orders_update" on public.orders
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- order_items / order_status_history
-- ===========================================================================
alter table public.order_items enable row level security;

create policy "order_items_select" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.order_items.order_id
        and public.fn_can_access_store(auth.uid(), o.store_id)
    )
  );

create policy "order_items_insert" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = public.order_items.order_id
        and public.fn_has_store_role(auth.uid(), o.store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER'])
    )
  );

alter table public.order_status_history enable row level security;

create policy "history_select" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.order_status_history.order_id
        and public.fn_can_access_store(auth.uid(), o.store_id)
    )
  );

create policy "history_insert" on public.order_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = public.order_status_history.order_id
        and public.fn_has_store_role(auth.uid(), o.store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER'])
    )
  );

-- ===========================================================================
-- inventory_movements (commerce: OWNER/MANAGER)
-- ===========================================================================
alter table public.inventory_movements enable row level security;

create policy "movements_select" on public.inventory_movements
  for select to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

create policy "movements_insert" on public.inventory_movements
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- shipping_integrations / google_sheet_integrations
-- Docs: NO policies (default deny) — they contain ENCRYPTED credentials.
-- The merchant API reads/writes them server-side (service role), decrypts
-- in memory, masks in responses. Direct client access is impossible.
-- ===========================================================================
alter table public.shipping_integrations enable row level security;
alter table public.google_sheet_integrations enable row level security;

-- ===========================================================================
-- shipments
-- ===========================================================================
alter table public.shipments enable row level security;

create policy "shipments_select" on public.shipments
  for select to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "shipments_insert" on public.shipments
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

create policy "shipments_update" on public.shipments
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER', 'ORDER_MANAGER']));

-- ===========================================================================
-- marketing_integrations
-- Docs: config holds public identifiers (pixel IDs) — readable by members;
-- writes restricted to OWNER/MANAGER; values validated (no code fields).
-- ===========================================================================
alter table public.marketing_integrations enable row level security;

create policy "marketing_select" on public.marketing_integrations
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "marketing_insert" on public.marketing_integrations
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

create policy "marketing_update" on public.marketing_integrations
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- whatsapp_integrations
-- ===========================================================================
alter table public.whatsapp_integrations enable row level security;

create policy "whatsapp_select" on public.whatsapp_integrations
  for select to authenticated
  using (public.fn_has_store_membership(auth.uid(), store_id));

create policy "whatsapp_insert" on public.whatsapp_integrations
  for insert to authenticated
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

create policy "whatsapp_update" on public.whatsapp_integrations
  for update to authenticated
  using (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']))
  with check (public.fn_has_store_role(auth.uid(), store_id, array['OWNER', 'MANAGER']));

-- ===========================================================================
-- wilayas (public reference data)
-- ===========================================================================
alter table public.wilayas enable row level security;

create policy "wilayas_public_read" on public.wilayas
  for select to anon
  using (true);

-- ===========================================================================
-- audit_logs / system_events / integration_logs / support_sessions /
-- store_counters / platform_settings
-- Docs: cross-tenant read for platform admins (see admin policies below);
-- store_counters and platform_settings stay service-only (no policies).
-- ===========================================================================
alter table public.audit_logs enable row level security;
alter table public.system_events enable row level security;
alter table public.integration_logs enable row level security;
alter table public.support_sessions enable row level security;
alter table public.store_counters enable row level security;
alter table public.platform_settings enable row level security;


-- ===========================================================================
-- PLATFORM ADMIN READ POLICIES (Super Admin console)
-- Docs: the platform owner needs cross-tenant READ visibility (dashboard,
-- orders, health, audit, support). This is read-only: every mutation of
-- tenant data happens through service-role routes that re-check
-- authorization and write audit logs. These policies use
-- fn_is_platform_admin() (security definer, reads platform_admins which
-- itself has NO policies — no RLS recursion).
-- ===========================================================================
create policy "stores_platform_admin_read" on public.stores
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "orders_platform_admin_read" on public.orders
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "order_items_platform_admin_read" on public.order_items
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "history_platform_admin_read" on public.order_status_history
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "customers_platform_admin_read" on public.customers
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "products_platform_admin_read" on public.products
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "variants_platform_admin_read" on public.product_variants
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "images_platform_admin_read" on public.product_images
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "categories_platform_admin_read" on public.categories
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "offers_platform_admin_read" on public.quantity_offers
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "zones_platform_admin_read" on public.shipping_zones
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "reviews_platform_admin_read" on public.reviews
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "faq_platform_admin_read" on public.faq_items
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "pages_platform_admin_read" on public.pages
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "page_versions_platform_admin_read" on public.page_versions
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "themes_platform_admin_read" on public.themes
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "store_members_platform_admin_read" on public.store_members
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "domains_platform_admin_read" on public.domains
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "profiles_platform_admin_read" on public.profiles
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "organizations_platform_admin_read" on public.organizations
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "shipments_platform_admin_read" on public.shipments
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "movements_platform_admin_read" on public.inventory_movements
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "marketing_platform_admin_read" on public.marketing_integrations
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "whatsapp_platform_admin_read" on public.whatsapp_integrations
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "audit_platform_admin_read" on public.audit_logs
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "system_events_platform_admin_read" on public.system_events
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "integration_logs_platform_admin_read" on public.integration_logs
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
create policy "support_sessions_platform_admin_read" on public.support_sessions
  for select to authenticated using (public.fn_is_platform_admin(auth.uid()));
-- ===========================================================================
-- Storage policies (public store-assets bucket)
-- On Supabase the `storage` schema exists; locally the block is skipped and
-- uploads are still fully validated server-side (lib/storage.ts).
-- ===========================================================================
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('store-assets', 'store-assets', true)
    on conflict (id) do update set public = true;

    -- Public read of assets of ACTIVE stores (folder path starts with store id)
    drop policy if exists "store_assets_public_read" on storage.objects;
    create policy "store_assets_public_read" on storage.objects
      for select to anon
      using (
        bucket_id = 'store-assets'
        and (storage.foldername(name))[1] in (
          select id::text from public.stores where status = 'active' and deleted_at is null
        )
      );

    -- Writes: only for one's OWN stores, commerce/content roles. (In practice
    -- uploads go through the service-role API which validates more deeply;
    -- this policy is the direct-client safety net.)
    drop policy if exists "store_assets_member_write" on storage.objects;
    create policy "store_assets_member_write" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'store-assets'
        and public.fn_has_store_role(auth.uid(), ((storage.foldername(name))[1])::uuid, array['OWNER', 'MANAGER', 'CONTENT_EDITOR'])
      );

    drop policy if exists "store_assets_member_update" on storage.objects;
    create policy "store_assets_member_update" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'store-assets'
        and public.fn_has_store_role(auth.uid(), ((storage.foldername(name))[1])::uuid, array['OWNER', 'MANAGER', 'CONTENT_EDITOR'])
      );
  end if;
end $$;
