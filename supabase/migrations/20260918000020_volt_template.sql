-- VOLT v1 — additive template registry entry only.
-- No existing store is migrated; no customer/order data is touched.
insert into public.templates (key,name,description,website_types,is_system,screenshot_url)
values (
  'volt-v1',
  'VOLT',
  'قالب عربي RTL حديث للإلكترونيات والأجهزة والإكسسوارات: تصميم داكن تقني، صفحة منتج بخيارات ديناميكية وعروض كمية ونموذج COD مدمج وتجربة موبايل سريعة.',
  array['ecommerce'],
  true,
  '/images/templates/volt-v1.svg'
)
on conflict (key) do nothing;