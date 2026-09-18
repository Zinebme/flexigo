# ChatGPT Sites Compatibility & Limitations

## Kept Compatible

- **Framework**: Next.js 16 App Router with Turbopack (default bundler in Next 16). No custom webpack config.
- **Database**: Supabase as external backend (no local Postgres required). All queries via `@supabase/supabase-js` (works in Edge and Node).
- **Auth**: Supabase Auth via cookies (server components). No NextAuth that requires DB adapter.
- **File storage**: Supabase Storage (not local filesystem) for uploads.
- **Encryption**: `node:crypto` for AES-256-GCM (fxenc1.*) — available in Vercel, Hostinger, Docker. Not using native bindings. If running on Edge runtime, encryption would need Web Crypto — currently we use `runtime = "nodejs"` for routes that decrypt.
- **No unnecessary Node-only infra**: No BullMQ, no Redis, no local file queues. Background jobs are via `integration_logs` table + manual sync buttons.
- **Portability**: Works on Vercel (serverless), Hostinger (Node), Docker (via Dockerfile + docker-compose.yml). Domain logic provider-neutral (CNAME + TXT verification, not Vercel-specific).

## Limitations / What Needs Attention for ChatGPT Sites

- **Node.js runtime required for**: `/api/checkout`, `/api/dashboard/integrations/*`, `/api/admin/*`, any route that uses `encryptSecret`/`decryptSecret` (uses `node:crypto`). ChatGPT Sites supports Node.js runtime, but if they enforce Edge-only, we would need to migrate encryption to Web Crypto subtle.
- **Supabase service_role**: Must be set as env var `SUPABASE_SERVICE_ROLE_KEY` server-only, never `NEXT_PUBLIC_`. In ChatGPT Sites, set as secret env.
- **CREDENTIALS_ENCRYPTION_KEY**: 32 bytes base64, required in production for encrypting Telegram bot tokens, Google Sheets service accounts, shipping tokens. Generate with `openssl rand -base64 32`.
- **Image domains**: `picsum.photos` used for default template images — in production replace with real CDN or Supabase Storage URLs. Add to `next.config.ts` `images.remotePatterns`.
- **Template screenshots**: `/public/images/templates/*.png` referenced but not yet generated — wizard uses emoji placeholders. For production, generate real screenshots (1600×900) for each of 8 templates.
- **Telegram**: Requires outbound HTTPS to `api.telegram.org` — allowed in most hosts, but check firewall.
- **Google Sheets**: Requires outbound to `oauth2.googleapis.com` and `sheets.googleapis.com`.
- **Shipping providers**: Mock adapters now — real HTTP calls need outbound allowed + docs.

## Security Preserved

- RLS enabled on all tenant tables, including new `telegram_integrations` and `google_sheets_integrations`
- Tenant isolation via `store_members` (not `owner_user_id` on stores)
- service_role never in browser
- Prices recalculated server-side in `fn_place_cod_order`
- Support silent + logged (no email/notification to client, but fully audited in `audit_logs` + `support_sessions`)
- No stack traces to merchants, sanitized diagnostics for Super Admin
- No arbitrary JS/CSS editors, no merchant-injected JS, rich text sanitized

## Deployment Steps

1. Set env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CREDENTIALS_ENCRYPTION_KEY`
2. Run migrations: `supabase/migrations/*` in order (0014 adds 8 templates + telegram + gsheets, 0015 adds dashboard_language)
3. Seed templates: migration 0013 + 0014 insert 8 new templates (ELEGANCE, GLOW, TECH, CASA, LITTLE, ACTIVE, MARKET, CONVERT) + 4 legacy
4. Create first SUPER_ADMIN: insert into `platform_admins` with your user_id
5. Login → /admin → + Nouveau site → 11-step wizard
