# SOUQ — Arabic-first Algerian COD storefront template

SOUQ (سوق) is the first production storefront template of FlexiGo aimed at the
Algerian cash-on-delivery market: **Arabic-first, RTL, mobile-first**, with a
conversion-oriented product page (dynamic variants, quantity offers, COD form,
sticky mobile CTA).

It is **not** a separate app: SOUQ is a presentation layer on top of the shared
platform (same Supabase project, same catalog, same `fn_place_cod_order`
checkout, same dashboard, same RLS).

---

## 1. Template key

| | |
|---|---|
| Canonical key | `souq-v1` (stored in `stores.template_key` and `public.templates`) |
| Accepted alias | `souq` — canonicalized by `lib/templates/souq.ts` before any write |
| Registry (code) | `lib/templates/defaults.ts` → `TEMPLATES` |
| Registry (DB) | migration `20260918000017_souq_template.sql` |
| Website type | `ecommerce` |
| Default language | `ar` (RTL) |
| Default palette | primary `#0f2a47` · accent `#f59e0b` · surface `#f8fafc` |

`isSouqTemplate()` / `canonicalTemplateKey()` in `lib/templates/souq.ts` are the
only places that know about both keys.

## 2. Files

Logic (`lib/storefront/souq/`):

| file | role |
|---|---|
| `tokens.ts` | palette + CSS variables (`--souq-*`), contrast helpers |
| `copy.ts` | full Arabic copy (+ fr/en overrides), RTL flag |
| `variants.ts` | option-group model: merchant config + derivation from `product_variants.options`, single/multiple selection, validation, add-on resolution |
| `order-model.ts` | display preview: lines, quantity offers, shipping, savings, badges |
| `checkout-settings.ts` | `checkout_settings` shape (fields, quantity, offers, delivery, variant display) read from `stores.settings` |
| `format.ts` | price/date formatting (`2 900 دج` / `2 900 DA`) |
| `search.ts` | Arabic-normalized local search over a server-rendered index |
| `catalog.ts` | anon (RLS-respecting) loaders: home bundle, shop, product bundle, zones, settings |
| `lib/algeria/wilayas-ar.ts` | Arabic names of the 58 wilayas (additive helper) |

Components (`components/storefront/templates-v2/souq/`):

`souq-shell.tsx` (header + footer + providers), `souq-header.tsx`,
`souq-footer.tsx`, `souq-search.tsx`, `souq-ui.tsx`, `souq-product-card.tsx`,
`souq-product-page.tsx`, `souq-product-view.tsx`, `souq-order-form.tsx`,
`souq-sticky-cta.tsx`, `souq-sections.tsx`, `souq-shop.tsx`,
`souq-shop-page.tsx`, `souq-checkout-page.tsx`, `souq.css`.

## 3. How it is wired (additive only)

| file | change |
|---|---|
| `app/(storefront)/s/[slug]/layout.tsx` | render `<SouqShell>` when the store template is SOUQ, otherwise the legacy header/footer |
| `app/(storefront)/s/[slug]/page.tsx` | passes the section index (SOUQ anchor ids) |
| `components/storefront/sections.tsx` | early return to `<SouqSection>` for SOUQ keys; all legacy branches untouched |
| `…/produit/[product]/page.tsx` | SOUQ product page + product OG image |
| `…/boutique/page.tsx`, `…/categorie/[category]/page.tsx` | SOUQ shop / category pages |
| `…/commande/page.tsx` | SOUQ checkout page (same `/api/checkout`) |
| `app/api/checkout/route.ts` | optional `locale: "ar"` → Arabic messages (absent ⇒ historical French) |
| `app/api/dashboard/settings/route.ts` | keeps unknown settings keys on save (SOUQ `checkout` block survives) |
| `app/api/admin/stores/route.ts` | canonicalizes the alias, applies the template default language |
| `app/admin/templates/page.tsx`, `components/admin/wizard-client.tsx` | desktop + mobile preview, Arabic defaults when SOUQ is selected |
| `lib/sections/definitions.ts` | hero gains optional `desktop_image`, `mobile_image`, `badge`, `promo_text` |

Everything else (`ecommerce-modern`, `fashion-luxury`, `single-product`,
`portfolio`, `elegance`, `glow`, `tech`, `casa`, `little`, `active`, `market`,
`convert`) is untouched and keeps rendering exactly as before.

## 4. Checkout configuration

SOUQ reads an optional `stores.settings.checkout` block; **absent config means
the documented defaults**, so nothing has to be migrated:

```jsonc
{
  "checkout": {
    "fields": [{ "key": "email", "enabled": false, "required": false }],
    "show_quantity": true,
    "show_quantity_offers": true,
    "show_delivery_choice": true,
    "variant_display": "dynamic"
  }
}
```

Displayed totals are a convenience preview computed with the shared pricing
helpers (`lib/orders/pricing.ts`). The **authority stays `fn_place_cod_order`**:
prices, quantity offers, shipping fees and stock are recomputed server-side and
the browser never sends a price.

## 5. Demo store

`supabase/seed.sql` seeds **سوق بلس** (`/s/souq-plus`, template `souq-v1`,
language `ar`) with 5 Arabic categories, 6 products (ساعة ذكية رياضية، سماعات
لاسلكية، مصباح LED، منظم مطبخ، جهاز تنظيف صغير، جهاز مساج محمول), variant groups
(اللون / المقاس / النوع), quantity packs (2 → 5 200 دج, 3 → 7 200 دج), wilaya
shipping zones, Arabic reviews and FAQ, and published Arabic pages.

Demo owner: `yasmine.kaci@souqplus.demo` (password `Flexigo!2026demo`).

## 6. Previewing without credentials

The storefront talks to Supabase through RLS, so a live preview normally needs
credentials. For design review there is a development-only harness:

```bash
npm run preview:souq        # FLEXIGO_PREVIEW=1 next dev -H 0.0.0.0
# then open /s/souq-plus  (home, /boutique, /produit/saat-dhakiyya, …)
```

With `FLEXIGO_PREVIEW=1`, `instrumentation.ts` registers an **in-memory
read-only** Supabase double (`lib/preview/souq-demo.ts`) holding the same rows
the SQL seed inserts for «سوق بلس», so the real pages, sections, product page
and COD form render exactly as they will in production.

Guardrails:

- the harness only activates when that variable is set at boot — production
  never registers it (`lib/supabase/preview-override.ts` stays inert);
- reads only: orders can never be written through the preview, the real
  `/api/checkout` + `fn_place_cod_order` path is untouched;
- remote demo images bypass the image optimizer in preview mode only
  (`unoptimized` under the same flag) because the sandbox has no outbound
  network; the browser fetches them directly.

## 7. Verification

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm test                 # vitest — SOUQ logic + rendering tests
npm run test:integration # migrations + seed + RLS/checkout incl. SOUQ section 8
npm run build            # production build
```
