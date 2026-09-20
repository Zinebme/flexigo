# LAMSA security notes

- Tenant dispatch requires the exact `lamsa-v1` template key.
- The migration registers metadata only and never updates a store.
- Production data comes from existing RLS-backed catalog loaders.
- Checkout sends identifiers and contact/delivery fields to the shared endpoint; browser totals are display-only.
- `fn_place_cod_order` remains authoritative for tenant scope, product/variant availability, stock, offers, shipping, and final totals.
- Static previews use no Supabase client and preview-mode submission never sends a request.
- Merchant product content renders as React text. JSON-LD is JSON-serialized with HTML-significant characters escaped to prevent closing-script injection.
- Section image schema permits only HTTPS URLs or normalized bundled `/images/` paths and rejects traversal.
