# FlexiGo — Multi-tenant SaaS COD E-commerce (Algérie)

Plateforme SaaS multi-tenant pour créer et gérer des boutiques e-commerce COD (paiement à la livraison) en Algérie. Architecture générique/portable, pensée pour Vercel, Hostinger VPS et Docker.

**Modèle métier:** vous (SUPER_ADMIN) créez et configurez entièrement les sites clients via un master dashboard privé en français et livrez clé en main. Les clients gèrent ensuite leur boutique via leur propre dashboard français. Ils ne créent jamais de sites from scratch, ne voient jamais les autres tenants ni les outils super-admin.

## Stack

- **Next.js 16.3.5** (App Router, `proxy.ts`, Turbopack), **TypeScript strict**, **React 19**, **Tailwind v4**
- **Supabase** (Postgres + Auth + Storage + RLS) — portable (peut tourner sur Postgres local pour les tests)
- **Zod** validation, **Vitest** + embedded-postgres pour les tests d'intégration RLS
- **Docker** (standalone output), **docker-compose**, **GitHub Actions CI**

## Tenancy & Sécurité (non-négociable)

- `organizations → stores` (slug unique, status draft/active/suspended/archived, website_type ecommerce/single_product/portfolio, template_key)
- `profiles`, `store_members` (OWNER/MANAGER/ORDER_MANAGER/VIEWER/CONTENT_EDITOR, status invited/active/revoked), `platform_admins` (SUPER_ADMIN séparé, jamais assignable depuis l'UI marchande)
- `domains` (hostname unique, is_primary, status pending/verified/failed, verification_token)
- **RLS sur toutes les tables tenant** — membership-based, recursion-safe, documenté dans `20260918000011_rls.sql`
- IDOR prévention, service_role jamais client-side / jamais NEXT_PUBLIC_ / jamais commité
- Opérations privilégiées server-side uniquement (`fn_create_store`, `fn_publish_page`, `fn_restore_page_version`, `fn_copy_store`, `fn_place_cod_order`)
- Zod partout, recalcul server-side des prix/totaux, auth ≠ authorization, audit logs (actor, tenant, action, entity, safe before/after, pas de secrets), rate limits checkout (10/10min IP + honeypot + détection doublons + validation téléphone DZ), upload validation (MIME/size, signed URLs, bucket public images), CSP + security headers, secrets chiffrés AES-256-GCM (`fxenc1.*`), soft deletion, confirmations, re-auth ops critiques super-admin, MFA-capable, sanitize rich text, system logs, backup/restore docs.

## Fonctionnalités

### Super Admin (Français)

- **Vue d'ensemble**: totaux, GMV clairement labellisé "ce n'est pas un revenu de la plateforme", commandes, sites avec erreurs (7j), activité récente (audit), events système
- **Clients**: organisations
- **Sites**: liste (nom, slug, type, template, statut, owner_email, commandes, CA, domaine, intégrations, dernière activité) + actions: voir site, aperçu, dashboard client, accès assistance (silencieux), administration avancée, publier/dépublier/suspendre/réactiver/archiver/restaurer, dupliquer, configurer domaine, gérer intégrations, logs, exporter CSV
- **Templates**: 4 modèles visuellement distincts (Ecommerce Modern, Fashion Luxury, Single Product COD, Portfolio Professional) — couleurs, typo, forme boutons
- **Domaines**: hostname-based resolution via `proxy.ts`, provider-neutral verification, UI ajout/instructions/statut/primaire, preview subdomain `/s/[slug]`
- **Commandes plateforme**: vue globale filtrée par site/statut
- **Intégrations**: shipping (manual/navex placeholder/mock), marketing pixels (Meta, TikTok, Snapchat, Pinterest, GA4, GTM, Google Ads — IDs uniquement, pas de code), Google Sheets (SA JSON chiffré, RS256 JWT, `values:append`), WhatsApp (interface pluggable + bouton contact)
- **Santé système**: events (error/warning/info)
- **Support**: sessions d'assistance silencieuses (aucune notif client, audit complet, bannière super-admin-only "Mode assistance — [Store]" + bouton quitter, httpOnly cookie 8h)
- **Utilisateurs**: comptes + gestion platform_admins (add/remove avec re-confirmation, dernier super-admin protégé)
- **Journal/Audit**: 200 dernières entrées
- **Paramètres**: env vars, contrôles sécurité, setup initial super admin, déploiement

### Wizard création site (8 étapes)

Client → Type → Template → Identité (nom, slug, logo, couleurs, langue) → Contact → Contenu initial (catégories, produits brouillons inactifs) → Livraison (frais domicile/bureau, COD, bureau, avis, FAQ) → Marketing (pixels IDs) → Création via `POST /api/admin/stores` (owner_email doit exister, sinon message "le client doit d'abord créer son compte") → preview URL `/s/[slug]` → brouillon

- Auto-crée: store (draft), settings, theme, pages (v0), sections, membership OWNER, shipping_zones, store_counters, catégories/produits initiaux, marketing_integrations
- Produits wizard inactifs jusqu'à validation

### Merchant Dashboard (Français, responsive)

- Tableau de bord, Commandes (16 statuts FR, wilaya/commune, home/office, téléphone normalisé, UTM/referrer, tracking, provider, bulk ops, filtres, export CSV), Produits (variants, quantity offers "2 pièces = 3 900 DA", stock, featured, SEO — totaux toujours recalculés server-side), Catégories, Clients (par téléphone normalisé + store_id, jamais cross-tenant), Mon site (pages + sections), Apparence (logo, favicon, couleurs, typo approuvée, forme boutons, annonce), Statistiques, Livraison (zones par wilaya, providers), Marketing (pixels config champs fixes, events PageView/ViewContent/AddToCart/InitiateCheckout/Purchase valeur depuis totaux validés server-side), Équipe (invitations par email existant, rôles FR: Propriétaire/Gestionnaire/Gestionnaire de commandes/Rédacteur/Lecteur, owner ne peut pas créer SUPER_ADMIN), Paramètres

### Système de contenu (structuré, PAS Wix-like)

- Template contrôle le design, marchand édite contenu uniquement: add/remove/reorder sections prédéfinies (banner, collections, popular products, secondary banner, reviews, FAQ, etc.), edit titles/subtitles/images/buttons, show/hide
- Pas de HTML/JS/CSS arbitraire, sanitize rich text, liens allow-list (`safeLink`)
- Bannières: 1600×700 desktop / 800×1000 mobile, warning basse résolution
- Draft/publish avec historique (`page_versions`), live = dernier publié, super admin peut restaurer via `fn_restore_page_version` (devient NOUVELLE version)
- Upload validation, signed URLs

### Storefronts

- 3 types (ecommerce, single-product COD, portfolio) + 4 templates distincts avec demo data réaliste
- FR+AR(RTL)+EN via `fx_lang` cookie, `getStorefrontData(slug, lang)` priorité arg > cookie > store.language, RTL via `data.dict.dir`
- Mobile-first, SEO: titles/meta/OG/canonical/sitemap/robots/product JSON-LD + dashboard SEO editing, image optimization, caching, lazy loading, pagination, pas de N+1
- Checkout: lignes = product_id/variant_id/quantity ONLY + store_slug + contact, zod → IP rate limit 10/10min → honeypot → normalizeDZPhone → active store → duplicate detect → `anon.rpc("fn_place_cod_order")`, success {ok, order_id, order_number, subtotal_cents, shipping_fee_cents, total_cents, status}

### Shipping

- Interface `ShippingProvider` (createShipment, cancelShipment, getShipment, getTrackingStatus, listOffices, validateDestination)
- Providers: Navex (pas d'endpoints inventés — placeholder + docs pour coller spec), manual, mock
- Config UI (base URL, token chiffré/jamais exposé, test connexion, statut), action "Envoyer au transporteur", store provider shipment ID/tracking/status/last sync

### Domaines

- `proxy.ts` default-exported `proxy` (Node runtime), toujours `await` params/searchParams/cookies()/headers(), layouts ne reçoivent jamais searchParams, eslint via `eslint .` avec subpath flat exports, Turbopack default, `output: "standalone"`
- Résolution hostname → store, vérification réelle par DNS TXT, super-admin UI (add, instructions, status, set primary), preview subdomain

## Seed (fake)

4 stores — Maison Almasa (fashion), NovaShop (general COD), PureSkin (single-product), Cabinet Horizon (portfolio)

- Users: `a0000000-…-0001` SUPER_ADMIN, `…0011` Sofia Almasa, `…0012` Karim NovaShop, `…0013` yacine, `…0014` amine, `…0021` Lina, `…0031` Amel; pw `Flexigo!2026demo`
- Orgs `c000…-0001..0004`, stores `b000…-0001..0004`, 36 orders, 27 pages v1 (legal = drafts), domains Almasa verified / NovaShop pending

## Installation locale

```bash
git clone <repo>
cd flexigo
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, CREDENTIALS_ENCRYPTION_KEY
npm ci
npm run dev # http://localhost:3000
```

### Supabase setup

1. Créer projet Supabase
2. Appliquer migrations: `supabase/migrations/*.sql` dans l'ordre (0001..0014) via SQL editor ou `psql`
3. Le bucket Storage public `store-assets` est créé par les migrations. Les objets suivent `stores/{store_id}/{purpose}/{filename}`.
4. Créer premier super admin:
   ```sql
   -- 1. Créer compte via /register
   -- 2. Dans SQL editor:
   insert into platform_admins (user_id, role) values ('<uuid>', 'SUPER_ADMIN');
   ```
5. Seed optionnel: la migration 0013 contient templates + démo

### Tests

```bash
npm run test:integration # 62 tests RLS / tenant isolation / checkout / draft-publish / support / domain / copy
npm run lint
npm run typecheck
npm run build
```

- Tests prouvent: Merchant A ne peut pas accéder/modifier Merchant B products/orders/customers/config; users ordinaires ne peuvent pas appeler super-admin APIs ou s'auto-assigner rôles; impersonation ne peut pas être initiée par marchands; + auth, role permissions, order total calculation, product access, domain resolution, draft/publish, checkout, RLS assumptions.
- Runner: embedded-postgres port 54331 si `TEST_DATABASE_URL` non défini, sinon utilise URL externe.

### Scripts

- `scripts/local-db.sh test|migrate|seed|start` — helpers pour tests locaux

## Déploiement

### Vercel

- Build Next.js standalone (mais Vercel utilise son propre output)
- Env vars dans dashboard Vercel (ne jamais exposer service_role)
- Domaines: CNAME www → cname.vercel-dns.com, vérif via `/api/admin/domains/[id]/verify`

### Hostinger VPS / Docker

```bash
docker compose up --build
# Ou:
docker build -t flexigo .
docker run -p 3000:3000 --env-file .env.local flexigo
```

- Traefik/Nginx proxy hostname → container, `proxy.ts` gère résolution tenant
- Preview toujours `/s/[slug]`

### Env variables

Voir `.env.example` — jamais commiter `.env.local`, service_role, Google ou shipping credentials

## Sécurité — contrôles

- RLS sur toutes tables tenant, membership-based, recursion-safe; les brouillons `pages.content` sont interdits au rôle anon par privilèges de colonnes
- IDOR prévention
- service_role jamais client-side/NEXT_PUBLIC_/committé
- Opérations privilégiées server-side only; EXECUTE SQL deny-by-default pour anon/authenticated avec grants explicites
- Zod, recalcul server-side prix/totaux, auth ≠ authorization, audit logs, rate limits, anti-spam checkout, upload validation, XSS/CSRF/SQLi, CSP + security headers, jamais log secrets, chiffrage credentials externes, soft deletion, confirmations, re-auth ops critiques super-admin, MFA-capable, sanitize rich text, system logs, backup/restore docs

## CI

GitHub Actions (typecheck, lint, build, tests; pas de fuite secrets)

## Limitations connues

- Navex: placeholder adapter, pas d'endpoints réels — coller spec officielle dans `lib/providers/navex.ts` + `docs/navex.md`
- WhatsApp/Swivigo: interface seulement, bouton contact uniquement (pas d'envoi auto)
- Google Sheets: nécessite SA JSON + spreadsheet_id, testé via sync logs
- Pas de raw SQL editor (volontaire)
- GMV labellisé "ce n'est pas un revenu de la plateforme" partout

## Licence

Privé — tous droits réservés.


### Hardening sécurité V1

Avant production, la migration `0014_security_hardening.sql` applique notamment : protection colonne des brouillons, EXECUTE SQL deny-by-default, expiration DB des sessions support et politiques Storage alignées sur `store-assets`. La vérification des domaines passe par un TXT DNS réel.
