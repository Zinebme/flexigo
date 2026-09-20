"use client";

import { useMemo, useState } from "react";
import { searchProducts, type SouqSearchItem } from "@/lib/storefront/souq/search";
import type { SouqCategory, SouqProductSummary } from "@/lib/storefront/souq/catalog";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { StoreLanguage } from "@/lib/types";
import { NoorProductCard } from "./noor-product-card";
import { NoorEmpty, NoorIcon } from "./noor-ui";

type Sort = "default" | "price-asc" | "price-desc" | "new" | "featured";

export function NoorShop({
  products,
  categories,
  base,
  copy,
  lang,
  currency,
  initialCategory = null,
  initialOffers = false,
  initialSort = "default",
}: {
  products: SouqProductSummary[];
  categories: SouqCategory[];
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
  initialCategory?: string | null;
  initialOffers?: boolean;
  initialSort?: Sort;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [offers, setOffers] = useState(initialOffers);
  const [sort, setSort] = useState<Sort>(initialSort);
  const index: SouqSearchItem[] = useMemo(
    () => products.map((product) => ({ id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents, compareAtPriceCents: product.compareAtPriceCents, image: product.image, categoryName: product.categoryName, isFeatured: product.isFeatured })),
    [products],
  );
  const filtered = useMemo(() => {
    let result = products;
    if (category) result = result.filter((product) => product.categoryId === category);
    if (offers) result = result.filter((product) => Boolean(product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents));
    if (query.trim()) {
      const ids = new Set(searchProducts(index, query, { limit: index.length }).map((item) => item.id));
      result = result.filter((product) => ids.has(product.id));
    }
    result = [...result];
    if (sort === "price-asc") result.sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "price-desc") result.sort((a, b) => b.priceCents - a.priceCents);
    if (sort === "featured") result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    if (sort === "new") result.reverse();
    return result;
  }, [products, category, offers, query, index, sort]);
  return (
    <div>
      <div className="grid gap-3 rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-white)] p-3 sm:grid-cols-[1fr_220px]">
        <label className="flex min-h-12 items-center gap-2 rounded-full border border-[var(--noor-border)] bg-[var(--noor-bg)] px-4">
          <NoorIcon name="search" className="h-4 w-4 text-[var(--noor-rose)]" />
          <span className="sr-only">{copy.search.placeholder}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search.placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="min-h-12 rounded-full border border-[var(--noor-border)] bg-[var(--noor-bg)] px-4 text-sm outline-none">
          <option value="default">الترتيب الافتراضي</option>
          <option value="featured">{copy.nav.bestSellers}</option>
          <option value="new">{copy.nav.newArrivals}</option>
          <option value="price-asc">السعر: من الأقل</option>
          <option value="price-desc">السعر: من الأعلى</option>
        </select>
      </div>
      <div className="noor-scroll mt-4 flex gap-2 overflow-x-auto pb-2">
        <button type="button" onClick={() => { setCategory(null); setOffers(false); }} aria-pressed={!category && !offers} className={!category && !offers ? "noor-filter noor-filter--active" : "noor-filter"}>{copy.sections.viewAll}</button>
        <button type="button" onClick={() => { setOffers(!offers); setCategory(null); }} aria-pressed={offers} className={offers ? "noor-filter noor-filter--active" : "noor-filter"}>{copy.nav.offers}</button>
        {categories.map((item) => (
          <button key={item.id} type="button" onClick={() => { setCategory(category === item.id ? null : item.id); setOffers(false); }} aria-pressed={category === item.id} className={category === item.id ? "noor-filter noor-filter--active" : "noor-filter"}>{item.name}</button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--noor-muted)]" aria-live="polite">{filtered.length} {copy.sections.productsTitle}</p>
      {filtered.length ? (
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {filtered.map((product, indexValue) => <li key={product.id}><NoorProductCard product={product} base={base} copy={copy} lang={lang} currency={currency} priority={indexValue < 4} /></li>)}
        </ul>
      ) : (
        <div className="mt-6"><NoorEmpty title={copy.search.noResults} hint={copy.search.noResultsHint} /></div>
      )}
    </div>
  );
}
