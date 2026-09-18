-- ===========================================================================
-- FlexiGo — demo seed (development only)
--
-- Creates 4 demo stores with realistic data so every template can be
-- demonstrated immediately. All data is FAKE (no real persons).
--
-- Demo accounts (password for ALL of them:  Flexigo!2026demo)
--   Super admin : admin@flexigo.dz
--   Maison Almasa (owner) : sofia.benali@demo.dz
--   NovaShop (owner)      : karim.haddad@demo.dz
--   NovaShop (order mgr)  : yacine@novashop.demo
--   NovaShop (editor)     : amine@novashop.demo
--   PureSkin (owner)      : lina.merabet@demo.dz
--   Cabinet Horizon (owner): amel.bouchama@demo.dz
--
-- ⚠️ Never run this seed in production.
-- ===========================================================================

-- --- users -------------------------------------------------------------------
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-000000000001', 'admin@flexigo.dz',      crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Super Admin"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000011', 'sofia.benali@demo.dz',  crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Sofia Benali"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000012', 'karim.haddad@demo.dz',  crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Karim Haddad"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000013', 'yacine@novashop.demo',  crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Yacine Mansouri"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000014', 'amine@novashop.demo',   crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Amine Boudiaf"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000021', 'lina.merabet@demo.dz',  crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Lina Merabet"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000031', 'amel.bouchama@demo.dz', crypt('Flexigo!2026demo', gen_salt('bf')), now(), '{"full_name": "Amel Bouchama"}'::jsonb)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider, provider_id) values
  ('email-' || 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'email', 'a0000000-0000-4000-8000-000000000001'),
  ('email-' || 'a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000011', 'email', 'a0000000-0000-4000-8000-000000000011'),
  ('email-' || 'a0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000012', 'email', 'a0000000-0000-4000-8000-000000000012'),
  ('email-' || 'a0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000013', 'email', 'a0000000-0000-4000-8000-000000000013'),
  ('email-' || 'a0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000014', 'email', 'a0000000-0000-4000-8000-000000000014'),
  ('email-' || 'a0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000021', 'email', 'a0000000-0000-4000-8000-000000000021'),
  ('email-' || 'a0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000031', 'email', 'a0000000-0000-4000-8000-000000000031')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, email, is_verified, last_login_at) values
  ('a0000000-0000-4000-8000-000000000001', 'Super Admin', 'admin@flexigo.dz', true, now() - interval '2 hours'),
  ('a0000000-0000-4000-8000-000000000011', 'Sofia Benali', 'sofia.benali@demo.dz', true, now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000012', 'Karim Haddad', 'karim.haddad@demo.dz', true, now() - interval '3 hours'),
  ('a0000000-0000-4000-8000-000000000013', 'Yacine Mansouri', 'yacine@novashop.demo', true, now() - interval '5 days'),
  ('a0000000-0000-4000-8000-000000000014', 'Amine Boudiaf', 'amine@novashop.demo', true, now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000021', 'Lina Merabet', 'lina.merabet@demo.dz', true, now() - interval '8 hours'),
  ('a0000000-0000-4000-8000-000000000031', 'Amel Bouchama', 'amel.bouchama@demo.dz', true, now() - interval '4 days')
on conflict (id) do nothing;

insert into public.platform_admins (user_id, role, created_by) values
  ('a0000000-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'a0000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

-- --- organizations -------------------------------------------------------------
insert into public.organizations (id, name, owner_user_id, internal_notes, status, created_by) values
  ('c0000000-0000-4000-8000-000000000001', 'Maison Almasa', 'a0000000-0000-4000-8000-000000000011', 'Cliente fidèle — relancer pour le catalogue hiver.', 'active', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000002', 'NovaShop', 'a0000000-0000-4000-8000-000000000012', 'Facture mensuelle. Très actif sur Meta Ads.', 'active', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000003', 'PureSkin', 'a0000000-0000-4000-8000-000000000021', 'Landing produit unique — TikTok Ads. Tester A/B hero.', 'active', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000004', 'Cabinet Horizon', 'a0000000-0000-4000-8000-000000000031', 'Cabinet dentaire. Demande de mise en avant WhatsApp.', 'active', 'a0000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

-- --- stores -----------------------------------------------------------------------
insert into public.stores (id, organization_id, name, slug, website_type, template_key, language, currency, status, settings, published_version, created_by) values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Maison Almasa', 'maison-almasa', 'ecommerce', 'fashion-luxury', 'fr', 'DZD', 'active',
   '{"contact":{"email":"contact@maison-almasa.dz","phone":"0550 10 20 30","whatsapp":"https://wa.me/213550102030","instagram":"https://instagram.com/maison.almasa","facebook":null,"tiktok":null,"address":"12 rue Didouche Mourad, Alger"},"business":{"cod_enabled":true,"reviews_enabled":true,"faq_enabled":true,"allow_negative_stock":false,"max_items_per_order":10}}'::jsonb,
   1, 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'NovaShop', 'novashop', 'ecommerce', 'ecommerce-modern', 'fr', 'DZD', 'active',
   '{"contact":{"email":"contact@novashop.dz","phone":"0550 12 34 56","whatsapp":"https://wa.me/213550123456","instagram":"https://instagram.com/novashop.dz","facebook":"https://facebook.com/novashopdz","tiktok":"https://tiktok.com/@novashopdz","address":"Zone industrielle, Blida"},"business":{"cod_enabled":true,"reviews_enabled":true,"faq_enabled":true,"allow_negative_stock":false,"max_items_per_order":10}}'::jsonb,
   1, 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', 'PureSkin', 'pureskin', 'single_product', 'single-product', 'fr', 'DZD', 'active',
   '{"contact":{"email":"contact@pureskin.dz","phone":"0661 40 50 60","whatsapp":"https://wa.me/213661405060","instagram":"https://instagram.com/pureskin.dz","facebook":null,"tiktok":"https://tiktok.com/@pureskindz","address":"Alger"},"business":{"cod_enabled":true,"reviews_enabled":true,"faq_enabled":true,"allow_negative_stock":false,"max_items_per_order":10}}'::jsonb,
   1, 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004', 'Cabinet Horizon', 'cabinet-horizon', 'portfolio', 'portfolio', 'fr', 'DZD', 'active',
   '{"contact":{"email":"contact@cabinet-horizon.dz","phone":"023 50 60 70","whatsapp":"https://wa.me/213661708090","instagram":null,"facebook":"https://facebook.com/cabinethorizon","tiktok":null,"address":"Cité des spécialités, Bd Zighoud Youcef, Constantine"},"business":{"cod_enabled":false,"reviews_enabled":true,"faq_enabled":true,"allow_negative_stock":false,"max_items_per_order":10}}'::jsonb,
   1, 'a0000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

-- --- memberships ----------------------------------------------------------------------
insert into public.store_members (store_id, user_id, role, status, invited_by) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'OWNER', 'active', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000012', 'OWNER', 'active', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000013', 'ORDER_MANAGER', 'active', 'a0000000-0000-4000-8000-000000000012'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000014', 'CONTENT_EDITOR', 'active', 'a0000000-0000-4000-8000-000000000012'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000021', 'OWNER', 'active', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000031', 'OWNER', 'active', 'a0000000-0000-4000-8000-000000000001')
on conflict (store_id, user_id) do nothing;

-- --- themes ---------------------------------------------------------------------------
insert into public.themes (store_id, logo_url, favicon_url, primary_color, secondary_color, background_color, typography, button_shape, announcement) values
  ('b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/almasa-logo/400/400', null, '#292524', '#a16207', '#faf9f7', 'elegant', 'sharp', null),
  ('b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/novashop-logo/400/400', null, '#1d4ed8', '#f59e0b', '#ffffff', 'modern', 'rounded', 'Livraison 48h dans les grandes villes — Paiement à la livraison'),
  ('b0000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/pureskin-logo/400/400', null, '#dc2626', '#111827', '#ffffff', 'bold', 'pill', 'Stock limité — offre pack 2 pièces encore disponible'),
  ('b0000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/horizon-logo/400/400', null, '#0f766e', '#1e293b', '#ffffff', 'minimal', 'rounded', null)
on conflict (store_id) do update set
  logo_url = excluded.logo_url, primary_color = excluded.primary_color, secondary_color = excluded.secondary_color,
  background_color = excluded.background_color, typography = excluded.typography, button_shape = excluded.button_shape,
  announcement = excluded.announcement;

-- --- categories ------------------------------------------------------------------------
insert into public.categories (id, store_id, name, slug, description, image_url, position, is_visible) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Hijabs', 'hijabs', 'Hijabs premium en mousseline et soie.', 'https://picsum.photos/seed/cat-hijabs/600/400', 1, true),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Robes & Tuniques', 'robetuniques', 'Robes et tuniques élégantes.', 'https://picsum.photos/seed/cat-robes/600/400', 2, true),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Abayas', 'abayas', 'Abayas brodées, coupes modernes.', 'https://picsum.photos/seed/cat-abayas/600/400', 3, true),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'Accessoires', 'accessoires', 'Ceintures, pochettes et finitions.', 'https://picsum.photos/seed/cat-accessoires/600/400', 4, true),
  ('d0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000002', 'Électroménager', 'electromenager', 'Petits électroménagers pratiques.', 'https://picsum.photos/seed/cat-elec/600/400', 1, true),
  ('d0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000002', 'Électronique', 'electronique', 'Accessoires tech et batteries.', 'https://picsum.photos/seed/cat-tech/600/400', 2, true),
  ('d0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000002', 'Cuisine', 'cuisine', 'Organisateurs et ustensiles.', 'https://picsum.photos/seed/cat-cuisine/600/400', 3, true),
  ('d0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000003', 'Soins visage', 'soins-visage', 'Routine complète peau éclatante.', 'https://picsum.photos/seed/cat-skincare/600/400', 1, true)
on conflict (id) do nothing;

-- --- products ----------------------------------------------------------------------------
insert into public.products (id, store_id, category_id, name, slug, description, price_cents, compare_at_price_cents, sku, stock, low_stock_threshold, is_active, is_featured, position) values
  -- Maison Almasa
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Hijab Premium « Nour »', 'hijab-nour', 'Hijab en mousseline premium, tombé parfait, coutures invisibles. Disponible en plusieurs coloris.', 180000, 220000, 'ALM-HIJ-001', 42, 8, true, true, 1),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'Robe Tunique « Sahara »', 'robe-sahara', 'Tunique élégante en viscose légère, idéale pour le quotidien comme pour les occasions.', 320000, 380000, 'ALM-ROB-002', 18, 5, true, true, 2),
  ('e0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 'Abaya Brodée « Rania »', 'abaya-rania', 'Abaya brodée main, tissu premium, coupe fluide.', 450000, null, 'ALM-ABA-003', 9, 4, true, true, 3),
  ('e0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'Ensemble « Kenza » (Chemise + Pantalon)', 'ensemble-kenza', 'Ensemble coordonné chemise et pantalon, tissu respirant.', 390000, null, 'ALM-ENS-004', 14, 5, true, false, 4),
  ('e0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', 'Ceinture Cuir « Atlas »', 'ceinture-atlas', 'Ceinture en cuir véritable, boucle dorée.', 95000, null, 'ALM-CEI-005', 25, 6, true, false, 5),
  ('e0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', 'Pochette « Djerba »', 'pochette-djerba', 'Pochette assortie, chaîne métallique, finitions soignées.', 75000, null, 'ALM-POC-006', 30, 6, true, false, 6),
  -- NovaShop
  ('e0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'Bouilloire Électrique 1,7L', 'bouilloire-17l', 'Bouilloire en inox 1,7L, arrêt automatique, rotation 360°.', 490000, 590000, 'NVS-BOU-011', 35, 8, true, true, 1),
  ('e0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'Lampe LED Rechargeable 1200 lm', 'lampe-led-1200', 'Lampe puissante rechargeable, 3 intensités, autonomie 12h.', 220000, 280000, 'NVS-LAM-012', 60, 10, true, true, 2),
  ('e0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000013', 'Organisateur de Cuisine 6 Pièces', 'organisateur-6p', 'Set 6 boîtes hermétiques avec couvercles colorés.', 180000, 220000, 'NVS-ORG-013', 48, 10, true, true, 3),
  ('e0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000013', 'Balance de Cuisine Digitale 5kg', 'balance-5kg', 'Précision 1g, écran tactile, fonction tare.', 120000, null, 'NVS-BAL-014', 55, 10, true, false, 4),
  ('e0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'Cafetière Thermos 1L', 'cafetiere-thermos', 'Garde le café chaud 12h, thermos inox 1L.', 290000, null, 'NVS-CAF-015', 22, 6, true, false, 5),
  ('e0000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'Aspirateur Main Sans Fil 25kPa', 'aspirateur-25kpa', 'Aspiration puissante 25kPa, 2 modes, 40 min d''autonomie.', 890000, 990000, 'NVS-ASP-016', 12, 5, true, true, 6),
  ('e0000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000012', 'Batterie Externe 20000 mAh', 'batterie-20000', 'Charge rapide 22.5W, double port USB + Type-C, affichage LED.', 340000, 420000, 'NVS-BAT-017', 80, 15, true, true, 7),
  ('e0000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000012', 'Coque iPhone Anti-choc', 'coque-iphone', 'Protection renforcée, bords surélevés, tous modèles récents.', 90000, null, 'NVS-COQ-018', 120, 20, true, false, 8),
  -- PureSkin
  ('e0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000021', 'Sérum Éclat Vitamine C 10%', 'serum-vitamine-c', 'Sérum concentré vitamine C 10% + acide hyaluronique. Unifie le teint, atténue les taches, booste l''éclat. Résultats visibles dès 2 semaines.', 250000, 300000, 'PUR-SRM-021', 250, 20, true, true, 1),
  ('e0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000021', 'Nettoyant Doux Gel', 'nettoyant-gel', 'Gel nettoyant doux matin et soir, respecte le pH de la peau.', 190000, null, 'PUR-NTY-022', 90, 15, true, false, 2),
  ('e0000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000021', 'Masque Hydratant Nuit', 'masque-nuit', 'Masque nuit hautehydratation à l''acide hyaluronique.', 150000, null, 'PUR-MAS-023', 70, 15, true, false, 3)
on conflict (id) do nothing;

-- --- product images ---------------------------------------------------------------------
insert into public.product_images (product_id, store_id, url, alt, position) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/hijab-nour/800/800', 'Hijab Premium Nour', 0),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/robe-sahara/800/800', 'Robe Tunique Sahara', 0),
  ('e0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/abaya-rania/800/800', 'Abaya Brodée Rania', 0),
  ('e0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/ensemble-kenza/800/800', 'Ensemble Kenza', 0),
  ('e0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/ceinture-atlas/800/800', 'Ceinture Atlas', 0),
  ('e0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/pochette-djerba/800/800', 'Pochette Djerba', 0),
  ('e0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/bouilloire/800/800', 'Bouilloire 1.7L', 0),
  ('e0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/lampe-led/800/800', 'Lampe LED 1200 lm', 0),
  ('e0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/organisateur/800/800', 'Organisateur 6 pièces', 0),
  ('e0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/balance/800/800', 'Balance 5kg', 0),
  ('e0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/cafetiere/800/800', 'Cafetière thermos 1L', 0),
  ('e0000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/aspirateur/800/800', 'Aspirateur 25kPa', 0),
  ('e0000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/batterie/800/800', 'Batterie 20000 mAh', 0),
  ('e0000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/coque/800/800', 'Coque anti-choc', 0),
  ('e0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/serum-c/800/800', 'Sérum Vitamine C 10%', 0),
  ('e0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/nettoyant/800/800', 'Nettoyant gel', 0),
  ('e0000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/masque-nuit/800/800', 'Masque nuit', 0)
on conflict do nothing;

-- --- variants ------------------------------------------------------------------------------
insert into public.product_variants (id, product_id, name, options, price_cents, sku, stock, is_active, position) values
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'Noir', '{"Couleur": "Noir"}'::jsonb, null, 'ALM-HIJ-001-N', 18, true, 1),
  ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'Beige', '{"Couleur": "Beige"}'::jsonb, null, 'ALM-HIJ-001-B', 14, true, 2),
  ('f0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001', 'Terracotta', '{"Couleur": "Terracotta"}'::jsonb, 200000, 'ALM-HIJ-001-T', 10, true, 3),
  ('f0000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000017', 'Noir', '{"Couleur": "Noir"}'::jsonb, null, 'NVS-BAT-017-N', 50, true, 1),
  ('f0000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000017', 'Blanc', '{"Couleur": "Blanc"}'::jsonb, null, 'NVS-BAT-017-B', 30, true, 2)
on conflict (id) do nothing;

-- --- quantity offers ------------------------------------------------------------------------
insert into public.quantity_offers (id, store_id, product_id, min_quantity, total_price_cents, label, is_active, position) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 2, 390000, 'Pack 2 sérums : 3900 DA', true, 1),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000017', 2, 590000, '2 batteries : 5900 DA', true, 1),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 3, 490000, '3 hijabs : 4900 DA', true, 1)
on conflict (id) do nothing;

-- --- shipping zones ----------------------------------------------------------------------------
insert into public.shipping_zones (store_id, wilaya_code, home_fee_cents, office_fee_cents, is_active) values
  ('b0000000-0000-4000-8000-000000000001', 0, 60000, 40000, true),
  ('b0000000-0000-4000-8000-000000000002', 0, 50000, 30000, true),
  ('b0000000-0000-4000-8000-000000000002', 16, 40000, 25000, true),
  ('b0000000-0000-4000-8000-000000000002', 31, 45000, 30000, true),
  ('b0000000-0000-4000-8000-000000000003', 0, 70000, 40000, true),
  ('b0000000-0000-4000-8000-000000000004', 0, 50000, 0, true)
on conflict (store_id, wilaya_code) do nothing;

-- --- order factory (consistent totals computed from DB prices) -------------------------------
create or replace function public.seed_make_order(
  p_store uuid, p_product uuid, p_qty int, p_fee int, p_status text,
  p_days_ago int, p_hours_ago int, p_phone text, p_name text, p_wilaya int, p_commune text,
  p_utm_source text default null, p_utm_campaign text default null
) returns void
language plpgsql
as $$
declare
  v_price int;
  v_offer public.quantity_offers%rowtype;
  v_line int;
  v_norm text;
  v_order public.orders%rowtype;
  v_when timestamptz;
begin
  v_when := now() - make_interval(days => p_days_ago, hours => p_hours_ago);
  v_norm := public.fn_normalize_phone(p_phone);

  select price_cents into v_price from public.products where id = p_product;

  select * into v_offer from public.quantity_offers
   where store_id = p_store and is_active
     and (product_id is null or product_id = p_product)
     and min_quantity <= p_qty
   order by min_quantity desc limit 1;
  if found then v_line := v_offer.total_price_cents; else v_line := v_price * p_qty; end if;

  insert into public.customers (store_id, name, phone, normalized_phone, order_count, total_spent_cents, last_order_at)
  values (p_store, p_name, v_norm, v_norm, 1, v_line + p_fee, v_when)
  on conflict (store_id, normalized_phone) do update set
    name = excluded.name,
    order_count = public.customers.order_count + 1,
    total_spent_cents = public.customers.total_spent_cents + excluded.total_spent_cents,
    last_order_at = greatest(coalesce(public.customers.last_order_at, excluded.last_order_at), excluded.last_order_at);

  insert into public.orders (
    store_id, order_number, full_name, phone, normalized_phone,
    wilaya_code, wilaya, commune, delivery_type,
    subtotal_cents, shipping_fee_cents, total_cents, status, source,
    utm_source, utm_campaign, created_at, updated_at
  )
  select
    p_store, public.fn_next_order_number(p_store), p_name, v_norm, v_norm,
    p_wilaya, (select name from public.wilayas where code = p_wilaya), p_commune,
    case when p_wilaya = 16 then 'office' else 'home' end,
    v_line, p_fee, v_line + p_fee, p_status, 'storefront',
    p_utm_source, p_utm_campaign, v_when, v_when
  from public.customers c
  where c.store_id = p_store and c.normalized_phone = v_norm
  returning * into v_order;

  update public.orders set customer_id = (
    select id from public.customers where store_id = p_store and normalized_phone = v_norm
  ) where id = v_order.id;

  insert into public.order_items (order_id, product_id, product_name, quantity, unit_price_cents, line_total_cents)
  values (v_order.id, p_product, (select name from public.products where id = p_product), p_qty, v_price, v_line);

  insert into public.order_status_history (order_id, from_status, to_status, created_at)
  values (v_order.id, null, 'new', v_when);
  if p_status <> 'new' then
    insert into public.order_status_history (order_id, from_status, to_status, created_at)
    values (v_order.id, 'new', p_status, v_when + interval '2 hours');
  end if;
end;
$$;

-- NovaShop orders
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000017', 1, 40000, 'new', 0, 2, '0550123456', 'Mohamed Benali', 16, 'Alger');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000012', 1, 40000, 'to_confirm', 0, 5, '0661234567', 'Amine Bouzid', 16, 'Cheraga');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000011', 1, 50000, 'confirmed', 1, 3, '0550765432', 'Sara Kadri', 9, 'Blida');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000016', 1, 40000, 'preparation', 1, 7, '0770112233', 'Riad Cherif', 16, 'Bab El Oued');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000017', 2, 45000, 'shipped', 2, 4, '0550998877', 'Nassim Ziani', 31, 'Oran', 'facebook', 'novacampaign');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000014', 1, 50000, 'in_transit', 3, 2, '0661445566', 'Wassim Benaissa', 25, 'Constantine');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000015', 1, 40000, 'out_for_delivery', 2, 8, '0550221100', 'Lyes Hamidi', 16, 'Kouba');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000012', 1, 50000, 'delivered', 5, 1, '0770334455', 'Imene Brahimi', 15, 'Tizi Ouzou');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000011', 1, 50000, 'delivered', 8, 3, '0550667788', 'Anis Meddah', 35, 'Boumerdès');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000013', 1, 50000, 'delivered', 12, 5, '0661778899', 'Sofia Tlemçani', 13, 'Tlemcen');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000018', 1, 50000, 'delivered', 20, 2, '0550556677', 'Yacine Ferhat', 23, 'Annaba');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000016', 1, 40000, 'returned', 6, 6, '0770889900', 'Omar Kaci', 16, 'Draria');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000017', 1, 50000, 'delivery_failed', 4, 7, '0550332211', 'Hicham Ould Ali', 47, 'Ghardaïa');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000014', 1, 45000, 'cancelled_customer', 3, 9, '0661990011', 'Meriem Saidi', 31, 'Es Sénia');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000013', 1, 40000, 'new', 0, 1, '0550443322', 'Fawzi Boudjidane', 16, 'Rouiba');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000015', 1, 50000, 'confirmed', 2, 6, '0770554433', 'Lynda Ait Ali', 19, 'Sétif', 'tiktok', 'tiktok-lead');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000012', 2, 50000, 'delivered', 30, 4, '0661223344', 'Bilal Mansouri', 6, 'Béjaïa');
select public.seed_make_order('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000011', 1, 50000, 'to_confirm', 1, 5, '0550887766', 'Nadia Bouarara', 9, 'El Affroun');

