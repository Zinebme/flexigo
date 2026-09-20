-- FlexiGo — richer product merchandising + delivery metadata.
-- Additive only: existing products keep safe defaults.

alter table public.products
  add column if not exists short_description text,
  add column if not exists cost_cents integer check (cost_cents is null or cost_cents >= 0),
  add column if not exists is_digital boolean not null default false,
  add column if not exists gallery_mode text not null default 'slideshow'
    check (gallery_mode in ('slideshow','stacked')),
  add column if not exists landing_images text[] not null default '{}',
  add column if not exists min_order_quantity integer not null default 1
    check (min_order_quantity between 1 and 50),
  add column if not exists shipping_label text,
  add column if not exists stock_tracking_mode text not null default 'global'
    check (stock_tracking_mode in ('none','global','variants')),
  add column if not exists related_product_ids uuid[] not null default '{}',
  add column if not exists cross_sell_product_ids uuid[] not null default '{}',
  add column if not exists page_element_order text[] not null default
    array['gallery','title','price','variants','offers','description','order_form','landing','reviews','related'],
  add column if not exists option_groups jsonb;

comment on column public.products.option_groups is
  'Storefront option groups: label/key, selection_mode single|multiple, display_type, required, min/max, values.';

comment on column public.products.related_product_ids is
  'Merchant-curated related products. Must remain scoped to the same store at application layer.';

comment on column public.products.cross_sell_product_ids is
  'Merchant-curated post-purchase / upsell product suggestions, same-store only.';
