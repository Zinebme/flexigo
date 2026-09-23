"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDA, formatDateTimeFr, timeAgoFr } from "@/lib/utils";
import { Badge, Card, Table, Th, Td } from "@/components/ui";
import { SiteActions } from "./site-actions";
import { AdvancedAdminClient } from "./advanced-admin-client";
import { StoreSettingsEditor, AdminCheckoutSettingsEditor, ThemeEditor, AdminProductCreateForm, ProductQuickEditor, CategoryQuickEditor, CustomerAdminEditor, IntegrationsEditor, OwnerEditor, ContentAdminEditor, DomainControl } from "./site-control-forms";
import { SiteAssistant } from "./site-assistant";

type Tab = "overview" | "assistant" | "site" | "products" | "categories" | "orders" | "customers" | "stats" | "content" | "appearance" | "delivery" | "integrations" | "domain" | "account" | "logs" | "health";

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "overview", label: "Vue d'ensemble", icon: "📊" },
  { key: "assistant", label: "Assistant site", icon: "✦" },
  { key: "site", label: "Site", icon: "🏠" },
  { key: "products", label: "Produits", icon: "📦" },
  { key: "categories", label: "Catégories", icon: "🗂️" },
  { key: "orders", label: "Commandes", icon: "🛒" },
  { key: "customers", label: "Clients", icon: "👥" },
  { key: "stats", label: "Statistiques", icon: "📈" },
  { key: "content", label: "Contenu", icon: "📝" },
  { key: "appearance", label: "Apparence", icon: "🎨" },
  { key: "delivery", label: "Livraison", icon: "🚚" },
  { key: "integrations", label: "Intégrations", icon: "🔌" },
  { key: "domain", label: "Domaine", icon: "🌐" },
  { key: "account", label: "Compte client", icon: "👤" },
  { key: "logs", label: "Logs", icon: "📋" },
  { key: "health", label: "Santé", icon: "💚" },
];

interface Props {
  store: Record<string, unknown>;
  orgMap: Map<string, string>;
  members: Array<Record<string, unknown>>;
  profileMap: Map<string, { email: string | null; full_name: string | null; dashboard_language: "fr" | "ar" | "en" }>;
  domains: Array<Record<string, unknown>>;
  pages: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  customers: Array<Record<string, unknown>>;
  themes: Record<string, unknown> | null;
  audits: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  shipping: Array<Record<string, unknown>>;
  marketing: Array<Record<string, unknown>>;
  sheets: Record<string, unknown> | null;
  telegram: Record<string, unknown> | null;
  pageVersions: Array<{ id: string; page_key: string; version: number; created_at: string; published_by: string | null }>;
  gmv: number;
}