-- Maison Almasa orders
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 1, 40000, 'new', 0, 3, '0550111222', 'Amina Zaidi', 16, 'Alger');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 1, 60000, 'confirmed', 0, 6, '0661333444', 'Salma Belkacem', 16, 'Cheraga');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 1, 60000, 'delivered', 2, 2, '0550555666', 'Rim Cherif', 31, 'Oran');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 1, 60000, 'delivered', 7, 3, '0770777888', 'Ines Hamdani', 15, 'Tizi Ouzou');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 1, 60000, 'delivered', 10, 5, '0661999000', 'Yasmina Boudiaf', 25, 'Constantine');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000004', 1, 60000, 'shipped', 1, 4, '0550222333', 'Kenza Merbah', 9, 'Blida');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 3, 40000, 'delivered', 15, 2, '0661444555', 'Amel Larbi', 16, 'Bab Ezzouar');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000005', 1, 40000, 'to_confirm', 0, 4, '0550666777', 'Houda Benyoucef', 16, 'El Biar');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000006', 1, 60000, 'delivered', 21, 6, '0770888999', 'Meryem Saidi', 23, 'Annaba');
select public.seed_make_order('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 1, 60000, 'cancelled_store', 5, 8, '0550123987', 'Fatima Zohra', 16, 'Draria');

-- PureSkin orders
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 1, 70000, 'new', 0, 1, '0550314151', 'Lina Ait Ahmed', 16, 'Alger');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 2, 70000, 'to_confirm', 0, 4, '0661617181', 'Sara Belhadj', 16, 'Kouba');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 1, 70000, 'confirmed', 1, 5, '0550910111', 'Yasmina Chérif', 31, 'Oran', 'facebook', 'pureskin-fb');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 2, 70000, 'delivered', 3, 2, '0770213141', 'Amina Boumediene', 19, 'Sétif', 'tiktok', 'pureskin-tt');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 1, 70000, 'delivered', 8, 6, '0661516171', 'Nadia Hamidi', 35, 'Boumerdès');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000022', 1, 70000, 'delivered', 15, 3, '0550819201', 'Rim Belaid', 16, 'Alger');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 1, 70000, 'returned', 5, 7, '0661120311', 'Oumaima Sahnoun', 25, 'Constantine');
select public.seed_make_order('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000023', 1, 70000, 'new', 0, 2, '0550421321', 'Sofia Kaci', 16, 'Rouiba');

