"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { READY_TEMPLATES, type TemplateMeta, defaultHomeSections, templatePreviewPath } from "@/lib/templates/defaults";
import { slugify } from "@/lib/slug";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "@/components/ui";
import { WILAYAS } from "@/lib/algeria/wilayas";
import { StudioProductDraftEditor, EMPTY_STUDIO_PRODUCT, type StudioProductDraft } from "@/components/admin/studio-product-draft";

interface Org { id: string; name: string }
interface Profile { id: string; email: string | null }

type DashboardLang = "fr" | "ar" | "en";

interface FormState {
  // 1 CLIENT
  create_new_client: boolean;
  organization_id: string;
  client_name: string;
  business_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  owner_whatsapp: string;
  account_mode: "create_now" | "invite_later";
  // 2 TEMPLATE
  template_key: string;
  template_filter: string;
  // 3 BRAND IDENTITY
  slug: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  language: "fr" | "ar" | "en";
  currency: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  address: string;
  // 4 HOMEPAGE CONTENT
  homepage_sections: Array<{ id: string; type: string; title: string; enabled: boolean }>;
  // 5 PRODUCTS
  initial_categories: Array<{ name: string; image_url: string; slug: string }>;
  initial_products: StudioProductDraft[];
  // 6 CATEGORIES detailed
  // 7 COD DELIVERY
  default_home_fee: string;
  default_office_fee: string;
  office_delivery_enabled: boolean;
  manual_shipping_zones: Array<{ wilaya_code: number; home_fee: string; office_fee: string; is_active: boolean }>;
  shipping_provider:
    | "manual" | "navex" | "yalidine" | "guepex" | "yalitec" | "ecotrack" | "zr"
    | "ecom_delivery" | "abex" | "colireli" | "colireli_ecotrack" | "isr" | "leopard" | "generic";
  shipping_api_base: string;
  shipping_api_token: string;
  shipping_account: string;
  // 8 INTEGRATIONS
  meta_pixel_id: string;
  tiktok_pixel_id: string;
  snapchat_pixel_id: string;
  pinterest_tag_id: string;
  ga4_measurement_id: string;
  gtm_container_id: string;
  google_ads_customer_id: string;
  google_sheets_id: string;
  google_sheets_json: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  whatsapp_number: string;
  // 9 DOMAIN
  custom_domain: string;
  domain_mode: "preview" | "custom";
  // 10 CLIENT ACCOUNT
  dashboard_language: DashboardLang;
  // 11 FINAL REVIEW
  publish_mode: "draft" | "publish" | "deliver";
  cod_enabled: boolean;
  reviews_enabled: boolean;
  faq_enabled: boolean;
}

const STEPS = [
  { key: "client", label: "CLIENT", desc: "Informations client & compte marchand" },
  { key: "template", label: "TEMPLATE", desc: "5 boutiques complètes prêtes à livrer" },
  { key: "brand", label: "IDENTITÉ", desc: "Branding, couleurs, contact" },
  { key: "homepage", label: "CONTENU", desc: "Sections homepage prédéfinies" },
  { key: "products", label: "PRODUITS", desc: "Produits initiaux" },
  { key: "categories", label: "CATÉGORIES", desc: "Collections & visibilité" },
  { key: "delivery", label: "LIVRAISON COD", desc: "58 wilayas + prestataires" },
  { key: "integrations", label: "INTÉGRATIONS", desc: "Pixels, Sheets, Telegram, etc." },
  { key: "domain", label: "DOMAINE", desc: "Aperçu & domaine personnalisé" },
  { key: "account", label: "COMPTE CLIENT", desc: "Accès marchand & langue dashboard" },
  { key: "review", label: "FINAL REVIEW", desc: "Checklist & publication" },
] as const;

