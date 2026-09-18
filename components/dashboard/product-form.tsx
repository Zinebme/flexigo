"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Product create/edit form (merchant side).
 * Prices are entered in DA; the server converts to integer cents and
 * revalidates everything — the browser is never trusted for totals.
 */

export interface ProductFormInitial {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  images: string[];
  seo_title: string;
  seo_description: string;
  variants: Array<{ id?: string; name: string; options_text: string; price: number | null; stock: number; is_active: boolean }>;
  offers: Array<{ min_quantity: number; total_price: number; label: string }>;
}

interface Props {
  initial: ProductFormInitial;
  categories: Array<{ id: string; name: string }>;
  mode: "create" | "edit";
}

interface VariantDraft {
  id?: string;
  name: string;
  options_text: string;
  price: string;
  stock: string;
  is_active: boolean;
}

interface OfferDraft {
  min_quantity: string;
  total_price: string;
  label: string;
}

export function ProductForm({ initial, categories, mode }: Props) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(String(initial.price || ""));
  const [compareAt, setCompareAt] = useState(initial.compare_at_price != null ? String(initial.compare_at_price) : "");
  const [sku, setSku] = useState(initial.sku);
  const [threshold, setThreshold] = useState(String(initial.low_stock_threshold));
  const [isActive, setIsActive] = useState(initial.is_active);
  const [isFeatured, setIsFeatured] = useState(initial.is_featured);
  const [categoryId, setCategoryId] = useState(initial.category_id ?? "");
  const [seoTitle, setSeoTitle] = useState(initial.seo_title);
  const [seoDescription, setSeoDescription] = useState(initial.seo_description);
  const [images, setImages] = useState<string[]>(initial.images);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial.variants.map((v) => ({ id: v.id, name: v.name, options_text: v.options_text, price: v.price != null ? String(v.price) : "", stock: String(v.stock), is_active: v.is_active })),
  );
  const [offers, setOffers] = useState<OfferDraft[]>(
    initial.offers.map((o) => ({ min_quantity: String(o.min_quantity), total_price: String(o.total_price), label: o.label })),
  );

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const slugSuggestion = useMemo(
    () =>
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80),
    [name],
  );
  const shownSlug = slugTouched ? slug : slugSuggestion;

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", "product");
    try {
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: { message?: string } | string; warnings?: string[] };
      if (!res.ok || !data.ok || !data.url) {
        const msg = typeof data.error === "string" ? data.error : (data.error?.message ?? "Téléversement impossible");
        setError(msg);
        return;
      }
      if (data.warnings?.length) setError(`⚠️ ${data.warnings[0]}`);
      setImages((prev) => (prev.length >= 8 ? prev : [...prev, data.url as string]));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(null);

    const parsed: Record<string, unknown> = {
      name,
      slug: shownSlug,
      description,
      price: Number.parseFloat(price),
      compare_at_price: compareAt ? Number.parseFloat(compareAt) : null,
      sku,
      low_stock_threshold: Number.parseInt(threshold, 10) || 0,
      is_active: isActive,
      is_featured: isFeatured,
      category_id: categoryId || null,
      seo_title: seoTitle,
      seo_description: seoDescription,
      images,
      variants: variants
        .filter((v) => v.name.trim())
        .map((v) => {
          const options: Record<string, string> = {};
          for (const part of v.options_text.split(",")) {
            const [k, ...rest] = part.split(":");
            if (k && rest.length) options[k.trim()] = rest.join(":").trim();
          }
          return {
            name: v.name.trim(),
            options,
            price_cents: v.price ? Math.round(Number.parseFloat(v.price) * 100) : null,
            stock: Number.parseInt(v.stock, 10) || 0,
            is_active: v.is_active,
          };
        }),
    };

    const cleanOffers: Array<{ min_quantity: number; total_price_cents: number; label: string | null }> = offers
      .filter((o) => o.min_quantity && o.total_price)
      .map((o) => ({
        min_quantity: Number.parseInt(o.min_quantity, 10),
        total_price_cents: Math.round(Number.parseFloat(o.total_price) * 100),
        label: o.label.trim() || null,
      }));
    if (cleanOffers.length) parsed.offers = cleanOffers;

    if (mode === "edit" && initial.id) {
      parsed.remove_variant_ids = variants.filter((v) => !v.name.trim() && v.id).map((v) => v.id as string);
    }

    const res = await fetch(mode === "create" ? "/api/dashboard/products" : `/api/dashboard/products/${initial.id}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    if (mode === "create" && data.id) {
      router.push(`/dashboard/produits/${data.id}`);
    } else {
      setOkMsg("Produit enregistré.");
    }
  }

  const label = "mb-1 block text-sm font-semibold text-slate-700";
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Nom du produit *</label>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
        </div>
        <div>
          <label className={label}>Slug (URL)</label>
          <input className={input} value={shownSlug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} maxLength={120} />
        </div>
        <div>
          <label className={label}>Catégorie</label>
          <select className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Prix (DA) *</label>
          <input type="number" step="0.01" min="0.01" className={input} value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className={label}>Prix barré (DA)</label>
          <input type="number" step="0.01" min="0" className={input} value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Optionnel" />
        </div>
        <div>
          <label className={label}>SKU</label>
          <input className={input} value={sku} onChange={(e) => setSku(e.target.value)} maxLength={60} />
        </div>
        <div>
          <label className={label}>Seuil stock faible</label>
          <input type="number" min="0" className={input} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Description</label>
          <textarea className={input} rows={5} maxLength={6000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label}>Images (JPG, PNG, WebP, SVG — max 8)</span>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="text-sm" />
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" onClick={handleUpload} disabled={uploading || images.length >= 8}>
              {uploading ? "Envoi…" : "Ajouter"}
            </button>
          </div>
        </div>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((url, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label="Retirer l'image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label}>Variantes (couleur, taille…)</span>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:underline"
            onClick={() => variants.length < 12 && setVariants((prev) => [...prev, { name: "", options_text: "", price: "", stock: "0", is_active: true }])}
            disabled={variants.length >= 12}
          >
            + Ajouter une variante
          </button>
        </div>
        {variants.length === 0 && <p className="text-sm text-slate-400">Aucune variante.</p>}
        <div className="space-y-2">
          {variants.map((v, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_100px_90px_auto]">
              <input
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="Nom (ex : Rouge / M)"
                value={v.name}
                maxLength={80}
                onChange={(e) => setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="Options (ex : Couleur: Rouge, Taille: M)"
                value={v.options_text}
                onChange={(e) => setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, options_text: e.target.value } : x)))}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="Prix DA"
                value={v.price}
                onChange={(e) => setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x)))}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, stock: e.target.value } : x)))}
                />
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label}>Offres quantité (ex : 2 pièces = 3 900 DA)</span>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:underline"
            onClick={() => offers.length < 5 && setOffers((prev) => [...prev, { min_quantity: "2", total_price: "", label: "" }])}
            disabled={offers.length >= 5}
          >
            + Ajouter une offre
          </button>
        </div>
        {offers.length === 0 && <p className="text-sm text-slate-400">Aucune offre.</p>}
        <div className="space-y-2">
          {offers.map((o, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[90px_140px_1fr_auto]">
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-500">À partir de</span>
                <input
                  type="number"
                  min="2"
                  max="50"
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  value={o.min_quantity}
                  onChange={(e) => setOffers((prev) => prev.map((x, i) => (i === idx ? { ...x, min_quantity: e.target.value } : x)))}
                />
                <span className="text-sm text-slate-500">pièces</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="Prix total DA"
                value={o.total_price}
                onChange={(e) => setOffers((prev) => prev.map((x, i) => (i === idx ? { ...x, total_price: e.target.value } : x)))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="Libellé (ex : Offre 2+)"
                value={o.label}
                maxLength={80}
                onChange={(e) => setOffers((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
              />
              <button
                type="button"
                className="rounded-lg px-2 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                onClick={() => setOffers((prev) => prev.filter((_, i) => i !== idx))}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>SEO — Titre (optionnel)</label>
          <input className={input} maxLength={160} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </div>
        <div>
          <label className={label}>SEO — Description (optionnelle)</label>
          <textarea className={input} rows={2} maxLength={300} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Produit actif
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Mis en avant
        </label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Enregistrement…" : mode === "create" ? "Créer le produit" : "Enregistrer les modifications"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
      </div>
    </form>
  );
}
