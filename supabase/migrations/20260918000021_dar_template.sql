-- DAR v1 — additive template registry entry only.
-- No existing store is migrated; no customer/order data is touched.
insert into public.templates (key,name,description,website_types,is_system,screenshot_url)
values (
  'dar-v1',
  'DAR',
  'قالب عربي RTL دافئ للمنزل والمطبخ والتنظيم والديكور: هوية كريمية وزيتونية وتيراكوتا، صفحة منتج بخيارات ديناميكية وعروض كمية ونموذج COD مدمج وتجربة موبايل بسيطة.',
  array['ecommerce'],
  true,
  '/images/templates/dar-v1.svg'
)
on conflict (key) do nothing;