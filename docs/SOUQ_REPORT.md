# SOUQ — final report

**Template:** SOUQ (سوق) · key `souq-v1` (alias `souq`) · Arabic-first RTL · Algerian COD
**Commit:** `bb8c26b` on `arena/01a0be14-flexigo` · PR #3
**Diff of the template commit:** 50 files, +9 289 / −24 (excluding this report)

---

## 1. Files created / modified

### Created — logic (`lib/`)

| file | lines | role |
|---|---:|---|
| `lib/storefront/souq/tokens.ts` | 154 | palette, CSS variables `--souq-*`, contrast helpers |
| `lib/storefront/souq/copy.ts` | 604 | full Arabic copy for the whole template (fr/en fallbacks) |
| `lib/storefront/souq/variants.ts` | 509 | dynamic option groups, selection rules, validation, add-ons |
| `lib/storefront/souq/order-model.ts` | 238 | display model: lines, quantity packs, shipping, savings |
| `lib/storefront/souq/checkout-settings.ts` | 127 | `checkout_settings` (fields / quantity / offers / delivery / variant display) |
| `lib/storefront/souq/catalog.ts` | 543 | anon, RLS-respecting loaders (home, shop, product, zones, settings) |
| `lib/storefront/souq/format.ts` | 42 | price/date formatting (`2 900 دج`) |
| `lib/storefront/souq/search.ts` | 69 | Arabic-normalised local search over a server-rendered index |
| `lib/templates/souq.ts` | 192 | key + alias helpers, default sections, default content pages |
| `lib/algeria/wilayas-ar.ts` | 77 | Arabic names of the 58 wilayas (additive helper) |

### Created — components (`components/storefront/templates-v2/souq/`, 15 files)

`souq-shell.tsx`, `souq-header.tsx`, `souq-footer.tsx`, `souq-search.tsx`,
`souq-ui.tsx`, `souq-product-card.tsx`, `souq-product-page.tsx`,
`souq-product-view.tsx`, `souq-order-form.tsx` (1 340 lines),
`souq-sticky-cta.tsx`, `souq-sections.tsx` (825 lines), `souq-shop.tsx`,
`souq-shop-page.tsx`, `souq-checkout-page.tsx`, `souq.css` (389 lines).

### Created — assets, DB, tests, docs

`public/images/templates/souq-v1.svg`, `public/images/templates/souq-v1-mobile.svg`,
`supabase/migrations/20260918000017_souq_template.sql`, `vitest.config.ts`,
`tests/unit/souq.test.ts`, `tests/unit/souq-render.test.tsx`, `docs/SOUQ_TEMPLATE.md`.

### Modified — all additive (24 deleted lines total)

`lib/templates/defaults.ts` (registry metadata + default sections/pages/settings),
`lib/sections/definitions.ts` (optional hero fields),
`components/storefront/sections.tsx` (SOUQ dispatch for SOUQ stores only),
`components/dashboard/section-editor.tsx` (hero fields in the editor),
`app/(storefront)/s/[slug]/{layout,page,boutique,categorie/[category],produit/[product],commande}/page.tsx`,
`app/api/checkout/route.ts` (optional Arabic locale),
`app/api/dashboard/settings/route.ts` (unknown settings keys survive saves),
`app/api/admin/stores/route.ts` (alias canonicalisation + template default language),
`app/admin/templates/page.tsx`, `components/admin/wizard-client.tsx`,
`supabase/FLEXIGO_FULL_SETUP.sql`, `supabase/seed.sql`, `tests/integration/run.mjs`.

> No file of `ecommerce-modern`, `fashion-luxury`, `single-product`, `portfolio`,
> `elegance`, `glow`, `tech`, `casa`, `little`, `active`, `market`, `convert` was
> modified: every legacy branch keeps its previous code path.

## 2. Components built

**Shell & navigation** — `SouqShell` (RTL root, palette variables, header/footer),
`SouqHeader` (promo bar *توصيل إلى 58 ولاية • الدفع عند الاستلام*, logo, search,
nav الرئيسية/الأقسام/العروض/الأكثر مبيعاً/تواصل معنا, WhatsApp, order indicator,
mobile drawer), `SouqFooter` (contact, social, nav, FAQ, policies, copyright —
only configured items render), `SouqSearch` (panel + local filter, no engine).

**Catalog** — `SouqProductCard` (image, name, price/compare, discount badge,
`متوفر`, `الأكثر مبيعاً`, rating when real, `اطلب الآن`), `SouqShop` +
`SouqShopPage`, category pages, `SouqSections` (19 section types incl. hero with
desktop/mobile art, collections, trending, offers, best sellers, banner, new
arrivals, why-us, reviews, FAQ, contact, COD block, sticky CTA).

