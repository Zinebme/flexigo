# NOOR — `noor-v1`

NOOR is a production storefront template inside the existing FlexiGo platform for
Algerian COD merchants in **beauty / skincare / cosmetics / perfume / haircare /
personal care**. It is Arabic-first and fully RTL.

It is a **presentation layer only**. It reuses the platform's Supabase + RLS,
tenant isolation, catalog, dynamic variants, quantity offers, shipping zones, the
secure COD checkout engine (`/api/checkout` + `fn_place_cod_order`), the merchant
dashboard and the Super Admin site studio. It adds **no** second backend, orders
table, or checkout logic.

## Selection

- Registry key: `noor-v1` (registered by `supabase/migrations/20260918000019_noor_template.sql`).
- Only stores explicitly created with `template_key = 'noor-v1'` render NOOR. Existing
  stores are never migrated.
- Selectable from the existing site-creation studio; theme defaults, default pages and
  section composition come from `lib/templates/noor.ts` + `lib/templates/defaults.ts`.

## Isolation

All NOOR components live under `components/storefront/templates-v2/noor/`.
Design tokens, fonts and copy live under `lib/storefront/noor/`.
CSS is scoped under `.noor-root` and only uses `--noor-*` variables (every used token is
defined in `noorCssVars`). The shared secure COD/variant widgets are re-skinned by
exposing `--souq-*` aliases from `noorCssVars` — their markup and behaviour are untouched.

## Typography (self-hosted, no runtime font fetch)

- Headings / display: **Alexandria** (`lib/storefront/noor/font-files/alexandria-*.woff2`).
- Body / forms / nav / commerce UI: **IBM Plex Sans Arabic** (`ibm-plex-sans-arabic-*.woff2`).
- Fallback: `Tajawal, sans-serif`. Both are OFL-licensed (see `*-LICENSE.txt`).

## Design system

Warm white `#FFFDFC`, blush `#F6E8E6`, soft nude `#E9D6CF`, dusty rose `#C78F8B`,
sage `#A7B7A0`, deep plum/cocoa `#4B3538`, soft gold `#C5A26B`. Rounded 18–24px surfaces,
soft shadows, subtle `fade-up / reveal / drawer` motion, and full
`prefers-reduced-motion` support.

## Sections

Homepage composition (structured, validated JSON only): hero, collections (category
cards), products (best sellers / new arrivals), features (benefit cards), `how_it_works`
(routine), banner (promotion), offer, `social_proof` (results/stats), reviews, gallery
(social), faq, contact.

The optional `before_after` section type is **additive** to the shared catalog and only
renders when the merchant supplies both images — the template never invents results.

## Product page

Mobile order: gallery → name → rating → price → benefit summary → variants → quantity
offers → inline COD form → description → reviews → FAQ → related. The gallery supports
swipe (mobile), thumbnails (desktop), zoom and an active indicator. A sticky mobile CTA
collapses when the COD form is visible/focused.

## Security

- The browser submits identifiers only (`product_id` / `variant_id` / `quantity`); the
  server recomputes prices, offers, shipping and totals.
- Invalid variant combinations are blocked client-side and would be rejected
  server-side; raw server errors are never surfaced to shoppers.
- Before/after, stats and reviews only render merchant-provided data; verified-purchase
  badges are shown only when genuinely linked to an order.

## Previews (no credentials)

- `/preview/noor` and `/preview/noor/produit` render from static fixtures in
  `lib/preview/noor-demo.ts`. They never create orders or read tenant data.
- Gallery artwork: `public/images/templates/noor-v1.svg` and `noor-v1-mobile.svg`.
