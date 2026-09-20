"use client";

/**
 * SOUQ — shop / category browser (client).
 *
 * RTL-first marketplace browsing: horizontal category chips, instant Arabic
 * search, sorting, filters for offers / featured / new. All filtering is local
 * (the catalog is already on the page), so it stays instant on mobile.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { searchProducts, type SouqSearchItem } from "@/lib/storefront/souq/search";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { SouqCategory, SouqProductSummary } from "@/lib/storefront/souq/catalog";
import type { StoreLanguage } from "@/lib/types";
import { SouqProductCard } from "./souq-product-card";
import { SouqEmptyState, SouqIcon } from "./souq-ui";

type SortKey = "default" | "price-asc" | "price-desc" | "new" | "featured";

export function SouqShopBrowser({
  products,
  categories,
  base,
  copy,
  lang,
  currency,
  initialCategoryId = null,
  initialFilter = null,
  initialSort = "default",
  lockedCategoryLabel = null,
}: {
  products: SouqProductSummary[];
  categories: SouqCategory[];
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
  initialCategoryId?: string | null;
  initialFilter?: "offers" | null;
  initialSort?: SortKey;
  lockedCategoryLabel?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
  const [onlyOffers, setOnlyOffers] = useState(initialFilter === "offers");
  const [sort, setSort] = useState<SortKey>(initialSort);

  const index: SouqSearchItem[] = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        compareAtPriceCents: product.compareAtPriceCents,
        image: product.image,
        categoryName: product.categoryName,
        isFeatured: product.isFeatured,
      })),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;
    if (categoryId) list = list.filter((product) => product.categoryId === categoryId);
    if (onlyOffers) list = list.filter((product) => product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents);
    const needle = query.trim();
    if (needle.length > 0) {
      const matches = new Set(searchProducts(index, needle, { limit: index.length }).map((item) => item.id));
      list = list.filter((product) => matches.has(product.id));
    }
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "featured":
        sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        break;
      case "new":
      default:
        break;
    }
    return sorted;
  }, [products, categoryId, onlyOffers, query, sort, index]);

  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: "default" as SortKey, label: copy.nav.shop },
    { key: "price-asc" as SortKey, label: `${copy.checkout.total} ↑` },
    { key: "price-desc" as SortKey, label: `${copy.checkout.total} ↓` },
    { key: "featured" as SortKey, label: copy.nav.bestSellers },
    { key: "new" as SortKey, label: copy.nav.newArrivals },
  ];

  return (
    <div>
      {/* Search + filters */}
      <div className="souq-card sticky top-14 z-30 space-y-3 p-3 sm:top-16">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SouqIcon name="search" className="pointer-events-none absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search.placeholder}
              type="search"
              enterKeyHint="search"
              aria-label={copy.search.placeholder}
              className="souq-input pe-11"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label={copy.nav.shop}
            className="souq-input w-[130px] shrink-0"
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="souq-scroll-x -mx-1 px-1">
          {!lockedCategoryLabel ? (
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              aria-pressed={categoryId === null && !onlyOffers}
              className={`souq-press shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${
                categoryId === null && !onlyOffers
                  ? "border-[var(--souq-primary)] bg-[var(--souq-primary)] text-white"
                  : "border-[var(--souq-border)] bg-white text-slate-600"
              }`}
            >
              {copy.nav.shop}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setOnlyOffers((value) => !value);
              setCategoryId(null);
            }}
            aria-pressed={onlyOffers}
            className={`souq-press shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${
              onlyOffers ? "border-[var(--souq-accent)] bg-[var(--souq-accent)] text-[var(--souq-accent-text)]" : "border-[var(--souq-border)] bg-white text-slate-600"
            }`}
          >
            {copy.nav.offers}
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setCategoryId(category.id === categoryId ? null : category.id);
                setOnlyOffers(false);
              }}
              aria-pressed={categoryId === category.id}
              className={`souq-press shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${
                categoryId === category.id
                  ? "border-[var(--souq-primary)] bg-[var(--souq-primary)] text-white"
                  : "border-[var(--souq-border)] bg-white text-slate-600"
              }`}
            >
              {category.name}
              {category.productCount > 0 ? <span className="ms-1 text-[10px] opacity-60">{category.productCount}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12px] font-bold text-slate-500" aria-live="polite">
        {filtered.length} {copy.sections.productsTitle}
        {lockedCategoryLabel ? ` — ${lockedCategoryLabel}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <SouqEmptyState title={copy.search.noResults} hint={copy.search.noResultsHint} icon="search" />
          <div className="mt-4 text-center">
            <Link
              href={`${base}/boutique`}
              className="souq-press inline-flex items-center gap-2 rounded-[14px] border border-[var(--souq-border)] px-4 py-3 text-[13px] font-bold text-[var(--souq-primary)]"
            >
              <SouqIcon name="grid" className="h-4 w-4" />
              {copy.search.viewAll}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((product, i) => (
            <li key={product.id}>
              <SouqProductCard product={product} base={base} copy={copy} lang={lang} currency={currency} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
