"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { btnSecondary } from "../ui";

export function ProductFilters({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Recherche</label>
        <input
          className={`${inputCls} w-56`}
          placeholder="Nom, slug, SKU…"
          defaultValue={params.get("q") ?? ""}
          onKeyDown={(e) => e.key === "Enter" && update("q", (e.target as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Catégorie</label>
        <select className={`${inputCls} w-44`} value={params.get("cat") ?? ""} onChange={(e) => update("cat", e.target.value)}>
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Stock</label>
        <select className={`${inputCls} w-44`} value={params.get("stock") ?? ""} onChange={(e) => update("stock", e.target.value)}>
          <option value="">Tous</option>
          <option value="low">Stock faible</option>
          <option value="out">Rupture</option>
          <option value="in">En stock</option>
        </select>
      </div>
      <button className={btnSecondary} onClick={() => router.replace(pathname, { scroll: false })}>
        Réinitialiser
      </button>
    </div>
  );
}
