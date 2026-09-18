"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  is_visible: boolean;
  position: number;
}

interface Props {
  categories: CategoryItem[];
}

const emptyForm = { name: "", slug: "", description: "", image_url: "", is_visible: true, position: 0 };

/**
 * Categories manager: add / edit / soft-delete (capability enforced server-side).
 */
export function CategoriesManager({ categories: initial }: Props) {
  const router = useRouter();
  const [list, setList] = useState<CategoryItem[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
    setError(null);
  }

  function startEdit(c: CategoryItem) {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "", image_url: c.image_url, is_visible: c.is_visible, position: c.position });
    setOpen(true);
    setError(null);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", "category");
    try {
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: { message?: string } | string };
      if (!res.ok || !data.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Téléversement impossible"));
        return;
      }
      setForm((f) => ({ ...f, image_url: data.url as string }));
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      image_url: form.image_url,
      is_visible: form.is_visible,
      position: form.position,
    };
    const res = await fetch(editing ? `/api/dashboard/categories/${editing.id}` : "/api/dashboard/categories", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOpen(false);
    router.refresh();
    // Refresh local list too for snappy UX.
    setList(editing
      ? list.map((c) => (c.id === editing.id ? { ...c, name: form.name, slug: form.slug || c.slug, description: form.description || null, image_url: form.image_url, is_visible: form.is_visible, position: form.position } : c))
      : [...list, { id: "new", name: form.name, slug: form.slug, description: form.description || null, image_url: form.image_url, is_visible: form.is_visible, position: form.position }],
    );
  }

  async function del(c: CategoryItem) {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ? Les produits ne sont pas supprimés.`)) return;
    const res = await fetch(`/api/dashboard/categories/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      alert(typeof data.error === "string" ? data.error : (data.error?.message ?? "Suppression impossible"));
    }
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          onClick={startAdd}
        >
          + Nouvelle catégorie
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nom *</label>
              <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={80} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Slug (optionnel)</label>
              <input className={input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} maxLength={80} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Ordre</label>
              <input type="number" className={input} value={form.position} onChange={(e) => setForm({ ...form, position: Number.parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Image *</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="text-sm"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  disabled={uploading}
                />
                {form.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
            <textarea className={input} rows={2} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} />
            Visible sur le site
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50" disabled={busy || !form.image_url}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Annuler
            </button>
            {!form.image_url && <span className="text-xs text-amber-600">Une image est requise (téléversez-la d'abord).</span>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {list.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucune catégorie.</p>}
        {list.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">{c.name}</span>
                <span className="text-xs text-slate-400">/{c.slug} · ordre {c.position}</span>
                {!c.is_visible && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Masquée</span>}
              </div>
              {c.description && <p className="truncate text-sm text-slate-500">{c.description}</p>}
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:underline" onClick={() => startEdit(c)}>
              Modifier
            </button>
            <button className="text-sm font-semibold text-red-500 hover:underline" onClick={() => del(c)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