const TEMPLATE_FILTERS = ["all", "Fashion", "Beauty", "Tech", "Home", "General store"] as const;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function WizardClient({ organizations, profiles }: { organizations: Org[]; profiles: Profile[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ store_id: string; slug: string; preview_url: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    create_new_client: true,
    organization_id: "",
    client_name: "",
    business_name: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    owner_whatsapp: "",
    account_mode: "create_now",
    template_key: "souq-v1",
    template_filter: "all",
    slug: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#2563eb",
    secondary_color: "#f59e0b",
    accent_color: "#10b981",
    language: "fr",
    currency: "DZD",
    contact_phone: "",
    contact_whatsapp: "",
    contact_email: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    address: "",
    homepage_sections: [],
    initial_categories: [],
    initial_products: [],
    default_home_fee: "400",
    default_office_fee: "600",
    office_delivery_enabled: true,
    manual_shipping_zones: WILAYAS.map((w) => ({ wilaya_code: w.code, home_fee: "400", office_fee: "600", is_active: true })),
    shipping_provider: "manual",
    shipping_api_base: "",
    shipping_api_token: "",
    shipping_account: "",
    meta_pixel_id: "",
    tiktok_pixel_id: "",
    snapchat_pixel_id: "",
    pinterest_tag_id: "",
    ga4_measurement_id: "",
    gtm_container_id: "",
    google_ads_customer_id: "",
    google_sheets_id: "",
    google_sheets_json: "",
    telegram_bot_token: "",
    telegram_chat_id: "",
    whatsapp_number: "",
    custom_domain: "",
    domain_mode: "preview",
    dashboard_language: "fr",
    publish_mode: "draft",
    cod_enabled: true,
    reviews_enabled: true,
    faq_enabled: true,
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function uploadAdminFile(file: File, purpose: "product" | "category" | "logo" | "favicon", key: string): Promise<string | null> {
    setUploadingKey(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", purpose);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: { message?: string } | string; warnings?: string[] };
      if (!res.ok || !data.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Téléversement impossible"));
        return null;
      }
      if (data.warnings?.length) setError(`⚠️ ${data.warnings[0]}`);
      return data.url;
    } finally {
      setUploadingKey(null);
    }
  }

  // Derived template list
  const filteredTemplates = useMemo(() => {
    let list = READY_TEMPLATES;
    if (form.template_filter !== "all") {
      list = list.filter((t) => t.category === form.template_filter);
    }
    // Only show ecommerce + single_product for now (portfolio separate)
    return list;
  }, [form.template_filter]);

  const selectedTemplate = useMemo(() => READY_TEMPLATES.find((t) => t.key === form.template_key), [form.template_key]);

  // Initialize homepage sections when template changes
  const initHomepageSections = () => {
    const sections = defaultHomeSections(form.template_key, form.template_key === "convert" ? "single_product" : "ecommerce", form.business_name || "Boutique");
    update("homepage_sections", sections.map((s) => ({ id: s.id, type: s.type, title: (s as unknown as { title?: string }).title ?? s.type, enabled: true })));
  };

  async function submit(mode: "draft" | "publish" | "deliver" = "draft") {
    setBusy(true);
    update("publish_mode", mode);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        create_new_client: form.create_new_client,
        organization_id: form.organization_id || null,
        client_name: form.client_name || form.business_name || "Client",
        owner_name: form.owner_name || null,
        owner_email: form.owner_email || null,
        owner_phone: form.owner_phone || null,
        owner_whatsapp: form.owner_whatsapp || null,
        account_mode: form.account_mode,
        website_type: form.template_key === "convert" ? "single_product" : "ecommerce",
        template_key: form.template_key,
        business_name: form.business_name,
        slug: form.slug || slugify(form.business_name),
        logo_url: form.logo_url || null,
        favicon_url: form.favicon_url || null,
        primary_color: form.primary_color || null,
        secondary_color: form.secondary_color || null,
        accent_color: form.accent_color || null,
        language: form.language,
        currency: form.currency || "DZD",
        contact_email: form.contact_email || form.owner_email || null,
        contact_phone: form.contact_phone || form.owner_phone || null,
        whatsapp: form.contact_whatsapp || form.owner_whatsapp || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
        address: form.address || null,
        homepage_sections: form.homepage_sections,
        cod_enabled: form.cod_enabled,
        reviews_enabled: form.reviews_enabled,
        faq_enabled: form.faq_enabled,
        default_home_fee: form.default_home_fee ? Number(form.default_home_fee) : 400,
        default_office_fee: form.default_office_fee ? Number(form.default_office_fee) : 600,
        office_delivery_enabled: form.office_delivery_enabled,
        manual_shipping_zones: form.shipping_provider === "manual"
          ? form.manual_shipping_zones.map((z) => ({
              wilaya_code: z.wilaya_code,
              home_fee: Number(z.home_fee || form.default_home_fee || 0),
              office_fee: Number(z.office_fee || form.default_office_fee || 0),
              is_active: z.is_active,
            }))
          : [],
        initial_categories: form.initial_categories
          .filter((c) => c.name.trim())
          .map((c, index) => ({
            name: c.name.trim(),
            image_url: c.image_url || null,
            slug: c.slug || null,
            position: index,
            is_visible: true,
          })),
        initial_products: form.initial_products
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            short_description: p.short_description || null,
            price: p.price ? Number(p.price) : 0,
            compare_price: p.compare_price ? Number(p.compare_price) : null,
            cost: p.cost ? Number(p.cost) : null,
            description: p.description || null,
            images: p.images,
            image_url: p.images[0] || null,
            gallery_mode: p.gallery_mode,
            is_digital: p.is_digital,
            stock_tracking_mode: p.stock_tracking_mode,
            min_order_quantity: Number(p.min_order_quantity || 1),
            category: p.category || null,
            stock: p.stock ? Number(p.stock) : 0,
            sku: p.sku || null,
            featured: p.featured,
            option_groups: p.option_groups.filter((g) => g.key.trim() && g.label.trim()).map((g) => ({
              key: g.key.trim(),
              label: g.label.trim(),
              selection_mode: g.selection_mode,
              display_type: g.display_type,
              required: true,
              min_selections: g.selection_mode === "multiple" ? 0 : 1,
              max_selections: g.selection_mode === "multiple" ? Math.max(1, g.values.split(",").filter(Boolean).length) : 1,
              values: g.values.split(",").map((v) => v.trim()).filter(Boolean).map((v) => ({ value: v, label: v })),
            })),
            variants: p.variants.filter((v) => v.name.trim()).map((v) => {
              const options: Record<string,string> = {};
              for (const part of v.options_text.split(",")) {
                const [k, ...rest] = part.split(":");
                if (k?.trim() && rest.length) options[k.trim()] = rest.join(":").trim();
              }
              return { name: v.name.trim(), options, price_cents: v.price ? Math.round(Number(v.price) * 100) : null, sku: v.sku || null, stock: Number(v.stock || 0), is_active: true };
            }),
            offers: p.offers.filter((o) => o.min_quantity && o.total_price).map((o) => ({
              min_quantity: Number(o.min_quantity), total_price_cents: Math.round(Number(o.total_price) * 100), label: o.label || null, is_active: true,
            })),
            related_names: p.related_names.split(",").map((v) => v.trim()).filter(Boolean),
            cross_sell_names: p.cross_sell_names.split(",").map((v) => v.trim()).filter(Boolean),
          })),
        shipping_provider: form.shipping_provider,
        shipping_api_base: form.shipping_api_base || null,
        shipping_api_token: form.shipping_api_token || null,
        shipping_account: form.shipping_account || null,
        meta_pixel_id: form.meta_pixel_id || null,
        tiktok_pixel_id: form.tiktok_pixel_id || null,
        snapchat_pixel_id: form.snapchat_pixel_id || null,
        pinterest_tag_id: form.pinterest_tag_id || null,
        ga4_measurement_id: form.ga4_measurement_id || null,
        gtm_container_id: form.gtm_container_id || null,
        google_ads_customer_id: form.google_ads_customer_id || null,
        google_sheets_id: form.google_sheets_id || null,
        google_sheets_json: form.google_sheets_json || null,
        telegram_bot_token: form.telegram_bot_token || null,
        telegram_chat_id: form.telegram_chat_id || null,
        dashboard_language: form.dashboard_language,
        custom_domain: form.domain_mode === "custom" ? form.custom_domain : null,
        publish_mode: mode,
      };

      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string; store_id?: string; slug?: string; preview_url?: string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur création");
      const created = data as { store_id: string; slug: string; preview_url: string };
      setResult(created);

      // "Terminer et livrer" goes straight to the complete site control center.
      if (mode === "deliver" && created.store_id) {
        router.push(`/admin/sites/${created.store_id}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">✅</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Site créé avec succès !</h2>
        <p className="mt-2 text-sm text-slate-500">
          Le site <span className="font-semibold text-slate-700">{form.business_name}</span> est en <span className="font-semibold">{form.publish_mode === "draft" ? "brouillon" : "publié"}</span>.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={result.preview_url} target="_blank" rel="noreferrer" className={btnPrimary}>Voir l&apos;aperçu ({result.slug})</a>
          <button onClick={() => router.push(`/admin/sites/${result.store_id}`)} className={btnSecondary}>Centre de contrôle</button>
          <button onClick={() => router.push(`/admin/sites/${result.store_id}?assistant=1`)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">✦ Ajuster avec l’assistant</button>
          <button onClick={() => router.push("/admin/sites")} className={btnSecondary}>Retour aux sites</button>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-800">
          <strong>Prochaines étapes après création :</strong>
          <ul className="mt-2 list-disc pl-4 space-y-1">
            <li>Configurer Telegram / Google Sheets / Pixels dans l&apos;onglet Intégrations du centre de contrôle</li>
            <li>Configurer le prestataire de livraison (Navex/Yalidine/Ecotrack/ZR/Generic) avec Test de connexion</li>
            <li>Vérifier le domaine personnalisé si renseigné (DNS TXT)</li>
            <li>Inviter le client avec la langue dashboard {form.dashboard_language.toUpperCase()}</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${i === step ? "bg-violet-600 text-white shadow" : i < step ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">{STEPS[step]?.desc ?? ""} — Étape {step + 1} / {STEPS.length}</div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-violet-600 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="min-h-[400px]">
        {/* 1 CLIENT */}
        {step === 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <h3 className="text-sm font-bold text-violet-900">👤 CLIENT — Informations client & compte marchand</h3>
              <p className="mt-1 text-xs text-violet-700">Le client vous contacte hors plateforme. Vous créez son site ici. Après livraison, il ne verra que boutique + dashboard marchand.</p>
            </div>
            <Field label="Type de client">
              <div className="flex gap-2">
                <button type="button" onClick={() => update("create_new_client", true)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${form.create_new_client ? "bg-violet-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}>Nouveau client</button>
                <button type="button" onClick={() => update("create_new_client", false)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${!form.create_new_client ? "bg-violet-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}>Client existant</button>
              </div>
            </Field>
            {!form.create_new_client ? (
              <Field label="Organisation existante">
                <select value={form.organization_id} onChange={(e) => update("organization_id", e.target.value)} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Nom du client / organisation *" hint="Ex: Maison Almasa, SARL NovaShop">
                <input value={form.client_name} onChange={(e) => update("client_name", e.target.value)} className={inputCls} placeholder="Nom organisation" />
              </Field>
            )}
            <Field label="Nom commercial / boutique *"><input value={form.business_name} onChange={(e) => { update("business_name", e.target.value); if (!form.slug) update("slug", slugify(e.target.value)); }} className={inputCls} placeholder="Maison Almasa" /></Field>
            <Field label="Slug (URL) *" hint="/s/[slug]"><input value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputCls} placeholder="maison-almasa" /></Field>
            <Field label="Nom du propriétaire"><input value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} className={inputCls} placeholder="Sofia Benali" /></Field>
            <Field label="Email propriétaire *" hint="Doit avoir un compte — invite si nécessaire"><input list="profiles" value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} className={inputCls} placeholder="client@example.com" /><datalist id="profiles">{profiles.map((p) => p.email && <option key={p.id} value={p.email} />)}</datalist></Field>
            <Field label="Téléphone"><input value={form.owner_phone} onChange={(e) => update("owner_phone", e.target.value)} className={inputCls} placeholder="+213…" /></Field>
            <Field label="WhatsApp"><input value={form.owner_whatsapp} onChange={(e) => update("owner_whatsapp", e.target.value)} className={inputCls} placeholder="0550…" /></Field>
            <Field label="Mode de compte">
              <select value={form.account_mode} onChange={(e) => update("account_mode", e.target.value as never)} className={inputCls}>
                <option value="create_now">Créer maintenant</option>
                <option value="invite_later">Inviter plus tard</option>
              </select>
            </Field>
          </div>
        )}

        {/* 2 TEMPLATE */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">🎨 TEMPLATE — Galerie visuelle</h3>
              <p className="mt-1 text-xs text-slate-500">Seulement les 5 templates qui ont un vrai site complet et une page produit fonctionnelle. Visualisez-les avant de sélectionner.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TEMPLATE_FILTERS.map((f) => (
                  <button key={f} onClick={() => update("template_filter", f)} className={`rounded-full px-3 py-1 text-xs font-semibold ${form.template_filter === f ? "bg-violet-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{f === "all" ? "Tous" : f}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((tpl: TemplateMeta) => (
                <div
                  key={tpl.key}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    update("template_key", tpl.key);
                  }}
                  onClick={() => {
                    update("template_key", tpl.key);
                    // Arabic-first templates preselect RTL language and their
                    // own design palette. Existing templates remain unchanged.
                    if (tpl.language === "ar") {
                      update("language", "ar");
                      update("primary_color", tpl.theme.primaryColor);
                      update("secondary_color", tpl.theme.secondaryColor);
                      update("accent_color", tpl.theme.secondaryColor);
                    }
                  }}
                  className={`group relative overflow-hidden rounded-2xl border-2 text-left transition ${form.template_key === tpl.key ? "border-violet-600 bg-violet-50 ring-4 ring-violet-100" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg"}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tpl.screenshotUrl} alt={`Aperçu ${tpl.name}`} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{tpl.category}</div>
                    {tpl.previewMobileUrl ? (
                      <div className="absolute bottom-2 right-2 overflow-hidden rounded-md border border-white/40 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tpl.previewMobileUrl} alt={`Aperçu mobile ${tpl.name}`} className="h-14 w-9 object-cover object-top" loading="lazy" />
                      </div>
                    ) : null}
                    {form.template_key === tpl.key && <div className="absolute right-2 top-2 rounded-full bg-violet-600 px-2 py-1 text-xs font-bold text-white">✓ Sélectionné</div>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ background: tpl.theme.primaryColor }} /><span className="text-sm font-black uppercase tracking-wide text-slate-900">{tpl.name}</span></div>
                    <div className="mt-1 text-xs text-slate-500 line-clamp-2">{tpl.description}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tpl.sections.slice(0, 4).map((s) => <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{s}</span>)}
                      {tpl.sections.length > 4 && <span className="text-[10px] text-slate-400">+{tpl.sections.length - 4}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Utiliser ce template</span>
                      {templatePreviewPath(tpl.key) ? (
                        <a
                          href={templatePreviewPath(tpl.key) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
                        >
                          Visualiser
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedTemplate && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <strong>Template sélectionné : {selectedTemplate.name}</strong> — {selectedTemplate.description}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setPreviewMode("desktop")} className={`rounded px-3 py-1 text-xs font-semibold ${previewMode === "desktop" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border"}`}>Desktop</button>
                  <button onClick={() => setPreviewMode("mobile")} className={`rounded px-3 py-1 text-xs font-semibold ${previewMode === "mobile" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border"}`}>Mobile</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3 BRAND IDENTITY */}
        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold">🏷️ IDENTITÉ DE MARQUE — Branding complet</h3>
              <p className="text-xs text-slate-500">Logo, favicon, couleurs, langues, contact. Aperçu en temps réel.</p>
            </div>
            <Field label="Logo" hint="Téléversez directement un JPG/PNG/WebP/SVG. URL manuelle disponible si nécessaire.">
              <div className="space-y-2">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="block w-full text-sm" disabled={uploadingKey === "logo"} onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; const url=await uploadAdminFile(file,"logo","logo"); if(url) update("logo_url",url); }} />
                <input value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} className={inputCls} placeholder="Ou coller une URL…" />
                {form.logo_url ? <img src={form.logo_url} alt="Aperçu logo" className="h-16 w-16 rounded-xl border border-slate-200 object-contain bg-white" /> : null}
              </div>
            </Field>
            <Field label="Favicon">
              <div className="space-y-2">
                <input type="file" accept="image/png,image/svg+xml" className="block w-full text-sm" disabled={uploadingKey === "favicon"} onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; const url=await uploadAdminFile(file,"favicon","favicon"); if(url) update("favicon_url",url); }} />
                <input value={form.favicon_url} onChange={(e) => update("favicon_url", e.target.value)} className={inputCls} placeholder="Ou coller une URL…" />
              </div>
            </Field>
            <Field label="Couleur principale"><div className="flex gap-2"><input type="color" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="h-10 w-12 rounded border" /><input value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className={inputCls} /></div></Field>
            <Field label="Couleur secondaire"><div className="flex gap-2"><input type="color" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} className="h-10 w-12 rounded border" /><input value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} className={inputCls} /></div></Field>
            <Field label="Couleur accent"><div className="flex gap-2"><input type="color" value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} className="h-10 w-12 rounded border" /><input value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} className={inputCls} /></div></Field>
            <Field label="Langue boutique"><select value={form.language} onChange={(e) => update("language", e.target.value as never)} className={inputCls}><option value="fr">Français</option><option value="ar">Arabe (RTL)</option><option value="en">English</option></select></Field>
            <Field label="Devise"><input value={form.currency} onChange={(e) => update("currency", e.target.value)} className={inputCls} placeholder="DZD" /></Field>
            <Field label="Téléphone boutique"><input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} className={inputCls} placeholder="+213…" /></Field>
            <Field label="WhatsApp"><input value={form.contact_whatsapp} onChange={(e) => update("contact_whatsapp", e.target.value)} className={inputCls} placeholder="https://wa.me/…" /></Field>
            <Field label="Email"><input value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} className={inputCls} placeholder="contact@…" /></Field>
            <Field label="Instagram"><input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} className={inputCls} placeholder="https://instagram.com/…" /></Field>
            <Field label="Facebook"><input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} className={inputCls} placeholder="https://facebook.com/…" /></Field>
            <Field label="TikTok"><input value={form.tiktok} onChange={(e) => update("tiktok", e.target.value)} className={inputCls} placeholder="https://tiktok.com/@…" /></Field>
            <Field label="Adresse" hint="Alger, Algérie"><input value={form.address} onChange={(e) => update("address", e.target.value)} className={`${inputCls} md:col-span-2`} placeholder="Adresse complète" /></Field>
            <div className="md:col-span-2 rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-500">Aperçu branding</div>
              <div className="mt-2 flex items-center gap-3"><div className="h-10 w-10 rounded-full" style={{ background: form.primary_color }} /><div><div className="font-bold" style={{ color: form.primary_color }}>{form.business_name || "Nom boutique"}</div><div className="text-xs text-slate-500">{form.contact_email || "contact@..."}</div></div></div>
            </div>
          </div>
        )}

        {/* 4 HOMEPAGE CONTENT */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold">🏠 CONTENU HOMEPAGE — Sections prédéfinies du template</h3>
              <p className="text-xs text-slate-500">Pas de builder Wix. Vous éditez les sections prévues par le template : titre, sous-titre, images (Desktop 1600×700 / Mobile 800×1000), bouton, lien, source, visible/hidden. Avertissement si image basse résolution.</p>
              <button onClick={initHomepageSections} className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Charger sections par défaut du template</button>
            </div>
            {form.homepage_sections.length === 0 ? (
              <p className="text-sm text-slate-400">Cliquez sur &quot;Charger sections&quot; pour voir les sections du template {selectedTemplate?.name}.</p>
            ) : (
              <div className="space-y-2">
                {form.homepage_sections.map((sec, i) => (
                  <div key={sec.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{sec.type}</span>
                      <span className="text-sm font-medium text-slate-800">{sec.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={sec.enabled} onChange={(e) => { const v = [...form.homepage_sections]; v[i] = { ...sec, enabled: e.target.checked }; update("homepage_sections", v); }} /> Visible</label>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400">ℹ️ Dans le centre de contrôle /admin/sites/[id] → Contenu, vous pourrez éditer chaque section en détail (images, textes, liens, dimensions 1600×700 / 800×1000, reorder si autorisé).</p>
              </div>
            )}
          </div>
        )}

        {/* 5 PRODUCTS */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <h3 className="text-sm font-bold text-violet-900">📦 PRODUITS — Fiches complètes dès la création</h3>
              <p className="mt-1 text-xs leading-5 text-violet-700">Photos multiples et ordre, produit digital, prix/coût, stock global ou par variantes, options mono/multi-choix, variantes, offres quantité, produits connexes et cross-selling. Le même moteur sécurisé sera disponible ensuite dans le dashboard marchand.</p>
            </div>
            <div className="space-y-3">
              {form.initial_products.map((product, i) => (
                <StudioProductDraftEditor
                  key={i}
                  index={i}
                  value={product}
                  onChange={(next) => {
                    const list=[...form.initial_products];
                    list[i]=next;
                    update("initial_products",list);
                  }}
                  onRemove={() => update("initial_products", form.initial_products.filter((_,j)=>j!==i))}
                  onDuplicate={() => {
                    const list=[...form.initial_products];
                    list.splice(i+1,0,{...product,images:[...product.images],variants:product.variants.map(v=>({...v})),offers:product.offers.map(o=>({...o})),option_groups:product.option_groups.map(g=>({...g}))});
                    update("initial_products",list);
                  }}
                />
              ))}
              <button type="button" onClick={() => update("initial_products", [...form.initial_products, { ...EMPTY_STUDIO_PRODUCT, images:[], variants:[], offers:[], option_groups:[] }])} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">+ Ajouter un produit complet</button>
            </div>
          </div>
        )}

        {/* 6 CATEGORIES */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold">🗂️ CATÉGORIES — Collections</h3>
              <p className="text-xs text-slate-500">Nom, image, slug, ordre, visibilité, produits assignés.</p>
            </div>
            <div className="space-y-2">
              {form.initial_categories.map((c, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3">
                  <input value={c.name} onChange={(e) => { const v = [...form.initial_categories]; v[i] = { ...c, name: e.target.value, slug: slugify(e.target.value) }; update("initial_categories", v); }} className={inputCls} placeholder="Nom catégorie" />
                  <input value={c.slug} onChange={(e) => { const v = [...form.initial_categories]; v[i] = { ...c, slug: e.target.value }; update("initial_categories", v); }} className={inputCls} placeholder="Slug" />
                  <div className="space-y-2">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" disabled={uploadingKey === `category-${i}`} onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; const url=await uploadAdminFile(file,"category",`category-${i}`); if(!url) return; const v=[...form.initial_categories]; v[i]={...c,image_url:url}; update("initial_categories",v); }} />
                    <input value={c.image_url} onChange={(e) => { const v = [...form.initial_categories]; v[i] = { ...c, image_url: e.target.value }; update("initial_categories", v); }} className={inputCls} placeholder="Ou URL image" />
                    {c.image_url ? <img src={c.image_url} alt="" className="h-14 w-20 rounded-lg border border-slate-200 object-cover" /> : null}
                  </div>
                  <button onClick={() => update("initial_categories", form.initial_categories.filter((_, j) => j !== i))} className="text-xs text-red-600 md:col-span-3 text-left">Supprimer</button>
                </div>
              ))}
              <button onClick={() => update("initial_categories", [...form.initial_categories, { name: "", image_url: "", slug: "" }])} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">+ Ajouter catégorie</button>
            </div>
          </div>
        )}

        {/* 7 COD DELIVERY */}
        {step === 6 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-bold text-amber-900">🚚 LIVRAISON COD — Algérie 58 wilayas</h3>
              <p className="text-xs text-amber-800">Domicile / Bureau, 58 wilayas, communes, prix livraison. Sélection prestataire : Navex / Yalidine / Ecotrack / ZR Express / Generic / Manual. Champs API base URL / token / credentials, Test connexion / Activer. Secrets jamais exposés côté client. Ne pas inventer endpoints si docs manquantes.</p>
            </div>
            <Field label="Frais domicile par défaut (DA)" hint="Wilaya 0 = appliquée partout"><input value={form.default_home_fee} onChange={(e) => update("default_home_fee", e.target.value)} className={inputCls} placeholder="400" /></Field>
            <Field label="Frais bureau par défaut (DA)"><input value={form.default_office_fee} onChange={(e) => update("default_office_fee", e.target.value)} className={inputCls} placeholder="600" /></Field>
            <Field label="Livraison bureau activée"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.office_delivery_enabled} onChange={(e) => update("office_delivery_enabled", e.target.checked)} /> Oui, proposer bureau</label></Field>
            <Field label="Prestataire livraison">
              <select value={form.shipping_provider} onChange={(e) => update("shipping_provider", e.target.value as never)} className={inputCls}>
                <option value="manual">Manual (par défaut)</option>
                <option value="navex">Navex</option>
                <option value="yalidine">Yalidine</option>
                <option value="guepex">Guepex</option>
                <option value="yalitec">Yalitec</option>
                <option value="ecotrack">Ecotrack</option>
                <option value="zr">ZR Express</option>
                <option value="ecom_delivery">E-com Delivery V2</option>
                <option value="abex">Abex Express</option>
                <option value="colireli">ColiReli</option>
                <option value="colireli_ecotrack">ColiReli Ecotrack</option>
                <option value="isr">ISR Services</option>
                <option value="leopard">Leopard Express</option>
                <option value="generic">Autre transporteur / API générique</option>
              </select>
            </Field>
            {form.shipping_provider !== "manual" && (
              <>
                <Field label="API Key / Token" hint="Chiffré côté serveur après création. Utilisez exactement les identifiants donnés par le transporteur."><input value={form.shipping_api_token} onChange={(e) => update("shipping_api_token", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="API key / token…" /></Field>
                <Field label="Compte / Identifiant"><input value={form.shipping_account} onChange={(e) => update("shipping_account", e.target.value)} className={inputCls} placeholder="account…" /></Field>
                <Field label="URL API (si fournie)" hint="Ne pas inventer d'endpoint : renseignez uniquement l'URL officielle du transporteur."><input value={form.shipping_api_base} onChange={(e) => update("shipping_api_base", e.target.value)} className={inputCls} placeholder="https://api.prestataire.com" /></Field>
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <strong>Test connexion :</strong> sera disponible après création dans /admin/sites/[id] → Livraison → Tester la connexion. Interface + schéma + config UI + mock adapter + TODO docs si specs manquantes.
                </div>
              </>
            )}
            {form.shipping_provider === "manual" ? (
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Tarifs manuels — 58 wilayas</h4>
                    <p className="mt-1 text-xs text-slate-500">Renseignez domicile/bureau avant de livrer le site. Vous pouvez désactiver les wilayas non desservies.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold" onClick={() => update("manual_shipping_zones", form.manual_shipping_zones.map(z => ({ ...z, home_fee: form.default_home_fee, office_fee: form.default_office_fee })))}>Appliquer les tarifs par défaut</button>
                    <button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold" onClick={() => update("manual_shipping_zones", form.manual_shipping_zones.map(z => ({ ...z, is_active: true })))}>Activer les 58</button>
                  </div>
                </div>
                <div className="mt-4 max-h-[430px] overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-3 py-2">Wilaya</th><th className="px-3 py-2">Domicile DA</th><th className="px-3 py-2">Bureau DA</th><th className="px-3 py-2">Active</th></tr></thead>
                    <tbody>
                      {WILAYAS.map((w) => {
                        const z = form.manual_shipping_zones.find(x => x.wilaya_code === w.code) ?? { wilaya_code:w.code, home_fee:form.default_home_fee, office_fee:form.default_office_fee, is_active:true };
                        const change = (patch: Partial<typeof z>) => update("manual_shipping_zones", form.manual_shipping_zones.map(x => x.wilaya_code === w.code ? { ...x, ...patch } : x));
                        return <tr key={w.code} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-700">{w.code} — {w.name}</td>
                          <td className="px-3 py-2"><input type="number" min="0" className={inputCls} value={z.home_fee} onChange={e => change({ home_fee:e.target.value })}/></td>
                          <td className="px-3 py-2"><input type="number" min="0" className={inputCls} value={z.office_fee} onChange={e => change({ office_fee:e.target.value })}/></td>
                          <td className="px-3 py-2"><input type="checkbox" checked={z.is_active} onChange={e => change({ is_active:e.target.checked })}/></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                Mode API : connectez le transporteur avec ses identifiants officiels. Les tarifs automatiques ne sont importés que si l’adaptateur possède un contrat API vérifié ; aucun endpoint n’est inventé.
              </div>
            )}
          </div>
        )}

        {/* 8 INTEGRATIONS */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold">🔌 INTÉGRATIONS — Checklist</h3>
              <p className="text-xs text-slate-500">Shipping, Google Sheets, Meta Pixel, TikTok, Snapchat, Pinterest, GA4, GTM, Google Ads, Telegram, WhatsApp/future Swivigo. Chaque intégration : Non configuré / Configuré / Connecté / Erreur + Configurer / Tester / Désactiver / Modifier.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Meta Pixel ID"><input value={form.meta_pixel_id} onChange={(e) => update("meta_pixel_id", e.target.value)} className={inputCls} placeholder="1234567890" /></Field>
              <Field label="TikTok Pixel ID"><input value={form.tiktok_pixel_id} onChange={(e) => update("tiktok_pixel_id", e.target.value)} className={inputCls} placeholder="…" /></Field>
              <Field label="Snapchat Pixel ID"><input value={form.snapchat_pixel_id} onChange={(e) => update("snapchat_pixel_id", e.target.value)} className={inputCls} placeholder="…" /></Field>
              <Field label="Pinterest Tag ID"><input value={form.pinterest_tag_id} onChange={(e) => update("pinterest_tag_id", e.target.value)} className={inputCls} placeholder="…" /></Field>
              <Field label="GA4 Measurement ID"><input value={form.ga4_measurement_id} onChange={(e) => update("ga4_measurement_id", e.target.value)} className={inputCls} placeholder="G-XXXX" /></Field>
              <Field label="GTM Container ID"><input value={form.gtm_container_id} onChange={(e) => update("gtm_container_id", e.target.value)} className={inputCls} placeholder="GTM-XXXX" /></Field>
              <Field label="Google Ads Customer ID"><input value={form.google_ads_customer_id} onChange={(e) => update("google_ads_customer_id", e.target.value)} className={inputCls} placeholder="123-456-7890" /></Field>
              <Field label="Google Sheets ID" hint="Spreadsheet ID"><input value={form.google_sheets_id} onChange={(e) => update("google_sheets_id", e.target.value)} className={inputCls} placeholder="1AbCd…" /></Field>
              <Field label="Google Service Account JSON" hint="Chiffré serveur"><textarea value={form.google_sheets_json} onChange={(e) => update("google_sheets_json", e.target.value)} className={`${inputCls} h-20 font-mono text-xs`} placeholder='{"type":"service_account",...}' /></Field>
              <Field label="Telegram Bot Token" hint="fxenc1.* chiffré"><input value={form.telegram_bot_token} onChange={(e) => update("telegram_bot_token", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="123456:ABC-DEF…" /></Field>
              <Field label="Telegram Chat ID"><input value={form.telegram_chat_id} onChange={(e) => update("telegram_chat_id", e.target.value)} className={inputCls} placeholder="-1001234567890" /></Field>
              <Field label="WhatsApp / Swivigo" hint="Interface seulement pour l'instant"><input value={form.whatsapp_number} onChange={(e) => update("whatsapp_number", e.target.value)} className={inputCls} placeholder="0550…" /></Field>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              Toutes les intégrations seront configurables en détail après création via Centre de contrôle → Intégrations. Credentials chiffrés côté serveur, jamais exposés client-side.
            </div>
          </div>
        )}

        {/* 9 DOMAIN */}
        {step === 8 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold">🌐 DOMAINE — Aperçu & domaine personnalisé</h3>
              <p className="text-xs text-slate-500">Mode aperçu seul ( /s/[slug] ) ou domaine personnalisé. Instructions vérification DNS, ne pas marquer vérifié tant que DNS ne réussit pas.</p>
            </div>
            <Field label="Mode domaine">
              <select value={form.domain_mode} onChange={(e) => update("domain_mode", e.target.value as never)} className={inputCls}>
                <option value="preview">Aperçu seul (/s/[slug])</option>
                <option value="custom">Domaine personnalisé</option>
              </select>
            </Field>
            {form.domain_mode === "custom" && (
              <Field label="Domaine personnalisé" hint="Ex: www.maboutique.dz"><input value={form.custom_domain} onChange={(e) => update("custom_domain", e.target.value)} className={inputCls} placeholder="www.maboutique.dz" /></Field>
            )}
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <strong>Instructions DNS (après création) :</strong>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                <li>Ajoutez un enregistrement CNAME pointant vers <code>cname.flexigo.dz</code> (ou IP fournie)</li>
                <li>Ajoutez TXT <code>flexigo-verification=TOKEN</code> (token généré automatiquement)</li>
                <li>La vérification DNS est automatique toutes les heures — ne marquez jamais vérifié manuellement sans succès DNS</li>
              </ul>
              <div className="mt-3 rounded bg-amber-50 p-2 text-amber-800">Aperçu actuel : <code>/s/{form.slug || slugify(form.business_name) || "votre-slug"}</code></div>
            </div>
          </div>
        )}

        {/* 10 CLIENT ACCOUNT */}
        {step === 9 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold">👤 COMPTE CLIENT — Accès marchand</h3>
              <p className="text-xs text-slate-500">Créer / inviter le propriétaire marchand, langue dashboard FR/AR/EN indépendante de la langue boutique.</p>
            </div>
            <Field label="Email propriétaire *" hint="Doit avoir un compte"><input value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} className={inputCls} placeholder="client@example.com" /></Field>
            <Field label="Langue dashboard marchand" hint="Indépendante de la langue boutique">
              <select value={form.dashboard_language} onChange={(e) => update("dashboard_language", e.target.value as never)} className={inputCls}>
                <option value="fr">Français</option>
                <option value="ar">Arabe (RTL)</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="Mode compte"><select value={form.account_mode} onChange={(e) => update("account_mode", e.target.value as never)} className={inputCls}><option value="create_now">Créer maintenant (si email existe)</option><option value="invite_later">Inviter plus tard</option></select></Field>
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
              Après création, le client reçoit seulement boutique + dashboard marchand (/dashboard), JAMAIS le master dashboard /admin. Super Admin peut accéder à tout site via outils support contrôlés.
            </div>
          </div>
        )}

        {/* 11 FINAL REVIEW */}
        {step === 10 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <h3 className="text-sm font-bold text-violet-900">✅ FINAL REVIEW — Checklist & publication</h3>
              <p className="text-xs text-violet-700">Vérifiez tous les éléments avant livraison client.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <h4 className="text-sm font-bold">Checklist</h4>
                <ul className="mt-2 space-y-1 text-xs">
                  <li className={form.business_name ? "text-emerald-600" : "text-red-600"}>{form.business_name ? "✅" : "❌"} Branding : {form.business_name || "manquant"}</li>
                  <li className={form.initial_products.length > 0 ? "text-emerald-600" : "text-amber-600"}>{form.initial_products.length > 0 ? "✅" : "⚠️"} Produits : {form.initial_products.length} produit(s)</li>
                  <li className={form.initial_categories.length > 0 ? "text-emerald-600" : "text-amber-600"}>{form.initial_categories.length > 0 ? "✅" : "⚠️"} Catégories : {form.initial_categories.length}</li>
                  <li className={form.homepage_sections.length > 0 ? "text-emerald-600" : "text-amber-600"}>{form.homepage_sections.length > 0 ? "✅" : "⚠️"} Homepage : {form.homepage_sections.length} sections</li>
                  <li className="text-emerald-600">✅ Livraison : Domicile {form.default_home_fee} DA / Bureau {form.default_office_fee} DA — {form.shipping_provider}</li>
                  <li className={form.meta_pixel_id || form.tiktok_pixel_id || form.ga4_measurement_id ? "text-emerald-600" : "text-slate-500"}>{form.meta_pixel_id || form.tiktok_pixel_id || form.ga4_measurement_id ? "✅" : "⚪"} Pixels : {form.meta_pixel_id ? "Meta " : ""}{form.tiktok_pixel_id ? "TikTok " : ""}{form.ga4_measurement_id ? "GA4 " : ""}{!form.meta_pixel_id && !form.tiktok_pixel_id && !form.ga4_measurement_id ? "aucun" : ""}</li>
                  <li className={form.google_sheets_id ? "text-emerald-600" : "text-slate-500"}>{form.google_sheets_id ? "✅" : "⚪"} Google Sheets : {form.google_sheets_id ? "configuré" : "non configuré"}</li>
                  <li className={form.telegram_bot_token || form.telegram_chat_id ? "text-emerald-600" : "text-slate-500"}>{form.telegram_bot_token || form.telegram_chat_id ? "✅" : "⚪"} Telegram : {form.telegram_bot_token ? "configuré" : "non configuré"}</li>
                  <li className={form.domain_mode === "custom" ? "text-amber-600" : "text-slate-500"}>{form.domain_mode === "custom" ? "⚠️" : "⚪"} Domaine : {form.domain_mode === "custom" ? form.custom_domain || "à configurer" : "aperçu seul"}</li>
                  <li className={form.owner_email ? "text-emerald-600" : "text-red-600"}>{form.owner_email ? "✅" : "❌"} Compte client : {form.owner_email || "manquant"} — Dashboard {form.dashboard_language.toUpperCase()}</li>
                </ul>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <h4 className="text-sm font-bold">Aperçu</h4>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setPreviewMode("desktop")} className={`rounded px-3 py-1 text-xs font-semibold ${previewMode === "desktop" ? "bg-slate-900 text-white" : "bg-white border"}`}>Desktop</button>
                  <button onClick={() => setPreviewMode("mobile")} className={`rounded px-3 py-1 text-xs font-semibold ${previewMode === "mobile" ? "bg-slate-900 text-white" : "bg-white border"}`}>Mobile</button>
                </div>
                <div className={`mt-3 overflow-hidden rounded-xl border bg-slate-50 ${previewMode === "mobile" ? "mx-auto max-w-[320px]" : ""}`}>
                  <div className="p-4 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full" style={{ background: form.primary_color }} />
                    <div className="mt-2 font-bold" style={{ color: form.primary_color }}>{form.business_name || "Boutique"}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedTemplate?.name} — {selectedTemplate?.category}</div>
                    <div className="mt-3 rounded-lg bg-white p-2 text-xs">Hero 1600×700 / Mobile 800×1000</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">Aperçu réel disponible après création : <code>/s/{form.slug || slugify(form.business_name) || "slug"}</code></div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold">Mode publication</h4>
              <div className="mt-2 flex gap-2">
                <button onClick={() => update("publish_mode", "draft")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.publish_mode === "draft" ? "bg-slate-900 text-white" : "border bg-white"}`}>Enregistrer brouillon</button>
                <button onClick={() => update("publish_mode", "publish")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.publish_mode === "publish" ? "bg-blue-600 text-white" : "border bg-white"}`}>Publier</button>
                <button onClick={() => update("publish_mode", "deliver")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.publish_mode === "deliver" ? "bg-emerald-600 text-white" : "border bg-white"}`}>Terminer et livrer</button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Brouillon = non visible publiquement. Publier = actif. Terminer et livrer = actif + notification client + log livraison.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className={btnSecondary}>← Précédent</button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className={btnPrimary}>Suivant →</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => submit("draft")} disabled={busy || !form.business_name || !form.owner_email} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy ? "Création…" : "Enregistrer brouillon"}</button>
              <button onClick={() => submit("publish")} disabled={busy || !form.business_name || !form.owner_email} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Publication…" : "Publier"}</button>
              <button onClick={() => submit("deliver")} disabled={busy || !form.business_name || !form.owner_email} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? "Livraison…" : "Terminer et livrer"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
