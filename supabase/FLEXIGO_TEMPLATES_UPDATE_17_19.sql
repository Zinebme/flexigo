-- FlexiGo cumulative template update: SOUQ + LAMSA + NOOR
-- Safe to apply to the existing hosted Supabase project after migrations through 0016.
-- Additive only: registers templates and related safe structured-section support.


-- >>> BEGIN 20260918000017_souq_template.sql >>>
-- ===========================================================================
-- FlexiGo — 0017: SOUQ template registration
--
-- SOUQ (سوق) is the first Arabic-first (RTL) Algerian COD storefront template.
-- It is registered exactly like the other platform templates so that
-- fn_create_store / fn_copy_store accept it — no other backend change.
--
-- Canonical key: `souq-v1`. The short alias `souq` is accepted by the
-- application layer (lib/templates/souq.ts) and canonicalized before store
-- creation, so a single registry row is enough.
-- ===========================================================================

insert into public.templates (key, name, description, website_types, is_system, screenshot_url) values
  (
    'souq-v1',
    'SOUQ — سوق',
    'Boutique COD algérienne Arabic-first (RTL) : bandeau promo livraison 58 wilayas, hero desktop/mobile, catégories, tendances, offres flash, meilleures ventes, arrivages, avantages, avis, FAQ, fiche produit riche (galerie, variantes dynamiques couleur/taille/pack, offres quantité, formulaire COD, CTA collant mobile) et pied de page contact/social.',
    array['ecommerce'],
    true,
    '/images/templates/souq-v1.svg'
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  website_types = excluded.website_types,
  screenshot_url = excluded.screenshot_url;
-- <<< END 20260918000017_souq_template.sql <<<


-- >>> BEGIN 20260918000018_lamsa_template.sql >>>
-- LAMSA v1 — additive template registry entry only.
-- No store is migrated and no tenant/customer/order row is touched.

insert into public.templates (
  key,
  name,
  description,
  website_types,
  is_system,
  screenshot_url
) values (
  'lamsa-v1',
  'LAMSA',
  'قالب عربي RTL فاخر للأزياء المحتشمة والحجاب والعبايات: تصميم تحريري هادئ، مجموعات بصرية، معرض منتجات 4:5، خيارات ديناميكية، عروض كمية ونموذج دفع عند الاستلام مدمج في صفحة المنتج.',
  array['ecommerce'],
  true,
  '/images/templates/lamsa-v1.svg'
)
on conflict (key) do nothing;
-- <<< END 20260918000018_lamsa_template.sql <<<


-- >>> BEGIN 20260918000019_noor_template.sql >>>
-- NOOR v1 — additive template registry entry only.
-- No store is migrated and no tenant/customer/order row is touched.
-- Existing template_key values are left untouched.

insert into public.templates (
  key,
  name,
  description,
  website_types,
  is_system,
  screenshot_url
) values (
  'noor-v1',
  'NOOR',
  'قالب عربي RTL فاخر للعناية والتجميل (بشرة، مكياج، عطور، شعر، عناية شخصية): هوية نظيفة وناعمة، صفحة منتج بمعرض ديناميكي وخيارات متعددة وعروض كمية ونموذج دفع عند الاستلام مدمج، وأقسام فوائد وروتين وقبل/بعد وتقييمات ومعرض اجتماعي.',
  array['ecommerce'],
  true,
  '/images/templates/noor-v1.svg'
)
on conflict (key) do nothing;
-- <<< END 20260918000019_noor_template.sql <<<
