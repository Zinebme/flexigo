"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Product list filters — URL-driven (`q`, `cat`, `stock`), same parameters as
 * before. Stock became one-click pills instead of a dropdown, and the search
 * is debounced with a clear button.
 */

const STOCK_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "in", label: "En stock" },
  { value: "low", label: "Stock faible" },
  { value: "out", label: "Rupture" },
];

export function ProductFilters({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [term, setTerm] = useState(params.get("q") ?? "");

  function update(entries: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Debounced search.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (term === current) return;
    const t = setTimeout(() => update({ q: term.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const stock = params.get("stock") ?? "";
  const cat = params.get("cat") ?? "";
  const q = params.get("q") ?? "";
  const hasFilters = Boolean(q || cat || stock);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                update({ q: term.trim() });
              }
            }}
            placeholder="Nom, slug ou SKU…"
            aria-label="Rechercher un produit"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white ps-9 pe-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          {term ? (
            <button
              type="button"
              onClick={() => { setTerm(""); update({ q: null }); }}
              aria-label="Effacer la recherche"
              className="absolute top-1/2 end-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>

        <div className="relative lg:w-56">
          <select
            aria-label="Filtrer par catégorie"
            value={cat}
            onChange={(e) => update({ cat: e.target.value || null })}
            className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white ps-3 pe-8 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Icon name="chevronDown" size={15} className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="fx-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:mx-0 lg:px-0">
          {STOCK_OPTIONS.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => update({ stock: option.value || null })}
              aria-pressed={stock === option.value}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                stock === option.value
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {option.value === "out" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              ) : option.value === "low" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              ) : option.value === "in" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ) : null}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-400">Filtres actifs</span>
          {q ? (
            <button
              type="button"
              onClick={() => { setTerm(""); update({ q: null }); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Recherche : {q}
              <Icon name="x" size={12} strokeWidth={2.4} />
            </button>
          ) : null}
          {cat ? (
            <button
              type="button"
              onClick={() => update({ cat: null })}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Catégorie : {categories.find((c) => c.id === cat)?.name ?? cat}
              <Icon name="x" size={12} strokeWidth={2.4} />
            </button>
          ) : null}
          {stock ? (
            <button
              type="button"
              onClick={() => update({ stock: null })}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Stock : {STOCK_OPTIONS.find((o) => o.value === stock)?.label ?? stock}
              <Icon name="x" size={12} strokeWidth={2.4} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => { setTerm(""); router.replace(pathname, { scroll: false }); }}
            className="ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Icon name="refresh" size={13} />
            Tout réinitialiser
          </button>
        </div>
      ) : null}
    </div>
  );
}
