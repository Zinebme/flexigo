"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SECTION_DEFS,
  SECTION_ORDER,
  type Section,
  type SectionType,
} from "@/lib/sections/definitions";
import type { WebsiteType } from "@/lib/types";
import { shortId } from "@/lib/utils";

/**
 * Structured section editor.
 *
 * Merchants can only: add/remove/reorder ALLOWED predefined sections, edit
 * their approved fields (titles, subtitles, images, buttons), and toggle
 * visibility. There is NO free-form HTML/JS/CSS — the design is fixed by the
 * template, the server revalidates the whole content tree on save, and the
 * live site only serves the last published snapshot.
 */

type FieldKind = "text" | "textarea" | "number" | "boolean" | "image" | "alignment" | "source" | "category" | "link" | "items";
interface FieldSpec { key: string; label: string; kind: FieldKind; options?: string[]; placeholder?: string }

// Approved editable fields per section type (UI only — server is the source of truth).
const FIELDS: Record<SectionType, FieldSpec[]> = {
  hero: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "subtitle", label: "Sous-titre", kind: "text" },
    { key: "image", label: "Image", kind: "image" },
    // Optional additions (used by the SOUQ template; ignored by the others).
    { key: "mobile_image", label: "Image mobile (optionnel)", kind: "image" },
    { key: "badge", label: "Badge (optionnel)", kind: "text" },
    { key: "promo_text", label: "Texte promo (optionnel)", kind: "text" },
    { key: "button_text", label: "Texte du bouton", kind: "text" },
    { key: "button_link", label: "Lien du bouton", kind: "link" },
    { key: "alignment", label: "Alignement", kind: "alignment" },
  ],
  banner: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "subtitle", label: "Sous-titre", kind: "text" },
    { key: "desktop_image", label: "Image desktop (1600×700)", kind: "image" },
    { key: "mobile_image", label: "Image mobile (800×1000)", kind: "image" },
    { key: "button_text", label: "Texte du bouton", kind: "text" },
    { key: "button_link", label: "Lien du bouton", kind: "link" },
    { key: "alignment", label: "Alignement", kind: "alignment" },
    { key: "show_desktop", label: "Visible sur desktop", kind: "boolean" },
    { key: "show_mobile", label: "Visible sur mobile", kind: "boolean" },
  ],
  collections: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "subtitle", label: "Sous-titre", kind: "text" },
    { key: "category_id", label: "Catégorie (optionnel)", kind: "category" },
    { key: "max_items", label: "Nombre max d'éléments", kind: "number" },
  ],
  products: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "subtitle", label: "Sous-titre", kind: "text" },
    { key: "source", label: "Source", kind: "source" },
    { key: "product_count", label: "Nombre de produits", kind: "number" },
  ],
  features: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }, { key: "items", label: "Avantages", kind: "items" }],
  how_it_works: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }, { key: "steps", label: "Étapes", kind: "items" }],
  social_proof: [{ key: "title", label: "Titre", kind: "text" }, { key: "items", label: "Chiffres", kind: "items" }],
  reviews: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }],
  faq: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }, { key: "max_items", label: "Nombre max", kind: "number" }],
  offer: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }, { key: "text", label: "Texte", kind: "textarea" }],
  gallery: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }],
  before_after: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "subtitle", label: "Sous-titre", kind: "text" },
    { key: "before_image", label: "Image avant", kind: "image" },
    { key: "after_image", label: "Image après", kind: "image" },
    { key: "before_label", label: "Libellé avant", kind: "text" },
    { key: "after_label", label: "Libellé après", kind: "text" },
    { key: "note", label: "Note (informationnel)", kind: "textarea" },
  ],
  services: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }, { key: "items", label: "Services", kind: "items" }],
  testimonials: [{ key: "title", label: "Titre", kind: "text" }, { key: "items", label: "Témoignages", kind: "items" }],
  stats: [{ key: "title", label: "Titre", kind: "text" }, { key: "items", label: "Statistiques", kind: "items" }],
  hours: [{ key: "title", label: "Titre", kind: "text" }, { key: "days", label: "Jours", kind: "items" }],
  map: [{ key: "title", label: "Titre", kind: "text" }, { key: "address", label: "Adresse", kind: "text" }, { key: "note", label: "Note", kind: "text" }],
  contact: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "text", label: "Texte", kind: "textarea" },
    { key: "show_phone", label: "Afficher le téléphone", kind: "boolean" },
    { key: "show_whatsapp", label: "Afficher WhatsApp", kind: "boolean" },
    { key: "show_email", label: "Afficher l'email", kind: "boolean" },
  ],
  cta: [
    { key: "title", label: "Titre", kind: "text" },
    { key: "text", label: "Texte", kind: "textarea" },
    { key: "button_text", label: "Texte du bouton", kind: "text" },
    { key: "button_link", label: "Lien du bouton", kind: "link" },
  ],
  cod_form: [{ key: "title", label: "Titre", kind: "text" }, { key: "subtitle", label: "Sous-titre", kind: "text" }],
  sticky_cta: [{ key: "text", label: "Texte", kind: "text" }, { key: "button_text", label: "Texte du bouton", kind: "text" }],
};

