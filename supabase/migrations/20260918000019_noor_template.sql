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
