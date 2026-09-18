import Link from "next/link";
import type { StorefrontData } from "../../lib/storefront/data";
import { LangSwitcher } from "./lang-switcher";

export function StorefrontHeader({ data }: { data: StorefrontData }) {
  const { dict, settings, theme, website_type, slug, name } = data;
  const base = `/s/${slug}`;
  const isShop = website_type === "ecommerce" || website_type === "single_product";

  const links = [
    { href: base, label: dict.nav.home, exact: true },
    ...(isShop ? [{ href: `${base}/boutique`, label: dict.nav.shop }] : []),
    { href: `${base}/a-propos`, label: dict.nav.about },
    { href: `${base}/faq`, label: dict.nav.faq },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      {theme?.announcement ? (
        <div className="bg-slate-900 px-4 py-1.5 text-center text-xs font-medium text-white">{theme.announcement}</div>
      ) : null}
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={base} className="flex min-w-0 items-center gap-2">
          {theme?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo: any size, external host
            <img src={theme.logo_url} alt={name} className="h-9 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="truncate text-lg font-extrabold text-[var(--fx-primary)]">{name}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-700 transition hover:text-[var(--fx-primary)]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitcher current={data.lang} />
          {settings?.contact?.phone ? (
            <a href={`tel:${settings.contact.phone}`} className="hidden text-sm font-semibold text-slate-600 lg:block">
              {settings.contact.phone}
            </a>
          ) : null}
          {isShop ? (
            <Link
              href={`${base}/commande`}
              className="rounded-lg bg-[var(--fx-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {dict.actions.order}
            </Link>
          ) : null}
        </div>
      </div>
      {/* mobile nav */}
      <nav className="flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 text-sm font-medium text-slate-600">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