**Product page** — `SouqProductView` / `SouqProductPage`: breadcrumb, gallery,
title, rating, price block, stock state, benefits, dynamic variant selectors,
quantity offers, shipping reassurance, COD form, description, features, reviews,
FAQ, related. Desktop: gallery left / info + form right (RTL). Mobile:
gallery → info → variants → COD form → content.

**Shared UI** — `souq-ui.tsx`: `SouqIcon` (inline SVG set, no icon font),
`SouqContainer`, `SouqSectionHeading`, `SouqBadge`, `SouqPrice`, `SouqStars`,
`SouqTrustStrip`, `SouqEmptyState`, `SouqImageFallback`
(`data-souq-fallback="true"`).

## 3. Visual system

| token | value |
|---|---|
| surface | `#f8fafc` / white |
| primary (deep navy) | `#0f2a47` |
| accent (warm amber) | `#f59e0b` |
| ink / muted | `#1e293b` / `#64748b` |
| border | `#e2e8f0` |
| radius | card 18 px, control 14 px, CTA 16 px |
| type | system Arabic stack (`SouqShell`), 26→42 px hero, tabular prices |

Rounded cards, subtle shadows, clean borders, high-contrast discount badges,
generous spacing, RTL-first alignment. Visibly different from `market`
(French-oriented, denser, different palette/rhythm).

## 4. Mobile behaviour

- Layout tested for 320 px: single-column cards, 2 columns from ~360 px,
  full-width CTAs, `48 px` touch targets, sticky-safe padding.
- Header collapses to logo + prominent search + drawer + cart.
- Sticky bottom CTA `اطلب الآن • 2 900 دج` (`lg:hidden`), safe-area padding,
  hides itself while the order form is on screen (IntersectionObserver),
  smooth-scrolls to the form and focuses its first field.
- Checkout: full-width fields, numeric keyboard (`type="tel"`, `inputMode`),
  native selects for wilaya/commune, no zoom on focus (16 px inputs).

## 5. COD form behaviour

- Title *أكمل طلبك*, subtitle *املأ معلوماتك وسنتصل بك لتأكيد الطلب*.
- Fields: الاسم، اللقب، رقم الهاتف، الولاية، البلدية، طريقة التوصيل
  (توصيل إلى المنزل / التوصيل إلى المكتب as real radio inputs),
  العنوان (home) / مكتب التوصيل (office), dynamic variants, quantity.
- Inline Arabic validation, `aria-invalid`, `role="alert"` messages; the honeypot
  field stays off-canvas, `tabIndex={-1}`, `aria-hidden` and is never announced.
- Summary: سعر المنتجات / سعر التوصيل / الخصم / المجموع, recomputed live on
  wilaya + delivery change; below the CTA: الدفع عند الاستلام + طلب آمن وسريع.
- Submits **identifiers only** to the shared `POST /api/checkout`; the CTA shows
  a pending state and can never double-submit.
- Success: تم استلام طلبك بنجاح + رقم الطلب `ORD-XXXXXX` + سنتواصل معك لتأكيد
  الطلب + العودة إلى المتجر. No internal identifiers are exposed.

## 6. Dynamic variants architecture

`lib/storefront/souq/variants.ts` builds option groups from merchant config when
present and otherwise derives them from the real `product_variants.options`
payload — **no hardcoded colour or size anywhere**.

Per group: `key`, `label` (اللون/المقاس/النوع/السعة/النكهة/الإضافة),
`selection_mode: single | multiple`, `display_type: buttons | color_swatch |
image | checkbox | dropdown`, `required`, `min_selections`, `max_selections`,
options with value/label/price delta/stock/add-on product id. Selection is
resolved to a real `variant_id` when the combination exists, an extra priced
line when it maps to an add-on product, and informational metadata otherwise.

## 7. Checkout integration

- Same engine as every other template: `POST /api/checkout` → rate limit →
  honeypot → phone normalisation → `fn_place_cod_order` (service-side RPC).
- The route now accepts an optional `locale: "ar"`; **absent locale keeps the
  historic French responses**, so `market`'s COD flow is unchanged.
- Prices, quantity packs, shipping fees and stock are recomputed in the
  database; browser-supplied prices are ignored (verified in the integration
  suite: a tampered body still produced 570 000 centimes / 5 700 دج).
- Dashboard settings PUT merges instead of replacing, so a store's unknown
  `settings.checkout` block survives merchant saves.

## 8. Demo content

