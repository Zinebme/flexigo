"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES, type TemplateMeta } from "@/lib/templates/defaults";
import { slugify } from "@/lib/slug";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "@/components/ui";

interface Org { id: string; name: string }
interface Profile { id: string; email: string | null }

type WebsiteType = "ecommerce" | "single_product" | "portfolio";

interface FormState {
  // step 1 client
  create_new_client: boolean;
  organization_id: string;
  client_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  // step 2 type
  website_type: WebsiteType;
  // step 3 template
  template_key: string;
  // step 4 identity
  business_name: string;
  slug: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  language: "fr" | "ar" | "en";
  // step 5 contact
  contact_email: string;
  contact_phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  address: string;
  // step 6 business + content
  cod_enabled: boolean;
  reviews_enabled: boolean;
  faq_enabled: boolean;
  default_home_fee: string;
  default_office_fee: string;
  office_delivery_enabled: boolean;
  initial_categories: Array<{ name: string }>;
  initial_products: Array<{ name: string; price: string; description: string; image_url: string; category: string; stock: string }>;
  // step 7 marketing
  meta_pixel_id: string;
  tiktok_pixel_id: string;
  ga4_measurement_id: string;
  gtm_container_id: string;
  google_ads_customer_id: string;
}

const STEPS = [
  { key: "client", label: "Client" },
  { key: "type", label: "Type" },
  { key: "template", label: "Template" },
  { key: "identity", label: "Identité" },
  { key: "contact", label: "Contact" },
  { key: "content", label: "Contenu" },
  { key: "shipping", label: "Livraison" },
  { key: "marketing", label: "Marketing & finalisation" },
] as const;

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

  const [form, setForm] = useState<FormState>({
    create_new_client: true,
    organization_id: "",
    client_name: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    website_type: "ecommerce",
    template_key: "ecommerce-modern",
    business_name: "",
    slug: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#1d4ed8",
    secondary_color: "#f59e0b",
    language: "fr",
    contact_email: "",
    contact_phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    address: "",
    cod_enabled: true,
    reviews_enabled: true,
    faq_enabled: true,
    default_home_fee: "400",
    default_office_fee: "600",
    office_delivery_enabled: true,
    initial_categories: [],
    initial_products: [],
    meta_pixel_id: "",
    tiktok_pixel_id: "",
    ga4_measurement_id: "",
    gtm_container_id: "",
    google_ads_customer_id: "",
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const filteredTemplates = TEMPLATES.filter((t) => t.websiteTypes.includes(form.website_type));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // coerce numbers
      const payload: Record<string, unknown> = {
        create_new_client: form.create_new_client,
        organization_id: form.organization_id || null,
        client_name: form.client_name || form.business_name || "Client",
        owner_name: form.owner_name || null,
        owner_email: form.owner_email,
        owner_phone: form.owner_phone || null,
        website_type: form.website_type,
        template_key: form.template_key,
        business_name: form.business_name,
        slug: form.slug || slugify(form.business_name),
        logo_url: form.logo_url || null,
        favicon_url: form.favicon_url || null,
        primary_color: form.primary_color || null,
        secondary_color: form.secondary_color || null,
        language: form.language,
        currency: "DZD",
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        whatsapp: form.whatsapp || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
        address: form.address || null,
        cod_enabled: form.cod_enabled,
        reviews_enabled: form.reviews_enabled,
        faq_enabled: form.faq_enabled,
        default_home_fee: form.default_home_fee ? Number(form.default_home_fee) : 400,
        default_office_fee: form.default_office_fee ? Number(form.default_office_fee) : 600,
        office_delivery_enabled: form.office_delivery_enabled,
        initial_categories: form.initial_categories.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim() })),
        initial_products: form.initial_products
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            price: p.price ? Number(p.price) : 0,
            description: p.description || null,
            image_url: p.image_url || null,
            category: p.category || null,
            stock: p.stock ? Number(p.stock) : 0,
          })),
        meta_pixel_id: form.meta_pixel_id || null,
        tiktok_pixel_id: form.tiktok_pixel_id || null,
        ga4_measurement_id: form.ga4_measurement_id || null,
        gtm_container_id: form.gtm_container_id || null,
        google_ads_customer_id: form.google_ads_customer_id || null,
      };

      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string; store_id?: string; slug?: string; preview_url?: string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur création");
      setResult(data as { store_id: string; slug: string; preview_url: string });
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
          Le site <span className="font-semibold text-slate-700">{form.business_name}</span> est en brouillon.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={result.preview_url} target="_blank" rel="noreferrer" className={btnPrimary}>Voir l'aperçu ({result.slug})</a>
          <button onClick={() => router.push(`/admin/sites/${result.store_id}`)} className={btnSecondary}>Administration avancée</button>
          <button onClick={() => router.push("/admin/sites")} className={btnSecondary}>Retour aux sites</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div className="mb-6 flex flex-wrap gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${i === step ? "bg-violet-600 text-white" : i < step ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="min-h-[320px]">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
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
              <Field label="Nom du client / organisation" hint="Ex: Maison Almasa, SARL NovaShop…">
                <input value={form.client_name} onChange={(e) => update("client_name", e.target.value)} className={inputCls} placeholder="Nom de l'organisation" />
              </Field>
            )}
            <Field label="Nom du propriétaire" hint="Nom complet du client">
              <input value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} className={inputCls} placeholder="Sofia Benali" />
            </Field>
            <Field label="Email du propriétaire (doit déjà avoir un compte) *" hint="Le client doit d'abord créer son compte — cherchez parmi les profils existants">
              <input list="profiles" value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} className={inputCls} placeholder="client@example.com" />
              <datalist id="profiles">
                {profiles.map((p) => p.email && <option key={p.id} value={p.email} />)}
              </datalist>
            </Field>
            <Field label="Téléphone propriétaire">
              <input value={form.owner_phone} onChange={(e) => update("owner_phone", e.target.value)} className={inputCls} placeholder="+213…" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-3">
            {(["ecommerce", "single_product", "portfolio"] as WebsiteType[]).map((t) => (
              <button
                key={t}
                onClick={() => update("website_type", t)}
                className={`rounded-xl border p-5 text-left transition ${form.website_type === t ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="text-lg font-bold text-slate-900">{t === "ecommerce" ? "E-commerce" : t === "single_product" ? "Produit unique (COD)" : "Portfolio"}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {t === "ecommerce" ? "Boutique multi-produits avec panier, collections, COD 58 wilayas." : t === "single_product" ? "Landing page conversion optimisée Meta/TikTok Ads." : "Vitrine pro: médecin, architecte, agence…"}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.length === 0 && <p className="text-sm text-slate-400">Aucun template pour ce type — changez de type.</p>}
            {filteredTemplates.map((tpl: TemplateMeta) => (
              <button
                key={tpl.key}
                onClick={() => update("template_key", tpl.key)}
                className={`rounded-xl border p-5 text-left transition ${form.template_key === tpl.key ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg" style={{ background: tpl.theme.primaryColor }} />
                  <div>
                    <div className="font-bold text-slate-900">{tpl.name}</div>
                    <div className="text-xs text-slate-500">{tpl.key}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600">{tpl.description}</div>
                <div className="mt-2 flex gap-1">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tpl.theme.typography}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tpl.theme.buttonShape}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom de la boutique *">
              <input value={form.business_name} onChange={(e) => { update("business_name", e.target.value); if (!form.slug) update("slug", slugify(e.target.value)); }} className={inputCls} placeholder="Maison Almasa" />
            </Field>
            <Field label="Slug (URL) *" hint="Lettres minuscules, chiffres, tirets. Preview: /s/[slug]">
              <input value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputCls} placeholder="maison-almasa" />
            </Field>
            <Field label="Logo URL" hint="Image carrée recommandée">
              <input value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} className={inputCls} placeholder="https://…" />
            </Field>
            <Field label="Favicon URL">
              <input value={form.favicon_url} onChange={(e) => update("favicon_url", e.target.value)} className={inputCls} placeholder="https://…" />
            </Field>
            <Field label="Couleur primaire">
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="h-10 w-12 rounded border" />
                <input value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className={inputCls} />
              </div>
            </Field>
            <Field label="Couleur secondaire">
              <div className="flex gap-2">
                <input type="color" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} className="h-10 w-12 rounded border" />
                <input value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} className={inputCls} />
              </div>
            </Field>
            <Field label="Langue par défaut">
              <select value={form.language} onChange={(e) => update("language", e.target.value as never)} className={inputCls}>
                <option value="fr">Français</option>
                <option value="ar">Arabe (RTL)</option>
                <option value="en">English</option>
              </select>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email contact"><input value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} className={inputCls} placeholder="contact@…" /></Field>
            <Field label="Téléphone contact"><input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} className={inputCls} placeholder="+213…" /></Field>
            <Field label="WhatsApp (lien wa.me)"><input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className={inputCls} placeholder="https://wa.me/213…" /></Field>
            <Field label="Adresse"><input value={form.address} onChange={(e) => update("address", e.target.value)} className={inputCls} placeholder="Alger, Algérie" /></Field>
            <Field label="Instagram"><input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} className={inputCls} placeholder="https://instagram.com/…" /></Field>
            <Field label="Facebook"><input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} className={inputCls} placeholder="https://facebook.com/…" /></Field>
            <Field label="TikTok"><input value={form.tiktok} onChange={(e) => update("tiktok", e.target.value)} className={inputCls} placeholder="https://tiktok.com/@…" /></Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Catégories initiales">
                <div className="space-y-2">
                  {form.initial_categories.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={c.name} onChange={(e) => { const v = [...form.initial_categories]; const cur = v[i] ?? { name: "" }; v[i] = { name: e.target.value }; void cur; update("initial_categories", v); }} className={inputCls} placeholder="Nom catégorie" />
                      <button onClick={() => update("initial_categories", form.initial_categories.filter((_, j) => j !== i))} className="text-xs text-red-600">✕</button>
                    </div>
                  ))}
                  <button onClick={() => update("initial_categories", [...form.initial_categories, { name: "" }])} className="text-sm font-semibold text-violet-600">+ Ajouter catégorie</button>
                </div>
              </Field>
              <div className="md:col-span-2">
                <Field label="Produits initiaux (brouillons — inactifs jusqu'à validation)">
                  <div className="space-y-3">
                    {form.initial_products.map((p, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          <input value={p.name} onChange={(e) => { const v = [...form.initial_products]; const cur = v[i] ?? { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }; v[i] = { ...cur, name: e.target.value }; update("initial_products", v); }} className={inputCls} placeholder="Nom produit" />
                          <input value={p.price} onChange={(e) => { const v = [...form.initial_products]; const cur = v[i] ?? { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }; v[i] = { ...cur, price: e.target.value }; update("initial_products", v); }} className={inputCls} placeholder="Prix DA (ex: 3900)" />
                          <input value={p.category} onChange={(e) => { const v = [...form.initial_products]; const cur = v[i] ?? { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }; v[i] = { ...cur, category: e.target.value }; update("initial_products", v); }} className={inputCls} placeholder="Catégorie" />
                          <input value={p.stock} onChange={(e) => { const v = [...form.initial_products]; const cur = v[i] ?? { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }; v[i] = { ...cur, stock: e.target.value }; update("initial_products", v); }} className={inputCls} placeholder="Stock" />
                          <input value={p.image_url} onChange={(e) => { const v = [...form.initial_products]; const cur = v[i] ?? { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }; v[i] = { ...cur, image_url: e.target.value }; update("initial_products", v); }} className={`${inputCls} md:col-span-2`} placeholder="Image URL https://…" />
                          <textarea value={p.description} onChange={(e) => { const v = [...form.initial_products]; const cur = v[i] ?? { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }; v[i] = { ...cur, description: e.target.value }; update("initial_products", v); }} className={`${inputCls} md:col-span-2`} rows={2} placeholder="Description" />
                        </div>
                        <button onClick={() => update("initial_products", form.initial_products.filter((_, j) => j !== i))} className="mt-2 text-xs font-semibold text-red-600">Supprimer ce produit</button>
                      </div>
                    ))}
                    <button onClick={() => update("initial_products", [...form.initial_products, { name: "", price: "", description: "", image_url: "", category: "", stock: "10" }])} className="text-sm font-semibold text-violet-600">+ Ajouter produit</button>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Frais domicile par défaut (DA)" hint="Wilaya 0 = zone par défaut (appliquée partout)"><input value={form.default_home_fee} onChange={(e) => update("default_home_fee", e.target.value)} className={inputCls} placeholder="400" /></Field>
            <Field label="Frais bureau par défaut (DA)"><input value={form.default_office_fee} onChange={(e) => update("default_office_fee", e.target.value)} className={inputCls} placeholder="600" /></Field>
            <Field label="Options"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.cod_enabled} onChange={(e) => update("cod_enabled", e.target.checked)} /> Paiement à la livraison activé</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.office_delivery_enabled} onChange={(e) => update("office_delivery_enabled", e.target.checked)} /> Livraison bureau activée</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reviews_enabled} onChange={(e) => update("reviews_enabled", e.target.checked)} /> Avis clients activés</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.faq_enabled} onChange={(e) => update("faq_enabled", e.target.checked)} /> FAQ activée</label></Field>
          </div>
        )}

        {step === 7 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meta Pixel ID" hint="Uniquement l'ID, pas de code"><input value={form.meta_pixel_id} onChange={(e) => update("meta_pixel_id", e.target.value)} className={inputCls} placeholder="1234567890" /></Field>
            <Field label="TikTok Pixel ID"><input value={form.tiktok_pixel_id} onChange={(e) => update("tiktok_pixel_id", e.target.value)} className={inputCls} placeholder="…" /></Field>
            <Field label="GA4 Measurement ID"><input value={form.ga4_measurement_id} onChange={(e) => update("ga4_measurement_id", e.target.value)} className={inputCls} placeholder="G-XXXXXXXX" /></Field>
            <Field label="GTM Container ID"><input value={form.gtm_container_id} onChange={(e) => update("gtm_container_id", e.target.value)} className={inputCls} placeholder="GTM-XXXX" /></Field>
            <Field label="Google Ads Customer ID"><input value={form.google_ads_customer_id} onChange={(e) => update("google_ads_customer_id", e.target.value)} className={inputCls} placeholder="123-456-7890" /></Field>
            <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <strong>Intégrations avancées</strong> (Navex, Google Sheets, WhatsApp/Swivigo) seront configurées après création via Administration avancée → Intégrations. Les credentials sont chiffrés côté serveur et jamais exposés.
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
            <button onClick={submit} disabled={busy || !form.business_name || !form.owner_email} className={btnPrimary}>{busy ? "Création…" : "Créer le site"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
