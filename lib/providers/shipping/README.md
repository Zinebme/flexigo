# Shipping Providers — Algerian COD

This directory contains the abstraction for Algerian delivery providers.

## Supported Providers (interface only, no hardcoded secrets)

- **Manual** (default): merchant handles delivery manually, no API.
- **Navex**: Interface + schema + config UI + mock adapter. TODO: real API docs needed — do NOT invent endpoints. Provide `API base URL`, `token`, `account` fields, encrypted server-side (fxenc1.*), Test connection / Activate buttons call `/api/dashboard/integrations/shipping/test` which currently returns mock success if credentials present, but will call real endpoint once docs available.
- **Yalidine**: Same pattern — requires official API documentation for `create shipment`, `track`, `cancel`. Do not invent.
- **Ecotrack**: Same — needs docs.
- **ZR Express**: Same — needs docs.
- **Generic**: For any provider with custom API — user provides base URL + token, we store encrypted, we call via generic adapter that expects standard REST endpoints (`/shipments`, `/track/{id}`) but will be adapted once provider spec known.

## Security

- Credentials stored ENCRYPTED (fxenc1.*) via `lib/crypto/encrypt.ts`
- Never exposed to browser (server-only decrypt)
- Test connection endpoint uses service_role, logs result in `integration_logs`, never leaks token
- RLS: only platform admin and store members can read integration status (masked)

## TODO — What requires docs

- Navex: actual endpoint URLs, auth method (Bearer? API key header?), shipment creation payload, tracking response format
- Yalidine: API base, auth, wilaya/commune codes mapping, pricing API
- Ecotrack: same
- ZR Express: same
- Generic: define minimal required endpoints to be considered "connected"

## Implementation Status

- DB table `shipping_integrations` exists with `config` jsonb encrypted fields
- UI in wizard step 7 + /admin/sites/[id] → Livraison + /dashboard/livraison shows provider selection
- API route `/api/dashboard/integrations/shipping` handles save (encrypted) and test (mock)
- Real HTTP calls are behind `if (provider === 'manual') return mock` — no invented endpoints

## ChatGPT Sites Compatibility

- No Node-only native deps, only `node:crypto` for encryption (available in Vercel/Hostinger/Docker)
- All shipping logic is server-side, compatible with Edge? Currently Node.js runtime for encryption — okay for Vercel.
