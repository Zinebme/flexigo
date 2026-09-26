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

  const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

  return (
    <div className="grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_repeat(2,minmax(150px,1fr))_auto]">
      <div>
        <label htmlFor="product-search" className="mb-1 block text-sm font-semibold text-slate-600">Recherche</label>
        <input
          id="product-search"
          className={inputCls}
          placeholder="Nom, slug, SKU…"
          defaultValue={params.get("q") ?? ""}
          onBlur={(e) => update("q", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update("q", (e.target as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label htmlFor="product-category" className="mb-1 block text-sm font-semibold text-slate-600">Catégorie</label>
        <select id="product-category" className={inputCls} value={params.get("cat") ?? ""} onChange={(e) => update("cat", e.target.value)}>
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="product-stock" className="mb-1 block text-sm font-semibold text-slate-600">Stock</label>
        <select id="product-stock" className={inputCls} value={params.get("stock") ?? ""} onChange={(e) => update("stock", e.target.value)}>
          <option value="">Tous</option>
          <option value="low">Stock faible</option>
          <option value="out">Rupture</option>
          <option value="in">En stock</option>
        </select>
      </div>
      <button type="button" className={btnSecondary} onClick={() => router.replace(pathname, { scroll: false })}>
        Réinitialiser
      </button>
    </div>
  );
}
