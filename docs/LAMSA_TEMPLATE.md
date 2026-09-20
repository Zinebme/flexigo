# LAMSA (`lamsa-v1`)

LAMSA is FlexiGo's Arabic-first (`ar`, RTL) premium modest-fashion storefront. It is an additive presentation layer selected only when a store has `template_key = 'lamsa-v1'`.

## Architecture

- Template UI: `components/storefront/templates-v2/lamsa/`
- Identity/defaults: `lib/templates/lamsa.ts`
- Copy, palette and self-hosted fonts: `lib/storefront/lamsa/`
- Static read-only fixtures: `lib/preview/lamsa-demo.ts`
- Registry migration: `supabase/migrations/20260918000018_lamsa_template.sql`
- Gallery artwork: `public/images/templates/lamsa-v1*.svg`

LAMSA reuses the existing anonymous/RLS catalog loaders, dynamic option resolver, quantity-offer pricing preview, 58-wilaya/commune data, shipping-zone lookup, and `POST /api/checkout`. The API/database function remains authoritative for variant IDs, stock, product/variant pricing, offers, shipping, and totals.

The LAMSA form sets no prices in the checkout payload. It submits only store/contact/delivery data and product/variant identifiers with quantities. Preview mode validates the same UI locally but cannot call the checkout endpoint.

## Preview

The production-safe static routes require no Supabase environment variables:

- `/preview/lamsa`
- `/preview/lamsa/produit`

Run locally:

```bash
npm run preview:lamsa
```

All preview pages are marked `noindex`, clearly display demo mode, use static fixtures, and cannot create real orders.

## Typography

The Arabic subsets of **Noto Kufi Arabic** (headings) and **IBM Plex Sans Arabic** (body/commerce UI) are self-hosted through `next/font/local` with `display: swap`. Font licenses are stored beside the WOFF2 files. The fallback stack is Tajawal, Arial, sans-serif.

## Isolation

No existing template key aliases to LAMSA. The registry migration uses `ON CONFLICT (key) DO NOTHING`, does not update stores, and touches no catalog, customer, order, or tenant data.