`supabase/seed.sql` seeds **سوق بلس** (`/s/souq-plus`, `souq-v1`, `ar`, DZD, COD):

- 5 Arabic categories: إلكترونيات، المنزل، المطبخ، العناية، إكسسوارات
- 6 generic products: ساعة ذكية رياضية، سماعات لاسلكية، مصباح LED مكتبي،
  منظم مطبخ، جهاز تنظيف صغير، جهاز مساج محمول — with compare-at prices
- variant groups (اللون / المقاس / النوع) and real stock per variant
- quantity packs 2 → 5 200 دج, 3 → 7 200 دج
- shipping zones (home/office) incl. the wilaya-0 fallback
- Arabic reviews (approved only) and FAQ (COD, delay, office delivery, tracking)
- published Arabic pages (about, FAQ, legal, privacy) and contact/WhatsApp

No copyrighted brands, no lorem ipsum, no English placeholders.
Demo owner: `yasmine.kaci@souqplus.demo` (`Flexigo!2026demo`).

## 9. Registry changes

`lib/templates/defaults.ts` — one new `TemplateMeta` entry: canonical key
`souq-v1`, name “SOUQ”, category *General Algerian COD Store*, website type
`ecommerce`, `language: "ar"`, `direction: "rtl"`, theme
`#0f2a47 / #f59e0b / #f8fafc`, Arabic badges (Arabic-first, RTL, COD,
Mobile-first), highlights, and desktop + mobile preview images. Alias `souq`
is canonicalised by `canonicalTemplateKey()` before any write, and
`getTemplate()` resolves both keys. The admin gallery and the creation wizard
render the mobile preview next to the desktop one; selecting SOUQ pre-fills
Arabic and COD-friendly defaults in the wizard.

## 10. Database migration

`supabase/migrations/20260918000017_souq_template.sql` — registers the
`souq-v1` row in `public.templates` (upsert on conflict), the only DB change
SOUQ needs: no new table, no new column, no RLS change, no new function.
It is bundled at the end of `supabase/FLEXIGO_FULL_SETUP.sql` as well.
Existing stores are **not** migrated: only a store that explicitly selects
`souq-v1` renders the new template.

```sql
update public.stores set template_key = 'souq-v1' where slug = 'my-store';
```

## 11. Test results

| suite | result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint .` | 0 problems |
| `npx vitest run tests/unit` | **53 passed / 0 failed** |
| `node tests/integration/run.mjs` | **87 passed / 0 failed** |

- Unit — 37 logic tests (option groups, single/multiple selection, packs and
  totals, zones, badges, Arabic copy, search, settings, palette) and 16
  server-markup tests (card, offer labels `قطعة واحدة / قطعتان / 3 قطع`,
  real delivery radios, the 58 wilaya options, honeypot, unavailable state,
  sticky CTA).
- Integration — section 8 adds 24 assertions on the real PostgreSQL schema:
  registry row, template isolation (another tenant sees nothing), Arabic
  content, zone pricing with the wilaya fallback, server-side totals,
  stock decrement for both product and variant lines, and phone validation.

## 12. Build result

`npm run build` → `✓ Compiled successfully`, all storefront and admin routes
generated, no warnings for the new code.

## 13. Routes to review

| route | what to look at |
|---|---|
| `/s/souq-plus` | RTL home: promo bar, hero (desktop + mobile image), categories, trending, offers, best sellers, reviews, FAQ, footer |
| `/s/souq-plus/boutique` | shop grid, search, empty states |
| `/s/souq-plus/categorie/electronics` | filtered category page |
| `/s/souq-plus/produit/saat-dhakiyya` | gallery, dynamic variants, packs, COD form, sticky CTA |
| `/s/souq-plus/commande?product=<id>` | standalone COD checkout |
| `/s/souq-plus/faq`, `/a-propos`, `/mentions-legales`, `/confidentialite` | Arabic content pages |
| `/admin/templates` | SOUQ card with desktop + mobile preview |
| `/admin/sites/nouveau` | create a store with SOUQ → Arabic defaults pre-filled |

## 14. Notes & activation

- Live preview requires Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); the sandbox has
  no `.env.local`, so the storefront can only be reviewed once the project is
  connected — the pages were verified through the build, the server-markup tests
  and the database integration suite.
- `settings.checkout` (fields, quantity, offers, delivery choice, variant
  display) is optional: when absent SOUQ uses the documented defaults, so no
  data migration is required for existing stores.
- Client-side interactivity (drawer, accordion, sticky CTA scrolling, live
  recalculation) is covered by markup/behaviour tests, not by a browser
  automation run.