// Sub-item field shapes for "items" kind sections.
const ITEM_FIELDS: Partial<Record<SectionType, Array<{ key: string; label: string }>>> = {
  features: [{ key: "title", label: "Titre" }, { key: "text", label: "Description" }],
  how_it_works: [{ key: "title", label: "Titre" }, { key: "text", label: "Description" }],
  services: [{ key: "title", label: "Titre" }, { key: "text", label: "Description" }],
  testimonials: [{ key: "name", label: "Nom" }, { key: "role", label: "Fonction" }, { key: "text", label: "Témoignage" }],
  social_proof: [{ key: "value", label: "Chiffre" }, { key: "label", label: "Libellé" }],
  stats: [{ key: "value", label: "Chiffre" }, { key: "label", label: "Libellé" }],
  hours: [{ key: "day", label: "Jour" }, { key: "value", label: "Horaire" }],
};

interface Props {
  pageKey: string;
  pageTitle: string;
  initialContent: { sections: Section[] };
  websiteType: WebsiteType;
  categories: Array<{ id: string; name: string }>;
  apiBase?: string;
  uploadUrl?: string;
}

export function SectionEditor({
  pageKey,
  pageTitle,
  initialContent,
  websiteType,
  categories,
  apiBase = "/api/dashboard/pages",
  uploadUrl = "/api/dashboard/upload",
}: Props) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialContent.sections ?? []);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [versionNote, setVersionNote] = useState<string | null>(null);

  const allowedTypes = useMemo(
    () => SECTION_ORDER.filter((t) => SECTION_DEFS[t].allowedFor.includes(websiteType)),
    [websiteType],
  );

  function updateSection(idx: number, patch: Record<string, unknown>) {
    setSections((prev) => prev.map((s, i) => (i === idx ? ({ ...s, ...patch } as Section) : s)));
  }

  function move(idx: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const j = idx + dir;
      const a = next[idx];
      const b = next[j];
      if (j < 0 || j >= next.length || a === undefined || b === undefined) return prev;
      next[idx] = b;
      next[j] = a;
      return next;
    });
  }

  function remove(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function add(type: SectionType) {
    const section = {
      id: shortId(),
      type,
      enabled: true,
      ...(SECTION_DEFS[type].defaultData as Record<string, unknown>),
    } as Section;
    setSections((prev) => [...prev, section]);
  }

  async function uploadImage(idx: number, field: string, file: File) {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", "banner");
    const res = await fetch(uploadUrl, { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; warnings?: string[]; error?: { message?: string } | string };
    if (!res.ok || !data.ok || !data.url) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Téléversement impossible"));
      return;
    }
    if (data.warnings?.length) setVersionNote(`⚠️ ${data.warnings[0]}`);
    updateSection(idx, { [field]: data.url });
  }

  async function saveDraft(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fetch(`${apiBase}/${pageKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: pageTitle, content: { sections } }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOkMsg("Brouillon enregistré. La version en ligne n'est pas encore modifiée.");
    router.refresh();
  }

  async function publish() {
    if (!window.confirm("Publier cette version ? Elle remplacera immédiatement le contenu en ligne.")) return;
    setPublishing(true);
    setError(null);
    setOkMsg(null);
    // Save draft first, then publish that draft.
    const saveRes = await fetch(`${apiBase}/${pageKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { sections } }),
    });
    const saveData = (await saveRes.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    if (!saveRes.ok || !saveData.ok) {
      setPublishing(false);
      setError(typeof saveData.error === "string" ? saveData.error : (saveData.error?.message ?? "Enregistrement du brouillon impossible"));
      return;
    }
    const pubRes = await fetch(`${apiBase}/${pageKey}/publish`, { method: "POST" });
    const pubData = (await pubRes.json().catch(() => ({}))) as { ok?: boolean; version?: number; error?: { message?: string } | string };
    setPublishing(false);
    if (!pubRes.ok || !pubData.ok) {
      setError(typeof pubData.error === "string" ? pubData.error : (pubData.error?.message ?? "Publication impossible"));
      return;
    }
    setOkMsg(`Publié — version ${pubData.version} maintenant en ligne.`);
    router.refresh();
  }

  const label = "mb-1 block text-sm font-semibold text-slate-700";

  return (
    <form onSubmit={saveDraft} className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Vous modifiez le <span className="font-semibold">brouillon</span>. Le site en ligne n'est modifié qu'après « Publier ».
        Seuls des types de section préapprouvés sont disponibles pour ce type de site — aucune mise en forme libre.
      </div>

      {sections.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
          Aucune section. Ajoutez-en une ci-dessous.
        </p>
      )}

      {sections.map((s, idx) => {
        const def = SECTION_DEFS[s.type as SectionType];
        const specs = FIELDS[s.type as SectionType] ?? [];
        const rec = s as Record<string, unknown>;
        return (
          <div key={s.id} className={`rounded-xl border bg-white p-4 shadow-sm ${s.enabled ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{def?.label ?? s.type}</span>
                <span className="text-xs text-slate-400">Section {idx + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Monter">↑</button>
                <button type="button" className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100" onClick={() => move(idx, 1)} disabled={idx === sections.length - 1} aria-label="Descendre">↓</button>
                <button type="button" className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50" onClick={() => updateSection(idx, { enabled: !(rec.enabled as boolean) })}>
                  {rec.enabled ? "Visible" : "Masquée"}
                </button>
                <button type="button" className="rounded-md px-2 py-1 text-sm font-semibold text-red-500 hover:bg-red-50" onClick={() => remove(idx)}>Retirer</button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {specs.map((f) => (
                <div key={f.key} className={f.kind === "textarea" || f.kind === "items" ? "md:col-span-2" : ""}>
                  <FieldControl
                    spec={f}
                    section={s}
                    categories={categories}
                    onChange={(patch) => updateSection(idx, patch)}
                    onUpload={f.kind === "image" ? (file) => uploadImage(idx, f.key, file) : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-dashed border-slate-300 p-4">
        <label className={label}>Ajouter une section</label>
        <div className="flex flex-wrap gap-2">
          {allowedTypes.map((t) => (
            <button key={t} type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-600" onClick={() => add(t)}>
              + {SECTION_DEFS[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <button type="submit" className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 disabled:opacity-50" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
        </button>
        <button type="button" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50" onClick={publish} disabled={publishing}>
          {publishing ? "Publication…" : "Publier"}
        </button>
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      {versionNote && <p className="text-sm text-amber-600">{versionNote}</p>}
    </form>
  );
}

function FieldControl({
  spec,
  section,
  categories,
  onChange,
  onUpload,
}: {
  spec: FieldSpec;
  section: Section;
  categories: Array<{ id: string; name: string }>;
  onChange: (patch: Record<string, unknown>) => void;
  onUpload?: (file: File) => void;
}) {
  const rec = section as Record<string, unknown>;
  const value = rec[spec.key];
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const label = "mb-1 block text-sm font-semibold text-slate-700";

  if (spec.kind === "text") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <input className={input} value={(value as string) ?? ""} maxLength={240} onChange={(e) => onChange({ [spec.key]: e.target.value })} />
      </div>
    );
  }
  if (spec.kind === "textarea") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <textarea className={input} rows={3} value={(value as string) ?? ""} maxLength={2000} onChange={(e) => onChange({ [spec.key]: e.target.value })} />
      </div>
    );
  }
  if (spec.kind === "number") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <input type="number" min={1} max={100} className={input} value={Number(value ?? 1) || 1} onChange={(e) => onChange({ [spec.key]: Number.parseInt(e.target.value, 10) || 1 })} />
      </div>
    );
  }
  if (spec.kind === "boolean") {
    return (
      <label className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={Boolean(value)} onChange={(e) => onChange({ [spec.key]: e.target.checked })} />
        {spec.label}
      </label>
    );
  }
  if (spec.kind === "alignment") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <select className={input} value={(value as string) ?? "left"} onChange={(e) => onChange({ [spec.key]: e.target.value })}>
          <option value="left">Gauche</option>
          <option value="center">Centré</option>
          <option value="right">Droite</option>
        </select>
      </div>
    );
  }
  if (spec.kind === "source") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <select className={input} value={(value as string) ?? "featured"} onChange={(e) => onChange({ [spec.key]: e.target.value })}>
          <option value="featured">Mise en avant</option>
          <option value="latest">Plus récents</option>
          <option value="all">Tous</option>
        </select>
      </div>
    );
  }
  if (spec.kind === "category") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <select className={input} value={(value as string) ?? ""} onChange={(e) => onChange({ [spec.key]: e.target.value || null })}>
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    );
  }
  if (spec.kind === "link") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <input className={input} value={(value as string) ?? ""} placeholder="/boutique ou https://…" onChange={(e) => onChange({ [spec.key]: e.target.value || null })} />
      </div>
    );
  }
  if (spec.kind === "image") {
    return (
      <div>
        <label className={label}>{spec.label}</label>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="text-sm" onChange={(e) => e.target.files?.[0] && onUpload?.(e.target.files[0])} />
          {typeof value === "string" && value.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-12 w-20 rounded-lg border border-slate-200 object-cover" />
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-400">Recommandé desktop : 1600×700 · mobile : 800×1000. Une résolution trop faible est signalée.</p>
      </div>
    );
  }
  // items
  const items = Array.isArray(value) ? (value as Array<Record<string, string>>) : [];
  const itemSpecs = ITEM_FIELDS[section.type as SectionType] ?? [{ key: "title", label: "Titre" }, { key: "text", label: "Description" }];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{spec.label}</label>
        <button type="button" className="text-sm font-semibold text-blue-600 hover:underline" onClick={() => items.length < 9 && onChange({ [spec.key]: [...items, Object.fromEntries(itemSpecs.map((i) => [i.key, ""]))] })} disabled={items.length >= 9}>
          + Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-400">Aucun élément.</p>}
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-[2fr_2fr_auto]">
            {itemSpecs.map((f) => (
              <input key={f.key} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" placeholder={f.label} value={(it[f.key] as string) ?? ""} onChange={(e) => onChange({ [spec.key]: items.map((x, xi) => (xi === i ? { ...x, [f.key]: e.target.value } : x)) })} />
            ))}
            <button type="button" className="rounded-lg px-2 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50" onClick={() => onChange({ [spec.key]: items.filter((_, xi) => xi !== i) })}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
