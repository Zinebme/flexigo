"use client";

/**
 * SOUQ — storefront header (Arabic-first, RTL, mobile-app feel).
 *
 * Composition (mobile first):
 *   promo bar  →  header row (logo · search · menu)  →  desktop nav + category bar
 * The mobile drawer slides from the RTL start edge, contains navigation,
 * categories and the contact/WhatsApp actions, and closes on Escape/backdrop.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LANG_COOKIE } from "@/lib/storefront/lang";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { SouqSearchItem } from "@/lib/storefront/souq/search";
import type { StoreLanguage } from "@/lib/types";
import type { SouqCategory } from "@/lib/storefront/souq/catalog";
import { SouqIcon } from "./souq-ui";
import { SouqSearchOverlay } from "./souq-search";

export interface SouqHeaderProps {
  storeName: string;
  base: string;
  logoUrl: string | null;
  announcement: string | null;
  lang: StoreLanguage;
  copy: SouqCopy;
  searchIndex: SouqSearchItem[];
  categories: SouqCategory[];
  nav: Array<{ href: string; label: string; exact?: boolean }>;
  phone: string | null;
  whatsapp: string | null;
  orderHref: string;
}

export function SouqHeader({
  storeName,
  base,
  logoUrl,
  announcement,
  lang,
  copy,
  searchIndex,
  categories,
  nav,
  phone,
  whatsapp,
  orderHref,
}: SouqHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function switchLang(code: StoreLanguage) {
    const maxAge = 60 * 60 * 24 * 365;
    // eslint-disable-next-line react-hooks/immutability -- document.cookie is the standard way to set a non-httpOnly cookie
    document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=${maxAge}; samesite=lax`;
    router.refresh();
    setDrawerOpen(false);
  }

  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;
  const drawerSide = copy.dir === "rtl" ? "right-0 souq-drawer-rtl" : "left-0 souq-drawer-ltr";

  return (
    <>
      {/* Promo bar */}
      <div className="bg-[var(--souq-primary)] text-white">
        <div className="souq-container flex h-9 items-center justify-between gap-3 text-[11px] font-bold sm:text-xs">
          <span className="flex min-w-0 items-center gap-1.5">
            <SouqIcon name="truck" className="h-3.5 w-3.5 shrink-0 text-[var(--souq-accent)]" />
            <span className="truncate">{announcement && announcement.trim().length > 0 ? announcement : copy.promo.defaultBar}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 text-white/85 sm:flex">
            <SouqIcon name="cash" className="h-3.5 w-3.5 text-[var(--souq-accent)]" />
            {copy.promo.cod}
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[var(--souq-border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="souq-container flex h-14 items-center gap-2 sm:h-16 sm:gap-3">
          {/* Logo */}
          <Link href={base} className="flex min-w-0 shrink-0 items-center gap-2" aria-label={storeName}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- merchant logos are arbitrary sizes on an allow-listed host
              <img src={logoUrl} alt={storeName} className="h-8 w-auto max-w-[130px] object-contain sm:h-9 sm:max-w-[170px]" />
            ) : (
              <span className="truncate text-lg font-extrabold tracking-tight text-[var(--souq-primary)] sm:text-xl">{storeName}</span>
            )}
          </Link>

          {/* Desktop search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="souq-press hidden h-10 flex-1 items-center gap-2 rounded-[14px] border border-[var(--souq-border)] bg-slate-50 px-3 text-start text-sm text-slate-400 transition hover:border-[var(--souq-primary)] hover:bg-white lg:flex"
            aria-label={copy.search.open}
          >
            <SouqIcon name="search" className="h-4 w-4" />
            <span className="truncate">{copy.search.placeholder}</span>
          </button>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2 lg:flex-none">
            {/* Mobile search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="souq-press flex h-10 w-10 items-center justify-center rounded-[13px] border border-[var(--souq-border)] text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label={copy.search.open}
            >
              <SouqIcon name="search" className="h-5 w-5" />
            </button>

            {/* WhatsApp */}
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.product.whatsappAsk}
                className="souq-press hidden h-10 w-10 items-center justify-center rounded-[13px] border border-emerald-200 text-emerald-600 hover:bg-emerald-50 sm:flex"
              >
                <SouqIcon name="whatsapp" className="h-5 w-5" />
              </a>
            ) : null}

            {/* Order CTA */}
            <a
              href={orderHref}
              className="souq-press hidden items-center gap-2 rounded-[13px] bg-[var(--souq-accent)] px-4 py-2.5 text-sm font-extrabold text-[var(--souq-accent-text)] hover:bg-[var(--souq-accent-hover)] sm:flex"
            >
              <SouqIcon name="cart" className="h-[18px] w-[18px]" />
              {copy.product.orderNow}
            </a>

            {/* Menu */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="souq-press flex h-10 w-10 items-center justify-center rounded-[13px] border border-[var(--souq-border)] text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label={copy.nav.openMenu}
              aria-expanded={drawerOpen}
            >
              <SouqIcon name="menu" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden border-t border-slate-100 lg:block" aria-label={copy.nav.menu}>
          <div className="souq-container flex h-11 items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="souq-press rounded-[12px] px-3 py-2 text-[13px] font-bold text-slate-600 transition hover:bg-[var(--souq-primary-soft)] hover:text-[var(--souq-primary)]"
              >
                {item.label}
              </Link>
            ))}
            {categories.length > 0 ? (
              <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
            ) : null}
            <div className="flex min-w-0 items-center gap-1 overflow-hidden">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`${base}/categorie/${category.slug}`}
                  className="souq-press truncate rounded-[12px] px-2.5 py-2 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[var(--souq-primary)]"
                >
                  {category.name}
                </Link>
              ))}
            </div>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="souq-press ms-auto flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] font-bold text-[var(--souq-primary)] hover:bg-[var(--souq-primary-soft)]"
                dir="ltr"
              >
                <SouqIcon name="phone" className="h-4 w-4" />
                {phone}
              </a>
            ) : null}
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={copy.nav.menu}>
          <button
            type="button"
            aria-label={copy.nav.close}
            className="souq-backdrop absolute inset-0 h-full w-full bg-slate-900/45"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className={`absolute top-0 ${drawerSide} flex h-full w-[86%] max-w-[340px] flex-col bg-white shadow-2xl`}>
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              <span className="truncate text-base font-extrabold text-[var(--souq-primary)]">{storeName}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={copy.nav.close}
                className="souq-press flex h-9 w-9 items-center justify-center rounded-[12px] border border-slate-200 text-slate-500"
              >
                <SouqIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <nav aria-label={copy.nav.menu}>
                <ul className="space-y-1">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className="souq-press flex items-center justify-between rounded-[14px] px-3.5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {item.label}
                        <SouqIcon name="chevron-left" className="h-4 w-4 text-slate-300 ltr:rotate-180" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {categories.length > 0 ? (
                <div className="mt-4">
                  <p className="px-3.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{copy.nav.categories}</p>
                  <ul className="space-y-1">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`${base}/categorie/${category.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="souq-press flex items-center justify-between rounded-[14px] px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <span className="truncate">{category.name}</span>
                          {category.productCount > 0 ? (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              {category.productCount}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-slate-100 p-3">
              <a
                href={orderHref}
                onClick={() => setDrawerOpen(false)}
                className="souq-press flex items-center justify-center gap-2 rounded-[14px] bg-[var(--souq-accent)] px-4 py-3 text-sm font-extrabold text-[var(--souq-accent-text)]"
              >
                <SouqIcon name="cart" className="h-[18px] w-[18px]" />
                {copy.product.orderNow}
              </a>
              <div className="grid grid-cols-2 gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="souq-press flex items-center justify-center gap-2 rounded-[14px] border border-slate-200 px-3 py-2.5 text-[13px] font-bold text-slate-700"
                  >
                    <SouqIcon name="phone" className="h-4 w-4" />
                    {copy.product.callAsk}
                  </a>
                ) : null}
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="souq-press flex items-center justify-center gap-2 rounded-[14px] border border-emerald-200 px-3 py-2.5 text-[13px] font-bold text-emerald-700"
                  >
                    <SouqIcon name="whatsapp" className="h-4 w-4" />
                    واتساب
                  </a>
                ) : null}
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-slate-50 px-3 py-2">
                <span className="text-[11px] font-bold text-slate-500">{copy.nav.langLabel}</span>
                <div className="flex gap-1">
                  {(["ar", "fr", "en"] as StoreLanguage[]).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => switchLang(code)}
                      className={`souq-press rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        lang === code ? "bg-[var(--souq-primary)] text-white" : "text-slate-500"
                      }`}
                    >
                      {code === "ar" ? "ع" : code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Mounted only while open → fresh state on every open. */}
      {searchOpen ? (
        <SouqSearchOverlay
        open
        onClose={() => setSearchOpen(false)}
        items={searchIndex}
        base={base}
        copy={copy}
        lang={lang}
        />
      ) : null}
    </>
  );
}
