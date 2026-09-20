"use client";

/**
 * SOUQ — instant search overlay (Arabic-first, RTL, keyboard accessible).
 *
 * The index is rendered by the server (compact: id, slug, name, price, image).
 * Filtering happens locally with Arabic-aware normalization — no request per
 * keystroke, so search feels instant even on a slow mobile connection.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { searchProducts, type SouqSearchItem } from "@/lib/storefront/souq/search";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { StoreLanguage } from "@/lib/types";
import { SouqIcon } from "./souq-ui";

export function SouqSearchOverlay({
  open,
  onClose,
  items,
  base,
  copy,
  lang,
  currency = "DZD",
}: {
  open: boolean;
  onClose: () => void;
  items: SouqSearchItem[];
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage | string | null;
  currency?: string;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => searchProducts(items, query, { limit: 8 }), [items, query]);

  // The overlay is mounted only while open (the header renders it
  // conditionally), so a fresh mount always starts from an empty query — no
  // setState-in-effect needed.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;


  const hasQuery = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={copy.search.open}>
      <button type="button" aria-label={copy.search.close} className="souq-backdrop absolute inset-0 h-full w-full bg-slate-900/45" onClick={onClose} />
      <div className="souq-anim-down absolute inset-x-0 top-0 max-h-[86vh] overflow-y-auto rounded-b-[22px] bg-white shadow-2xl">
        <div className="souq-container py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SouqIcon name="search" className="pointer-events-none absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search.placeholder}
                type="search"
                enterKeyHint="search"
                aria-label={copy.search.placeholder}
                autoComplete="off"
                className="souq-input pe-11 ps-4"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.search.close}
              className="souq-press flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--souq-border)] text-slate-500 hover:bg-slate-50"
            >
              <SouqIcon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3">
            {!hasQuery ? (
              <p className="px-1 py-6 text-center text-sm text-slate-400">{copy.search.hint}</p>
            ) : results.length === 0 ? (
              <div className="px-1 py-8 text-center">
                <p className="text-sm font-bold text-slate-700">{copy.search.noResults}</p>
                <p className="mt-1 text-xs text-slate-400">{copy.search.noResultsHint}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100" aria-label={copy.search.results}>
                {results.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`${base}/produit/${item.slug}`}
                      onClick={onClose}
                      className="souq-press flex items-center gap-3 rounded-[14px] px-1 py-2.5 hover:bg-slate-50"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-slate-100">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element -- tiny search thumbnails, avoids image optimizer round-trips
                          <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-slate-300">
                            <SouqIcon name="image" className="h-5 w-5" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-[13px] font-bold text-slate-800">{item.name}</span>
                        {item.categoryName ? (
                          <span className="mt-0.5 block text-[11px] text-slate-400">{item.categoryName}</span>
                        ) : null}
                      </span>
                      <span className="souq-price shrink-0 text-sm font-extrabold text-[var(--souq-primary)]">
                        {formatSouqPrice(item.priceCents, lang, currency)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 border-t border-slate-100 pt-3">
              <a
                href={`${base}/boutique`}
                onClick={onClose}
                className="souq-press flex items-center justify-between rounded-[14px] bg-[var(--souq-primary-soft)] px-4 py-3 text-sm font-bold text-[var(--souq-primary)]"
              >
                <span>{copy.search.viewAll}</span>
                <SouqIcon name="chevron-left" className="h-4 w-4 ltr:rotate-180" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
