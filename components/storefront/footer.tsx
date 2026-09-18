import Link from "next/link";
import type { StorefrontData } from "../../lib/storefront/data";

export function StorefrontFooter({ data }: { data: StorefrontData }) {
  const { dict, settings, name, slug, website_type } = data;
  const base = `/s/${slug}`;
  const c = settings?.contact;
  const isShop = website_type === "ecommerce" || website_type === "single_product";

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="text-lg font-extrabold text-[var(--fx-primary)]">{name}</div>
          {c?.address ? <p className="mt-3 text-sm text-slate-500">{c.address}</p> : null}
          <p className="mt-3 text-xs font-medium text-emerald-600">✓ {dict.footer.cod}</p>
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-900">Navigation</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link className="hover:text-[var(--fx-primary)]" href={base}>{dict.nav.home}</Link></li>
            {isShop ? <li><Link className="hover:text-[var(--fx-primary)]" href={`${base}/boutique`}>{dict.nav.shop}</Link></li> : null}
            <li><Link className="hover:text-[var(--fx-primary)]" href={`${base}/a-propos`}>{dict.nav.about}</Link></li>
            <li><Link className="hover:text-[var(--fx-primary)]" href={`${base}/faq`}>{dict.nav.faq}</Link></li>
            <li><Link className="hover:text-[var(--fx-primary)]" href={`${base}/contact`}>{dict.nav.contact}</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-900">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {c?.phone ? <li><a className="hover:text-[var(--fx-primary)]" href={`tel:${c.phone}`}>{c.phone}</a></li> : null}
            {c?.email ? <li><a className="hover:text-[var(--fx-primary)]" href={`mailto:${c.email}`}>{c.email}</a></li> : null}
            {c?.instagram ? <li><a className="hover:text-[var(--fx-primary)]" href={c.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li> : null}
            {c?.facebook ? <li><a className="hover:text-[var(--fx-primary)]" href={c.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li> : null}
            {c?.tiktok ? <li><a className="hover:text-[var(--fx-primary)]" href={c.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li> : null}
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-900">Légal</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link className="hover:text-[var(--fx-primary)]" href={`${base}/mentions-legales`}>{dict.footer.legalTerms}</Link></li>
            <li><Link className="hover:text-[var(--fx-primary)]" href={`${base}/confidentialite`}>{dict.footer.privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {name} — {dict.footer.rights}. Propulsé par <span className="font-semibold">FlexiGo</span>.
      </div>
    </footer>
  );
}
