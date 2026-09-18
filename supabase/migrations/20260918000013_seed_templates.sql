-- ===========================================================================
-- FlexiGo — 0013: system templates (seeded, platform-managed)
-- Screenshots live in /public/images/templates (generated design previews).
-- ===========================================================================

insert into public.templates (key, name, description, website_types, is_system, screenshot_url) values
  (
    'ecommerce-modern',
    'Ecommerce Modern',
    'Boutique COD moderne et polyvalente : hero, collections, meilleures ventes, avis et FAQ.',
    array['ecommerce'],
    true,
    '/images/templates/ecommerce-modern.png'
  ),
  (
    'fashion-luxury',
    'Fashion Luxury',
    'Style élégant pour mode, hijab et vêtements premium. Typographie fine, tons sobres.',
    array['ecommerce'],
    true,
    '/images/templates/fashion-luxury.png'
  ),
  (
    'single-product',
    'Single Product COD',
    'Landing page de conversion pour un produit, optimisée Meta/TikTok Ads avec commande à la livraison.',
    array['single_product'],
    true,
    '/images/templates/single-product.png'
  ),
  (
    'portfolio',
    'Portfolio Professional',
    'Vitrine professionnelle : médecins, architectes, consultants, agences, photographes…',
    array['portfolio'],
    true,
    '/images/templates/portfolio.png'
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  website_types = excluded.website_types,
  screenshot_url = excluded.screenshot_url;
