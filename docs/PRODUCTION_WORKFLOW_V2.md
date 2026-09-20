# FlexiGo — production workflow v2

This pass keeps the platform focused on the internal site-production workflow.

## Ready storefront templates

Only these templates are offered for new stores:

- SOUQ (souq-v1)
- LAMSA (lamsa-v1)
- NOOR (noor-v1)
- VOLT (volt-v1)
- DAR (dar-v1)

Older registry entries are kept in code only for backward compatibility with stores that may already reference them. They are not offered in the template gallery or creation wizard.

## Site studio

The creation wizard supports direct image uploads for logo, favicon, initial products and initial categories. Files are validated server-side and staged in the store-assets bucket before the store is created.

## Catalog

The merchant product editor groups the workflow into general information, direct multi-image upload, stock, dynamic variants, quantity offers, SEO and visibility.

## Delivery

Per-wilaya delivery pricing still uses the canonical 58-wilaya table. The delivery-company UI exposes a visual catalog and secure API Key / API Token configuration.

Navex retains its implemented adapter. Other carrier entries are configuration-ready but automatic shipment creation remains disabled until an official API contract is implemented and verified; FlexiGo must not guess third-party endpoints.

## Site lifecycle

Platform admins can edit, publish, suspend, archive, duplicate, export and soft-delete a site. Soft deletion sets deleted_at and archives the storefront while preserving data for recovery and audit.

## Existing capabilities preserved

Merchant team invitations by email, marketing pixels/tags, Google Sheets, Telegram, WhatsApp, domains, order shipping, customer management, statistics, RLS and audit logging are preserved.


## Validation

This pass keeps all advanced capabilities available while moving routine site production to the foreground. Destructive site removal is soft-delete only and audited.
