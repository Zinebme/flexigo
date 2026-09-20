"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchProducts, type SouqSearchItem } from "@/lib/storefront/souq/search";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { StoreLanguage } from "@/lib/types";
import { LamsaIcon } from "./lamsa-ui";

export function LamsaSearch({
  open,
  onClose,
  items,
  base,
  copy,
  lang,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  items: SouqSearchItem[];
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchProducts(items, query, { limit: 8 }), [items, query]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={copy.search.open}>
      <button type="button" className="absolute inset-0 bg-[#211b17]/45" aria-label={copy.search.close} onClick={onClose} />
      <div className="lamsa-search-panel absolute inset-x-0 top-0 max-h-[88dvh] overflow-y-auto bg-[var(--lamsa-ivory)] shadow-2xl">
        <div className="lamsa-container py-5 sm:py-8">
          <div className="flex items-center gap-3 border-b border-[var(--lamsa-border)] pb-3">
            <LamsaIcon name="search" className="h-5 w-5 shrink-0 text-[var(--lamsa-taupe)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search.placeholder}
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-[var(--lamsa-ink)] outline-none placeholder:text-[var(--lamsa-taupe)] sm:text-lg"
            />
            <button type="button" onClick={onClose} className="lamsa-icon-button" aria-label={copy.search.close}>
              <LamsaIcon name="close" className="h-5 w-5" />
            </button>
          </div>

          {query.trim() ? (
            results.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {results.map((item) => (
                  <li key={item.id}>
                    <Link href={`${base}/produit/${item.slug}`} onClick={onClose} className="flex min-h-20 items-center gap-3 border-b border-[var(--lamsa-border)] py-3">
                      <span className="relative h-16 w-13 shrink-0 overflow-hidden bg-[var(--lamsa-beige)]">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element -- compact merchant search thumbnail
                          <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block font-semibold text-[var(--lamsa-ink)]">{item.name}</span>
                        {item.categoryName ? <span className="mt-0.5 block text-xs text-[var(--lamsa-muted)]">{item.categoryName}</span> : null}
                        <span className="lamsa-price mt-1 block text-sm font-bold text-[var(--lamsa-chocolate)]">{formatSouqPrice(item.priceCents, lang, currency)}</span>
                      </span>
                      <LamsaIcon name="chevron-left" className="h-4 w-4 shrink-0 text-[var(--lamsa-taupe)] ltr:rotate-180" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--lamsa-muted)]">{copy.search.noResults}</p>
            )
          ) : (
            <p className="py-8 text-sm text-[var(--lamsa-muted)]">{copy.search.hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
