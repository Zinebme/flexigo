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
