"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDA } from "../../lib/utils";
import { StorefrontImage } from "./image";

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  category_id: string | null;
  category_name: string | null;
  image: string | null;
  is_featured: boolean;
}

export interface ShopCategory {
  id: string;
  slug: string;
  name: string;
}

export function ShopBrowser({
  products,
  categories,
  base,
  dict,
}: {
  products: ShopProduct[];
  categories: ShopCategory[];
  base: string;
  dict: { search: string; noResults: string; categories: string; all: string; order: string };
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat && p.category_id !== cat) return false;
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [products, q, cat]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              cat === null ? "bg-[var(--fx-primary)] text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {dict.all}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                cat === c.id ? "bg-[var(--fx-primary)] text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={dict.search}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--fx-primary)] sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-slate-500">{dict.noResults}</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <Link href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
                {p.image ? (
                  <StorefrontImage src={p.image} alt={p.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-slate-300">🛍️</div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                {p.category_name ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{p.category_name}</span>
                ) : null}
                <Link href={`${base}/produit/${p.slug}`} className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-[var(--fx-primary)]">
                  {p.name}
                </Link>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-[var(--fx-primary)]">{formatDA(p.price_cents)}</span>
                  {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? (
                    <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span>
                  ) : null}
                </div>
                <Link
                  href={`${base}/commande?product=${p.id}`}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--fx-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {dict.order}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
