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
    <div className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 xl:grid-cols-[minmax(180px,2fr)_repeat(3,minmax(120px,1fr))_repeat(2,minmax(130px,1fr))_auto]">
      <div className="col-span-2 sm:col-span-3 xl:col-span-1">
        <label htmlFor="order-search" className="mb-1 block text-sm font-semibold text-slate-600">Recherche</label>
        <input
          id="order-search"
          className={inputCls}
          placeholder="N°, nom, téléphone…"
          defaultValue={params.get("q") ?? ""}
          onBlur={(e) => update("q", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update("q", (e.target as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label htmlFor="order-product" className="mb-1 block text-sm font-semibold text-slate-600">Produit</label>
        <select id="order-product" className={inputCls} value={params.get("product") ?? ""} onChange={(e) => update("product", e.target.value)}>
          <option value="">Tous les produits</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="order-status" className="mb-1 block text-sm font-semibold text-slate-600">Statut</label>
        <select id="order-status" className={inputCls} value={params.get("status") ?? ""} onChange={(e) => update("status", e.target.value)}>
          <option value="">Tous</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="order-wilaya" className="mb-1 block text-sm font-semibold text-slate-600">Wilaya</label>
        <select id="order-wilaya" className={inputCls} value={params.get("wilaya") ?? ""} onChange={(e) => update("wilaya", e.target.value)}>
          <option value="">Toutes</option>
          {wilayas.map((w) => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="order-from" className="mb-1 block text-sm font-semibold text-slate-600">Du</label>
        <input id="order-from" type="date" className={inputCls} value={params.get("from") ?? ""} onChange={(e) => update("from", e.target.value)} />
      </div>
      <div>
        <label htmlFor="order-to" className="mb-1 block text-sm font-semibold text-slate-600">Au</label>
        <input id="order-to" type="date" className={inputCls} value={params.get("to") ?? ""} onChange={(e) => update("to", e.target.value)} />
      </div>
      <button type="button" className={`${btnSecondary} col-span-2 sm:col-span-1`} onClick={() => router.replace(pathname, { scroll: false })}>
        Réinitialiser
      </button>
    </div>
  );
}
