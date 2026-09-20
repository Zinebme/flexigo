"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SouqCategory } from "@/lib/storefront/souq/catalog";
import type { SouqSearchItem } from "@/lib/storefront/souq/search";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { StoreLanguage } from "@/lib/types";
import { LamsaIcon } from "./lamsa-ui";
import { LamsaSearch } from "./lamsa-search";

export function LamsaHeader({
  storeName,
  base,
  logoUrl,
  announcement,
  copy,
  lang,
  currency,
  searchIndex,
  categories,
  nav,
  whatsapp,
}: {
  storeName: string;
  base: string;
  logoUrl: string | null;
  announcement: string | null;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
  searchIndex: SouqSearchItem[];
  categories: SouqCategory[];
  nav: Array<{ href: string; label: string }>;
  whatsapp: string | null;
}) {
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;
  return (
    <>
      <div className="bg-[var(--lamsa-chocolate)] text-[var(--lamsa-ivory)]">
        <div className="lamsa-container flex min-h-9 items-center justify-center px-3 py-1 text-center text-[11px] font-medium tracking-wide sm:text-xs">
          {announcement?.trim() || copy.promo.defaultBar}
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-[var(--lamsa-border)] bg-[var(--lamsa-ivory)]/95 backdrop-blur-lg">
        <div className="lamsa-container flex h-16 items-center justify-between gap-2 sm:h-19">
          <div className="flex items-center gap-1 lg:hidden">
            <button type="button" className="lamsa-icon-button" onClick={() => setDrawer(true)} aria-label={copy.nav.openMenu} aria-expanded={drawer}>
              <LamsaIcon name="menu" className="h-5 w-5" />
            </button>
            <button type="button" className="lamsa-icon-button" onClick={() => setSearch(true)} aria-label={copy.search.open}>
              <LamsaIcon name="search" className="h-5 w-5" />
            </button>
          </div>

          <Link href={base} className="min-w-0 shrink-0" aria-label={storeName}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- merchant-controlled logo
              <img src={logoUrl} alt={storeName} className="h-9 w-auto max-w-[145px] object-contain sm:h-11 sm:max-w-[190px]" />
            ) : (
              <span className="lamsa-logo block truncate text-xl text-[var(--lamsa-chocolate)] sm:text-2xl">{storeName}</span>
            )}
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label={copy.nav.menu}>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="lamsa-nav-link px-3 py-2 text-[13px] font-medium text-[var(--lamsa-ink)]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1">
            <button type="button" className="lamsa-icon-button hidden lg:flex" onClick={() => setSearch(true)} aria-label={copy.search.open}>
              <LamsaIcon name="search" className="h-5 w-5" />
            </button>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="lamsa-icon-button hidden sm:flex" aria-label={copy.product.whatsappAsk}>
                <LamsaIcon name="whatsapp" className="h-5 w-5" />
              </a>
            ) : null}
            <Link href={`${base}/boutique`} className="lamsa-icon-button" aria-label={copy.product.orderNow}>
              <LamsaIcon name="cart" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={copy.nav.menu}>
          <button type="button" className="absolute inset-0 bg-[#211b17]/45" onClick={() => setDrawer(false)} aria-label={copy.nav.close} />
          <aside className="lamsa-drawer absolute inset-y-0 right-0 flex w-[88%] max-w-[360px] flex-col bg-[var(--lamsa-ivory)] shadow-2xl">
            <div className="flex h-18 items-center justify-between border-b border-[var(--lamsa-border)] px-5">
              <span className="lamsa-logo text-xl text-[var(--lamsa-chocolate)]">{storeName}</span>
              <button type="button" className="lamsa-icon-button" onClick={() => setDrawer(false)} aria-label={copy.nav.close}>
                <LamsaIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-5" aria-label={copy.nav.menu}>
              <ul>
                {nav.map((item) => (
                  <li key={item.href} className="border-b border-[var(--lamsa-border)]">
                    <Link href={item.href} onClick={() => setDrawer(false)} className="flex min-h-13 items-center justify-between py-3 text-sm font-semibold text-[var(--lamsa-ink)]">
                      {item.label}<LamsaIcon name="chevron-left" className="h-4 w-4 text-[var(--lamsa-taupe)] ltr:rotate-180" />
                    </Link>
                  </li>
                ))}
              </ul>
              {categories.length ? (
                <div className="mt-7">
                  <p className="lamsa-eyebrow">{copy.nav.categories}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.slice(0, 8).map((category) => (
                      <Link key={category.id} href={`${base}/categorie/${category.slug}`} onClick={() => setDrawer(false)} className="rounded-full border border-[var(--lamsa-border)] px-3 py-2 text-xs text-[var(--lamsa-muted)]">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </nav>
            {wa ? <a href={wa} className="m-5 flex min-h-12 items-center justify-center gap-2 bg-[var(--lamsa-chocolate)] px-5 text-sm font-semibold text-white"><LamsaIcon name="whatsapp" className="h-4 w-4" />{copy.product.whatsappAsk}</a> : null}
          </aside>
        </div>
      ) : null}

      <LamsaSearch open={search} onClose={() => setSearch(false)} items={searchIndex} base={base} copy={copy} lang={lang} currency={currency} />
    </>
  );
}