export function SiteControlCenter(props: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get("tab") as Tab | null;
    if (requested && TABS.some((item) => item.key === requested)) return requested;
    return searchParams.get("assistant") === "1" ? "assistant" : "overview";
  });
  const s = props.store;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{s.name as string}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-mono">/{s.slug as string}</span>
            <span>·</span>
            <span>{s.website_type as string}</span>
            <span>·</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">{s.template_key as string}</span>
            <Badge tone={(s.status as string) === "active" ? "green" : (s.status as string) === "suspended" ? "amber" : "gray"}>{s.status as string}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/s/${s.slug as string}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Voir site</a>
          <SiteActions store={{ id: s.id as string, name: s.name as string, slug: s.slug as string, status: s.status as never, website_type: s.website_type as never, template_key: s.template_key as string, owner_email: null, orders_count: props.orders.length, gmv_cents: props.gmv }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-slate-200 pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? "bg-violet-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4"><div className="text-xs uppercase text-slate-400">Commandes aujourd&apos;hui</div><div className="mt-1 text-xl font-bold">{props.orders.filter((o) => new Date(o.created_at as string).toDateString() === new Date().toDateString()).length}</div></Card>
            <Card className="p-4"><div className="text-xs uppercase text-slate-400">GMV (non annulées)</div><div className="mt-1 text-xl font-bold text-emerald-600">{formatDA(props.gmv)}</div><div className="text-xs text-slate-400">Chiffre d&apos;affaires brut — pas revenu plateforme</div></Card>
            <Card className="p-4"><div className="text-xs uppercase text-slate-400">Produits</div><div className="mt-1 text-xl font-bold">{props.products.length}</div></Card>
            <Card className="p-4"><div className="text-xs uppercase text-slate-400">Clients</div><div className="mt-1 text-xl font-bold">{props.customers.length}</div></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-bold">Configuration</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Organisation</dt><dd className="font-medium">{props.orgMap.get(s.organization_id as string) ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Langue / Devise</dt><dd>{s.language as string} / {s.currency as string}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Statut</dt><dd>{s.status as string} — v{s.published_version as number}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Créé</dt><dd>{formatDateTimeFr(s.created_at as string)}</dd></div>
                <div className="mt-2"><dt className="text-xs font-semibold uppercase text-slate-400">Settings JSON</dt><dd className="mt-1 max-h-40 overflow-auto rounded bg-slate-900 p-2 font-mono text-xs text-slate-100">{JSON.stringify(s.settings, null, 2)}</dd></div>
              </dl>
            </Card>
            <Card className="p-5">
              <h3 className="font-bold">Thème & branding</h3>
              {props.themes ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: (props.themes as { primary_color: string }).primary_color }} /> Primaire: {(props.themes as { primary_color: string }).primary_color}</div>
                  <div className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: (props.themes as { secondary_color: string }).secondary_color }} /> Secondaire: {(props.themes as { secondary_color: string }).secondary_color}</div>
                  <div>Typo: {(props.themes as { typography: string }).typography} · Boutons: {(props.themes as { button_shape: string }).button_shape}</div>
                  <div>Logo: {(props.themes as { logo_url: string | null }).logo_url ?? "—"}</div>
                </div>
              ) : <p className="text-sm text-slate-400">Aucun thème.</p>}
            </Card>
          </div>
        </div>
      )}

      {tab === "assistant" && (
        <SiteAssistant storeId={s.id as string} storeName={s.name as string} />
      )}

      {tab === "site" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold">Site — informations générales</h3>
            <p className="mt-2 text-sm text-slate-500">Modifiez directement le nom, le slug, la langue et la devise depuis le Master.</p>
            <div className="mt-4"><StoreSettingsEditor storeId={s.id as string} store={s} /></div>
          </Card>
          <Card className="p-5">
            <AdminCheckoutSettingsEditor storeId={s.id as string} initial={(s.settings as { checkout?: unknown } | null)?.checkout} />
          </Card>
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4"><h3 className="font-bold">Ajouter un produit complet</h3><p className="text-sm text-slate-500">Photos, descriptions, prix, coût, options, variantes, offres, stock, produits connexes, ordre de page et SEO.</p></div>
            <AdminProductCreateForm storeId={s.id as string} products={props.products} categories={props.categories} />
          </Card>
          <Card className="p-5">
            <div className="mb-4"><h3 className="font-bold">Produits existants ({props.products.length})</h3><p className="text-xs text-slate-500">Ouvrez n’importe quel produit pour retrouver la fiche complète : photos, descriptions, prix, coût, options, variantes, offres, stock, produits connexes, ordre de page et SEO.</p></div>
            <ProductQuickEditor key={JSON.stringify(props.products)} storeId={s.id as string} products={props.products} categories={props.categories} />
          </Card>
        </div>
      )}

      {tab === "categories" && (
        <Card className="p-5">
          <div className="mb-4"><h3 className="font-bold">Catégories ({props.categories.length})</h3><p className="text-xs text-slate-500">Gestion complète : nom, slug, description, image, ordre, visibilité, modification et suppression.</p></div>
          <CategoryQuickEditor key={JSON.stringify(props.categories)} storeId={s.id as string} categories={props.categories} />
        </Card>
      )}

      {tab === "orders" && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3"><h3 className="font-bold">Commandes ({props.orders.length})</h3></div>
          <Table head={<><Th>N°</Th><Th>Total</Th><Th>Statut</Th><Th>Date</Th></>}>
            {props.orders.map((o) => (
              <tr key={o.id as string} className="hover:bg-slate-50"><Td className="font-mono">{o.order_number as string}</Td><Td>{formatDA(o.total_cents as number)}</Td><Td><Badge tone={o.status === "delivered" ? "green" : o.status === "cancelled_customer" ? "red" : "gray"}>{o.status as string}</Badge></Td><Td className="text-xs text-slate-500">{timeAgoFr(o.created_at as string)}</Td></tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === "customers" && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-bold">Clients acheteurs ({props.customers.length})</h3>
            <p className="text-sm text-slate-500">Ajoutez, modifiez, suspendez, réactivez ou supprimez les clients de cette boutique. La suspension bloque les nouvelles commandes avec leur numéro sans effacer l’historique.</p>
          </div>
          <CustomerAdminEditor key={JSON.stringify(props.customers)} storeId={s.id as string} customers={props.customers} />
        </Card>
      )}

      {tab === "stats" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5"><h3 className="font-bold">Statistiques commandes</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div>Commandes aujourd&apos;hui : {props.orders.filter((o) => new Date(o.created_at as string).toDateString() === new Date().toDateString()).length}</div>
              <div>Ce mois : {props.orders.filter((o) => new Date(o.created_at as string).getMonth() === new Date().getMonth()).length}</div>
              <div>GMV : {formatDA(props.gmv)} (brut, pas revenu plateforme)</div>
              <div>Livrées : {props.orders.filter((o) => o.status === "delivered").length} — Annulées : {props.orders.filter((o) => String(o.status).startsWith("cancelled")).length}</div>
              <div>Taux confirmation : {props.orders.length ? Math.round((props.orders.filter((o) => !String(o.status).startsWith("cancelled")).length / props.orders.length) * 100) : 0}%</div>
            </div>
          </Card>
          <Card className="p-5"><h3 className="font-bold">Meilleurs produits / Stock faible</h3>
            <div className="mt-3 text-sm">
              <div>Produits actifs : {props.products.filter((p) => p.is_active).length}</div>
              <div>Stock faible (&lt;5) : {props.products.filter((p) => (p.stock as number) < 5).length}</div>
              <ul className="mt-2 space-y-1">{props.products.filter((p) => (p.stock as number) < 5).slice(0, 5).map((p) => <li key={p.id as string} className="text-amber-600">⚠️ {p.name as string} — {p.stock as number}</li>)}</ul>
            </div>
          </Card>
        </div>
      )}

      {tab === "content" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold">Contenu — éditeur structuré</h3>
            <p className="mt-2 text-sm text-slate-500">Modifiez directement les sections autorisées : titres, images, boutons, ordre et visibilité. Aucun HTML/CSS/JS libre.</p>
            <div className="mt-4">
              <ContentAdminEditor
                storeId={s.id as string}
                websiteType={s.website_type as "ecommerce" | "single_product" | "portfolio"}
                pages={props.pages}
                categories={props.categories}
              />
            </div>
          </Card>
          <AdvancedAdminClient storeId={s.id as string} storeSlug={s.slug as string} pageVersions={props.pageVersions} />
        </div>
      )}

      {tab === "appearance" && (
        <Card className="p-5">
          <h3 className="font-bold">Apparence — Thème & branding</h3>
          <p className="mt-2 text-sm text-slate-500">Le template garde son identité visuelle, mais vous pouvez ajuster branding, couleurs, typographie, boutons et annonce.</p>
          <div className="mt-4"><ThemeEditor storeId={s.id as string} theme={props.themes} /></div>
        </Card>
      )}

      {tab === "delivery" && (
        <Card className="p-5">
          <h3 className="font-bold">Livraison — COD 58 wilayas</h3>
          <p className="mt-2 text-sm text-slate-500">Domicile/Bureau, 58 wilayas, communes, prix. Prestataires : Navex / Yalidine / Ecotrack / ZR Express / Generic / Manual. Champs API base URL / token / credentials, Test connexion / Activer. Secrets jamais exposés client-side.</p>
          <div className="mt-3 text-sm">
            <div>Intégrations livraison configurées : {props.shipping.map((sh) => `${sh.provider_key}(${sh.status})`).join(", ") || "Aucune — Manual"}</div>
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Ne pas inventer endpoints Navex si docs non disponibles — fournir interface + schéma + config UI + mock adapter + TODO docs clairs.</div>
          </div>
        </Card>
      )}

      {tab === "integrations" && (
        <Card className="p-5">
          <h3 className="font-bold">Intégrations — configuration directe</h3>
          <p className="mt-2 text-sm text-slate-500">Shipping, pixels, Google Sheets et Telegram sont modifiables ici sans passer par le dashboard marchand.</p>
          <div className="mt-4"><IntegrationsEditor storeId={s.id as string} shipping={props.shipping} marketing={props.marketing} sheets={props.sheets} telegram={props.telegram} /></div>
        </Card>
      )}

      {tab === "domain" && (
        <Card className="p-5">
          <h3 className="font-bold">Domaine</h3>
          <p className="mt-2 text-sm text-slate-500">Ajout, vérification DNS réelle, domaine principal et suppression directement depuis ce site.</p>
          <div className="mt-4"><DomainControl storeId={s.id as string} domains={props.domains} /></div>
        </Card>
      )}

      {tab === "account" && (
        <Card className="p-5">
          <h3 className="font-bold">Compte client</h3>
          <p className="mt-2 text-sm text-slate-500">Modifiez le nom, le rôle et la langue, suspendez temporairement un accès ou retirez-le de cette boutique. Le compte Auth et les accès aux autres boutiques restent toujours conservés.</p>
          <div className="mt-5"><OwnerEditor key={JSON.stringify([props.members, Array.from(props.profileMap.entries())])} storeId={s.id as string} members={props.members} profileMap={props.profileMap} /></div>
        </Card>
      )}

      {tab === "logs" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="border-b border-slate-100 px-5 py-3"><h3 className="font-bold">Audit (30 derniers)</h3></div>
            <div className="max-h-96 overflow-auto">
              <Table head={<><Th>Quand</Th><Th>Action</Th><Th>Entité</Th></>}>
                {props.audits.map((a) => (
                  <tr key={a.id as string} className="hover:bg-slate-50"><Td className="text-xs text-slate-500" title={formatDateTimeFr(a.created_at as string)}>{timeAgoFr(a.created_at as string)}</Td><Td><Badge tone="gray">{a.action as string}</Badge></Td><Td className="text-xs">{a.entity as string}</Td></tr>
                ))}
              </Table>
            </div>
          </Card>
          <Card>
            <div className="border-b border-slate-100 px-5 py-3"><h3 className="font-bold">Events système (30 derniers)</h3></div>
            <div className="max-h-96 overflow-auto">
              <Table head={<><Th>Niveau</Th><Th>Message</Th><Th>Quand</Th></>}>
                {props.events.map((e) => (
                  <tr key={e.id as string} className="hover:bg-slate-50"><Td><Badge tone={(e.level as string) === "error" ? "red" : (e.level as string) === "warning" ? "amber" : "gray"}>{e.level as string}</Badge></Td><Td className="max-w-xs truncate text-xs" title={e.message as string}>{e.message as string}</Td><Td className="text-xs text-slate-500">{timeAgoFr(e.created_at as string)}</Td></tr>
                ))}
              </Table>
            </div>
          </Card>
        </div>
      )}

      {tab === "health" && (
        <Card className="p-5">
          <h3 className="font-bold">Santé — Diagnostics</h3>
          <p className="mt-2 text-sm text-slate-500">Intégration health : shipping, sheets, telegram, pixels, domaine. Super Admin voit diagnostics sanitized, merchant voit message générique.</p>
          <div className="mt-3 space-y-2 text-sm">
            <div>✅ RLS activé — tenant isolation vérifiée</div>
            <div>✅ Service_role jamais exposé navigateur</div>
            <div>✅ Prix recalculés côté serveur (checkout)</div>
            <div>✅ Secrets chiffrés fxenc1.*</div>
            <div>✅ Support silent + logged</div>
            <div>✅ Domain DNS vérification réelle (pas fake)</div>
            <div>⚠️ Vérifier manuellement : {props.shipping.length} intégrations livraison, {props.marketing.length} pixels, Telegram {props.telegram ? (props.telegram as { status: string }).status : "non configuré"}</div>
          </div>
        </Card>
      )}
    </div>
  );
}
