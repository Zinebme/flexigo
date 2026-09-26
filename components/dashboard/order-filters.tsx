"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { btnSecondary, inputCls } from "../ui";

/**
 * Order list filters — URL-driven (shareable, refresh-safe).
 */
export function OrderFilters({ statuses, wilayas, products = [] }: { statuses: Array<{ value: string; label: string }>; wilayas: Array<{ code: number; name: string }>; products?: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Recherche</label>
        <input
          className={`${inputCls} w-52`}
          placeholder="N°, nom, téléphone…"
          defaultValue={params.get("q") ?? ""}
          onBlur={(e) => update("q", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update("q", (e.target as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Produit</label>
        <select className={`${inputCls} w-44`} value={params.get("product") ?? ""} onChange={(e) => update("product", e.target.value)}>
          <option value="">Tous les produits</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Statut</label>
        <select className={`${inputCls} w-44`} value={params.get("status") ?? ""} onChange={(e) => update("status", e.target.value)}>
          <option value="">Tous</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Wilaya</label>
        <select className={`${inputCls} w-40`} value={params.get("wilaya") ?? ""} onChange={(e) => update("wilaya", e.target.value)}>
          <option value="">Toutes</option>
          {wilayas.map((w) => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Du</label>
        <input type="date" className={`${inputCls} w-40`} value={params.get("from") ?? ""} onChange={(e) => update("from", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Au</label>
        <input type="date" className={`${inputCls} w-40`} value={params.get("to") ?? ""} onChange={(e) => update("to", e.target.value)} />
      </div>
      <button className={btnSecondary} onClick={() => router.replace(pathname, { scroll: false })}>
        Réinitialiser
      </button>
    </div>
  );
}
