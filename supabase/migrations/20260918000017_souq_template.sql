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