-- Cabinet Horizon leads (no COD orders)
insert into public.customers (store_id, name, phone, normalized_phone, notes, order_count, total_spent_cents) values
  ('b0000000-0000-4000-8000-000000000004', 'Patient — demande devis', '0550 90 90 01', '213550909001', 'Contactée pour un plan de traitement.', 0, 0),
  ('b0000000-0000-4000-8000-000000000004', 'Consultation implant', '0661 90 90 02', '213661909002', 'Rendez-vous planifié le mois prochain.', 0, 0),
  ('b0000000-0000-4000-8000-000000000004', 'Détartrage annuel', '0770 90 90 03', '213770909003', null, 0, 0)
on conflict (store_id, normalized_phone) do nothing;

drop function public.seed_make_order(uuid, uuid, int, int, text, int, int, text, text, int, text, text, text);

-- --- reviews ---------------------------------------------------------------------------------
insert into public.reviews (store_id, product_id, customer_name, rating, title, body, is_approved, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'S. B.', 5, 'Tombé parfait', 'Le tissu est magnifique, je recommande les yeux fermés.', true, now() - interval '12 days'),
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 'R. C.', 5, 'Très élégante', 'La broderie est sublime, coupes impeccable.', true, now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 'Y. B.', 4, 'Très belle robe', 'Livraison rapide, la robe est encore plus belle en vrai.', true, now() - interval '30 days'),
  ('b0000000-0000-4000-8000-000000000001', null, 'A. Z.', 5, 'Service au top', 'Équipe très réactive sur WhatsApp, merci !', true, now() - interval '8 days'),
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000005', 'H. B.', 4, 'Belle ceinture', 'Cuir de qualité, taille un peu grand.', false, now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000012', 'M. B.', 5, 'Lampe top', 'Très puissante, autonomie au top. Reçu en 48h.', true, now() - interval '6 days'),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000017', 'N. Z.', 5, 'Excellente batterie', 'Charge très rapide, conforme à la description.', true, now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000016', 'O. K.', 3, 'Correct', 'L''aspirateur est bon mais le bruit est un peu fort.', true, now() - interval '25 days'),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000011', 'S. K.', 5, 'Bouilloire nickel', 'Fonctionne très bien, livraison propre.', true, now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000002', null, 'W. B.', 4, 'Bon service', 'Commande bien emballée, suivi sérieux.', false, now() - interval '2 days'),
  ('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 'Y. C.', 5, 'Peau éclatante', 'Deux semaines et mes taches ont bien diminué.', true, now() - interval '10 days'),
  ('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000021', 'A. B.', 5, 'Efficace', 'Texture légère, pas grasse. Je recommande le pack.', true, now() - interval '18 days'),
  ('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000022', 'N. H.', 4, 'Bonne routine', 'Mon teint est plus net depuis un mois.', true, now() - interval '28 days'),
  ('b0000000-0000-4000-8000-000000000004', null, 'K. M.', 5, 'Cabinet très pro', 'Accueil excellent et cabinet moderne.', true, now() - interval '14 days'),
  ('b0000000-0000-4000-8000-000000000004', null, 'B. T.', 5, 'Dr. au top', 'Suivi personnalisé, je recommande.', true, now() - interval '40 days')
on conflict do nothing;

-- --- FAQ ----------------------------------------------------------------------------------------
insert into public.faq_items (store_id, question, answer, position, is_visible) values
  ('b0000000-0000-4000-8000-000000000001', 'Quels sont les délais de livraison ?', 'Nous livrons dans les 24 à 72h selon votre wilaya.', 1, true),
  ('b0000000-0000-4000-8000-000000000001', 'Puis-je payer à la livraison ?', 'Oui, le paiement à la livraison est disponible dans toute l''Algérie.', 2, true),
  ('b0000000-0000-4000-8000-000000000001', 'Proposez-vous des retours ?', 'Oui, sous 7 jours si l''article est non porté et avec ses étiquettes.', 3, true),
  ('b0000000-0000-4000-8000-000000000001', 'Comment suivre ma commande ?', 'Nous vous appelons avant la livraison pour confirmer votre adresse.', 4, true),
  ('b0000000-0000-4000-8000-000000000001', 'Les tailles sont-elles standards ?', 'Nos coupes sont standards ; consultez les fiches produit pour les mesures exactes.', 5, true),
  ('b0000000-0000-4000-8000-000000000002', 'Comment se passe le paiement ?', 'Paiement à la livraison uniquement. Payez après inspection du colis.', 1, true),
  ('b0000000-0000-4000-8000-000000000002', 'Quels sont les délais de livraison ?', '24 à 48h pour Alger, 48 à 72h pour le reste du pays.', 2, true),
  ('b0000000-0000-4000-8000-000000000002', 'Les produits sont-ils garantis ?', 'Oui, tous nos produits bénéficient d''une garantie de 3 mois.', 3, true),
  ('b0000000-0000-4000-8000-000000000002', 'Puis-je annuler ma commande ?', 'Oui, avant l''expédition, par téléphone ou WhatsApp.', 4, true),
  ('b0000000-0000-4000-8000-000000000002', 'Livrez-vous dans les 58 wilayas ?', 'Oui, partout en Algérie avec notre transporteur partenaire.', 5, true),
  ('b0000000-0000-4000-8000-000000000003', 'Le sérum convient-il aux peaux sensibles ?', 'Sa formule est testée dermatologiquement ; faites un test cutané préalable.', 1, true),
  ('b0000000-0000-4000-8000-000000000003', 'Quand verrai-je des résultats ?', 'Généralement entre 2 et 4 semaines d''utilisation régulière.', 2, true),
  ('b0000000-0000-4000-8000-000000000003', 'Comment appliquer le sérum ?', 'Le matin et le soir sur peau propre, avant votre crème hydratante.', 3, true),
  ('b0000000-0000-4000-8000-000000000003', 'Livrez-vous dans toute l''Algérie ?', 'Oui, paiement à la livraison dans les 58 wilayas.', 4, true),
  ('b0000000-0000-4000-8000-000000000004', 'Prenez-vous des rendez-vous en ligne ?', 'Oui, appelez-nous ou écrivez-nous sur WhatsApp.', 1, true),
  ('b0000000-0000-4000-8000-000000000004', 'Quels moyens de paiement acceptez-vous ?', 'Espèces ou carte au cabinet.', 2, true),
  ('b0000000-0000-4000-8000-000000000004', 'Où se trouve le cabinet ?', 'Cité des spécialités, Bd Zighoud Youcef, Constantine.', 3, true),
  ('b0000000-0000-4000-8000-000000000004', 'Proposez-vous des urgences ?', 'Oui, appelez-nous pour toute urgence dentaire.', 4, true)
on conflict do nothing;

-- --- pages (structured content; published at v1) -------------------------------------------------
insert into public.pages (store_id, key, title, content) values
  -- Maison Almasa
  ('b0000000-0000-4000-8000-000000000001', 'home', 'Accueil', '{
    "sections": [
      {"id":"al1","type":"hero","enabled":true,"title":"Maison Almasa","subtitle":"L''élégance algérienne, dans chaque détail. Hijabs, abayas et pièces premium.","image":"https://picsum.photos/seed/almasa-hero/1600/900","button_text":"Découvrir","button_link":"/boutique","alignment":"center"},
      {"id":"al2","type":"collections","enabled":true,"title":"Nos collections","subtitle":"Des pièces sélectionnées avec soin.","category_id":null,"max_items":4},
      {"id":"al3","type":"products","enabled":true,"title":"Meilleures ventes","subtitle":null,"source":"featured","product_count":4},
      {"id":"al4","type":"banner","enabled":true,"title":"Livraison 48h — Paiement à la livraison","subtitle":"Dans les 58 wilayas.","desktop_image":"https://picsum.photos/seed/almasa-banner/1600/700","mobile_image":null,"button_text":"Voir la boutique","button_link":"/boutique","alignment":"center"},
      {"id":"al5","type":"reviews","enabled":true,"title":"Elles nous font confiance","subtitle":null},
      {"id":"al6","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":5},
      {"id":"al7","type":"cta","enabled":true,"title":"Suivez Maison Almasa","text":"Nouvelles collections chaque semaine sur Instagram.","button_text":"Suivre sur Instagram","button_link":"https://instagram.com/maison.almasa"}
    ]}'),
  ('b0000000-0000-4000-8000-000000000001', 'shop', 'Boutique', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000001', 'about', 'À propos', '{
    "sections": [
      {"id":"ala1","type":"hero","enabled":true,"title":"Notre histoire","subtitle":"Maison Almasa est née d''une passion : habiller les femmes algériennes avec exigence et élégance.","image":"https://picsum.photos/seed/almasa-about/1600/700","alignment":"center"},
      {"id":"ala2","type":"contact","enabled":true,"title":"Contactez-nous","text":null,"show_phone":true,"show_whatsapp":true,"show_email":true}
    ]}'),
  ('b0000000-0000-4000-8000-000000000001', 'faq', 'FAQ', '{
    "sections": [
      {"id":"alf1","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":12}
    ]}'),
  ('b0000000-0000-4000-8000-000000000001', 'contact', 'Contact', '{
    "sections": [
      {"id":"alc1","type":"contact","enabled":true,"title":"Contact","text":"Une question sur une pièce ? Écrivez-nous, nous répondons 7j/7.","show_phone":true,"show_whatsapp":true,"show_email":true},
      {"id":"alc2","type":"map","enabled":true,"title":"Adresse","address":"12 rue Didouche Mourad, Alger","note":"Accès facile."}
    ]}'),
  ('b0000000-0000-4000-8000-000000000001', 'legal-terms', 'Conditions générales', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000001', 'legal-privacy', 'Confidentialité', '{"sections": []}'),

  -- NovaShop
  ('b0000000-0000-4000-8000-000000000002', 'home', 'Accueil', '{
    "sections": [
      {"id":"nv1","type":"hero","enabled":true,"title":"NovaShop — Tout pour votre quotidien","subtitle":"Produits pratiques, prix justes, livraison rapide partout en Algérie.","image":"https://picsum.photos/seed/novashop-hero/1600/700","button_text":"Voir la boutique","button_link":"/boutique","alignment":"left"},
      {"id":"nv2","type":"collections","enabled":true,"title":"Nos collections","subtitle":null,"category_id":null,"max_items":3},
      {"id":"nv3","type":"products","enabled":true,"title":"Meilleures ventes","subtitle":null,"source":"featured","product_count":4},
      {"id":"nv4","type":"features","enabled":true,"title":"Nos engagements","subtitle":null,"items":[{"title":"Livraison 24-48h","text":"Dans les grandes wilayas."},{"title":"Paiement à la livraison","text":"Payez après inspection du colis."},{"title":"Garantie 3 mois","text":"Sur tous nos produits."}]},
      {"id":"nv5","type":"reviews","enabled":true,"title":"Avis clients","subtitle":null},
      {"id":"nv6","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":5}
    ]}'),
  ('b0000000-0000-4000-8000-000000000002', 'shop', 'Boutique', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000002', 'about', 'À propos', '{
    "sections": [
      {"id":"nva1","type":"hero","enabled":true,"title":"À propos de NovaShop","subtitle":"Nous sélectionnons des produits testés et approuvés, livrés partout en Algérie.","image":"https://picsum.photos/seed/novashop-about/1600/700","alignment":"center"}
    ]}'),
  ('b0000000-0000-4000-8000-000000000002', 'faq', 'FAQ', '{
    "sections": [
      {"id":"nvf1","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":12}
    ]}'),
  ('b0000000-0000-4000-8000-000000000002', 'contact', 'Contact', '{
    "sections": [
      {"id":"nvc1","type":"contact","enabled":true,"title":"Contact","text":"Réponse rapide garantie.","show_phone":true,"show_whatsapp":true,"show_email":true}
    ]}'),
  ('b0000000-0000-4000-8000-000000000002', 'legal-terms', 'Conditions générales', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000002', 'legal-privacy', 'Confidentialité', '{"sections": []}'),

  -- PureSkin (single-product landing)
  ('b0000000-0000-4000-8000-000000000003', 'home', 'Accueil', '{
    "sections": [
      {"id":"ps1","type":"hero","enabled":true,"title":"Un teint éclatant en 2 semaines","subtitle":"Sérum Vitamine C 10% + acide hyaluronique. Testé dermatologiquement.","image":"https://picsum.photos/seed/pureskin-hero/1200/1200","button_text":"Commander maintenant","button_link":"/commande","alignment":"center"},
      {"id":"ps2","type":"features","enabled":true,"title":"Pourquoi le Sérum Éclat ?","subtitle":null,"items":[{"title":"Vitamine C 10%","text":"Concentration optimale pour l''éclat, tolérée par la peau."},{"title":"Acide hyaluronique","text":"Hydratation profonde, effet repulpant immédiat."},{"title":"Résultats visibles","text":"Taches estompées et teint unifié dès 2 semaines."},{"title":"Testé dermatologiquement","text":"Formule sans parabènes, adaptée aux peaux sensibles."}]},
      {"id":"ps3","type":"how_it_works","enabled":true,"title":"Comment ça marche","subtitle":null,"steps":[{"title":"1. Commandez","text":"Remplissez le formulaire en 30 secondes."},{"title":"2. On expédie","text":"Votre colis part sous 24h, suivi WhatsApp."},{"title":"3. Payez à la réception","text":"Inspectez votre colis, puis payez le livreur."}]},
      {"id":"ps4","type":"social_proof","enabled":true,"title":"","items":[{"value":"5000+","label":"flacons livrés"},{"value":"4,8/5","label":"note moyenne"},{"value":"58","label":"wilayas desservies"}]},
      {"id":"ps5","type":"offer","enabled":true,"title":"Offre pack","subtitle":"Économisez 1000 DA sur le duo","text":"1 flacon : 2500 DA — 2 flacons : 3900 DA. La routine complète pour des résultats optimaux."},
      {"id":"ps6","type":"reviews","enabled":true,"title":"Avis vérifiés","subtitle":null},
      {"id":"ps7","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":4},
      {"id":"ps8","type":"cod_form","enabled":true,"title":"Commandez maintenant","subtitle":"Stock limité — livraison dans toute l''Algérie"},
      {"id":"ps9","type":"sticky_cta","enabled":true,"text":"Livraison 24-48h • Paiement à la livraison","button_text":"Commander"}
    ]}'),
  ('b0000000-0000-4000-8000-000000000003', 'shop', 'Boutique', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000003', 'about', 'À propos', '{
    "sections": [
      {"id":"psa1","type":"hero","enabled":true,"title":"La science au service de votre peau","subtitle":"PureSkin développe des formules concentrées, testées et efficaces.","image":"https://picsum.photos/seed/pureskin-about/1600/700","alignment":"center"}
    ]}'),
  ('b0000000-0000-4000-8000-000000000003', 'faq', 'FAQ', '{
    "sections": [
      {"id":"psf1","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":12}
    ]}'),
  ('b0000000-0000-4000-8000-000000000003', 'contact', 'Contact', '{
    "sections": [
      {"id":"psc1","type":"contact","enabled":true,"title":"Contact","text":null,"show_phone":true,"show_whatsapp":true,"show_email":true}
    ]}'),
  ('b0000000-0000-4000-8000-000000000003', 'legal-terms', 'Conditions générales', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000003', 'legal-privacy', 'Confidentialité', '{"sections": []}'),

  -- Cabinet Horizon (portfolio)
  ('b0000000-0000-4000-8000-000000000004', 'home', 'Accueil', '{
    "sections": [
      {"id":"ch1","type":"hero","enabled":true,"title":"Cabinet Horizon","subtitle":"Votre sourire, notre métier. Soins dentaires modernes au cœur de Constantine.","image":"https://picsum.photos/seed/horizon-hero/1600/900","button_text":"Prendre rendez-vous","button_link":"/contact","alignment":"left"},
      {"id":"ch2","type":"stats","enabled":true,"title":"","items":[{"value":"15+","label":"années d''expérience"},{"value":"8000+","label":"patients traités"},{"value":"12","label":"spécialités"}]},
      {"id":"ch3","type":"services","enabled":true,"title":"Nos soins","subtitle":"Un plateau technique complet pour toute la famille.","items":[{"title":"Implantologie","text":"Réhabilitation durable des dents manquantes.","image":"https://picsum.photos/seed/horizon-implant/600/400"},{"title":"Esthétique dentaire","text":"Blanchiment, facettes et correction du sourire.","image":"https://picsum.photos/seed/horizon-esth/600/400"},{"title":"Chirurgie orale","text":"Extractions complexes et interventions guidées.","image":"https://picsum.photos/seed/horizon-chir/600/400"}]},
      {"id":"ch4","type":"gallery","enabled":true,"title":"Notre cabinet","subtitle":null,"images":["https://picsum.photos/seed/horizon-g1/800/600","https://picsum.photos/seed/horizon-g2/800/600","https://picsum.photos/seed/horizon-g3/800/600","https://picsum.photos/seed/horizon-g4/800/600"]},
      {"id":"ch5","type":"testimonials","enabled":true,"title":"Ils nous font confiance","items":[{"name":"Karim M.","role":"Patient","text":"Cabinet moderne et équipe très professionnelle."},{"name":"Baya T.","role":"Patiente","text":"Un suivi impeccable après l''implant, je recommande."}]},
      {"id":"ch6","type":"hours","enabled":true,"title":"Horaires d''ouverture","days":[{"day":"Lundi – Vendredi","value":"08h30 – 17h00"},{"day":"Samedi","value":"09h00 – 13h00"},{"day":"Dimanche","value":"Fermé"}]},
      {"id":"ch7","type":"map","enabled":true,"title":"Où nous trouver","address":"Cité des spécialités, Bd Zighoud Youcef, Constantine","note":"Parking à proximité."},
      {"id":"ch8","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":4},
      {"id":"ch9","type":"contact","enabled":true,"title":"Prendre rendez-vous","text":"Appelez-nous ou écrivez-nous sur WhatsApp.","show_phone":true,"show_whatsapp":true,"show_email":true}
    ]}'),
  ('b0000000-0000-4000-8000-000000000004', 'about', 'À propos', '{
    "sections": [
      {"id":"cha1","type":"hero","enabled":true,"title":"Notre équipe","subtitle":"Des praticiens passionnés, formés aux dernières techniques.","image":"https://picsum.photos/seed/horizon-team/1600/700","alignment":"center"},
      {"id":"cha2","type":"testimonials","enabled":true,"title":"Témoignages","items":[{"name":"S. B.","role":"Patiente","text":"Excellente écoute et douceur."}]}
    ]}'),
  ('b0000000-0000-4000-8000-000000000004', 'faq', 'FAQ', '{
    "sections": [
      {"id":"chf1","type":"faq","enabled":true,"title":"Questions fréquentes","subtitle":null,"max_items":12}
    ]}'),
  ('b0000000-0000-4000-8000-000000000004', 'contact', 'Contact', '{
    "sections": [
      {"id":"chc1","type":"contact","enabled":true,"title":"Contact & rendez-vous","text":"Réponse rapide 7j/7 sur WhatsApp.","show_phone":true,"show_whatsapp":true,"show_email":true},
      {"id":"chc2","type":"map","enabled":true,"title":"Adresse","address":"Cité des spécialités, Bd Zighoud Youcef, Constantine","note":null}
    ]}'),
  ('b0000000-0000-4000-8000-000000000004', 'legal-terms', 'Conditions générales', '{"sections": []}'),
  ('b0000000-0000-4000-8000-000000000004', 'legal-privacy', 'Confidentialité', '{"sections": []}')
on conflict (store_id, key) do nothing;

-- publish v1 for all pages that have content
-- Legal pages stay DRAFTS in the demo (merchant must publish them).
update public.pages set published_content = content, version = 1, published_at = now() - interval '30 days'
where key not in ('legal-terms', 'legal-privacy') and content is not null and published_content is null;

insert into public.page_versions (store_id, page_key, version, content, published_by)
select p.store_id, p.key, 1, p.content,
  case p.store_id
    when 'b0000000-0000-4000-8000-000000000001' then 'a0000000-0000-4000-8000-000000000011'
    when 'b0000000-0000-4000-8000-000000000002' then 'a0000000-0000-4000-8000-000000000012'
    when 'b0000000-0000-4000-8000-000000000003' then 'a0000000-0000-4000-8000-000000000021'
    when 'b0000000-0000-4000-8000-000000000004' then 'a0000000-0000-4000-8000-000000000031'
  end::uuid
from public.pages p
where p.version = 1
on conflict (store_id, page_key, version) do nothing;

-- --- integrations ------------------------------------------------------------------------------
insert into public.shipping_integrations (store_id, provider_key, is_active, config, status, last_tested_at) values
  ('b0000000-0000-4000-8000-000000000001', 'manual', true, '{"note": "Livraison via transporteur local"}'::jsonb, 'configured', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000002', 'manual', true, '{}'::jsonb, 'configured', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000003', 'navex', false, '{"api_base_url": "", "api_token": "", "account": ""}'::jsonb, 'unconfigured', null)
on conflict (store_id, provider_key) do nothing;

insert into public.marketing_integrations (store_id, provider_key, is_active, config, events_enabled, position) values
  ('b0000000-0000-4000-8000-000000000002', 'meta_pixel', true, '{"pixel_id": "778899001122"}'::jsonb, array['PageView','ViewContent','AddToCart','InitiateCheckout','Purchase'], 1),
  ('b0000000-0000-4000-8000-000000000002', 'gtm', true, '{"container_id": "GTM-NV1DEMO"}'::jsonb, array['PageView'], 2),
  ('b0000000-0000-4000-8000-000000000003', 'meta_pixel', true, '{"pixel_id": "334455667788"}'::jsonb, array['PageView','ViewContent','AddToCart','InitiateCheckout','Purchase'], 1),
  ('b0000000-0000-4000-8000-000000000003', 'tiktok_pixel', true, '{"pixel_id": "TT1234567890"}'::jsonb, array['PageView','Purchase'], 2),
  ('b0000000-0000-4000-8000-000000000001', 'ga4', true, '{"measurement_id": "G-ALMASA1DEMO"}'::jsonb, array['PageView'], 1)
on conflict (store_id, provider_key) do nothing;

insert into public.google_sheet_integrations (store_id, spreadsheet_id, credential_encrypted, fields, is_active, last_status) values
  ('b0000000-0000-4000-8000-000000000002', '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789', null, array['order_number','full_name','phone','wilaya','commune','total_cents','status'], false, null)
on conflict (store_id) do nothing;

insert into public.whatsapp_integrations (store_id, is_active, phone, provider, status) values
  ('b0000000-0000-4000-8000-000000000001', true, '0550 10 20 30', 'none', 'idle'),
  ('b0000000-0000-4000-8000-000000000002', true, '0550 12 34 56', 'none', 'idle'),
  ('b0000000-0000-4000-8000-000000000003', true, '0661 40 50 60', 'none', 'idle'),
  ('b0000000-0000-4000-8000-000000000004', true, '0661 70 80 90', 'none', 'idle')
on conflict (store_id) do nothing;

-- --- domains (demo of both states) ------------------------------------------------------------------
insert into public.domains (store_id, hostname, is_primary, status, verification_token, verified_at) values
  ('b0000000-0000-4000-8000-000000000001', 'maison-almasa.com.dz', true, 'verified', 'demo-verified-token-almasa', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000002', 'novashop-dz.com.dz', true, 'pending', 'demo-pending-token-novashop', null)
on conflict (hostname) do nothing;

-- --- demo health signals ---------------------------------------------------------------------------------
insert into public.system_events (store_id, category, level, message, details) values
  ('b0000000-0000-4000-8000-000000000003', 'integration', 'error', 'Test de connexion Navex en échec : URL de base non joignable.', '{"provider": "navex"}'::jsonb),
  ('b0000000-0000-4000-8000-000000000002', 'domain', 'warning', 'Domaine novashop-dz.com.dz en attente de vérification DNS.', null)
on conflict do nothing;

insert into public.integration_logs (store_id, integration_type, action, status, message) values
  ('b0000000-0000-4000-8000-000000000003', 'shipping', 'test_connection', 'failure', 'URL de base Navex non joignable (démo).')
on conflict do nothing;

-- --- seed audit trail --------------------------------------------------------------------------------------------
insert into public.audit_logs (actor_user_id, store_id, action, entity, entity_id, metadata) values
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'store.created', 'store', 'b0000000-0000-4000-8000-000000000002', '{"name": "NovaShop"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'page.published', 'page', 'b0000000-0000-4000-8000-000000000001', '{"page": "home", "version": 1}'::jsonb)
on conflict do nothing;
