import Link from "next/link";
import type { SouqCategory } from "@/lib/storefront/souq/catalog";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import { safeLamsaExternalUrl } from "@/lib/storefront/lamsa/links";
import { LamsaContainer, LamsaIcon } from "./lamsa-ui";

interface Contact {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
}

export function LamsaFooter({ storeName, base, logoUrl, copy, categories, contact, faqEnabled }: {
  storeName: string;
  base: string;
  logoUrl: string | null;
  copy: SouqCopy;
  categories: SouqCategory[];
  contact: Contact | null;
  faqEnabled: boolean;
}) {
  const wa = contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : null;
  const socials = [
    { href: safeLamsaExternalUrl(contact?.instagram), icon: "instagram" as const, label: "Instagram" },
    { href: safeLamsaExternalUrl(contact?.facebook), icon: "facebook" as const, label: "Facebook" },
    { href: safeLamsaExternalUrl(contact?.tiktok), icon: "tiktok" as const, label: "TikTok" },
  ].filter((social) => social.href !== null) as Array<{ href: string; icon: "instagram" | "facebook" | "tiktok"; label: string }>;
  return (
    <footer className="mt-18 bg-[var(--lamsa-chocolate)] text-[var(--lamsa-ivory)]">
      <LamsaContainer className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.8fr_1fr] lg:py-16">
        <div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- merchant logo
            <img src={logoUrl} alt={storeName} className="h-11 w-auto max-w-[190px] object-contain brightness-0 invert" />
          ) : <p className="lamsa-logo text-2xl">{storeName}</p>}
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/66">{copy.footer.aboutFallback}</p>
          {socials.length ? <div className="mt-5 flex gap-2">{socials.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex h-10 w-10 items-center justify-center border border-white/20 transition hover:border-[var(--lamsa-gold)] hover:text-[var(--lamsa-gold)]"><LamsaIcon name={social.icon} className="h-4.5 w-4.5" /></a>)}</div> : null}
        </div>
        <nav aria-label={copy.footer.navigation}>
          <h3 className="lamsa-footer-title">{copy.footer.navigation}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/66">
            <li><Link href={base}>{copy.nav.home}</Link></li>
            <li><Link href={`${base}/boutique`}>{copy.nav.shop}</Link></li>
            <li><Link href={`${base}/a-propos`}>{copy.nav.about}</Link></li>
            <li><Link href={`${base}/contact`}>{copy.nav.contact}</Link></li>
          </ul>
        </nav>
        {categories.length ? <nav aria-label={copy.nav.categories}><h3 className="lamsa-footer-title">{copy.nav.categories}</h3><ul className="mt-4 space-y-2.5 text-sm text-white/66">{categories.slice(0, 5).map((category) => <li key={category.id}><Link href={`${base}/categorie/${category.slug}`}>{category.name}</Link></li>)}</ul></nav> : null}
        <div>
          <h3 className="lamsa-footer-title">{copy.footer.contact}</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {contact?.phone ? <li><a href={`tel:${contact.phone}`} className="flex items-center gap-2" dir="ltr"><LamsaIcon name="phone" className="h-4 w-4" />{contact.phone}</a></li> : null}
            {wa ? <li><a href={wa} className="flex items-center gap-2"><LamsaIcon name="whatsapp" className="h-4 w-4" />واتساب</a></li> : null}
            {contact?.email ? <li><a href={`mailto:${contact.email}`} className="break-all" dir="ltr">{contact.email}</a></li> : null}
            {contact?.address ? <li className="leading-6">{contact.address}</li> : null}
          </ul>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/55">
            {faqEnabled ? <Link href={`${base}/faq`}>{copy.footer.faq}</Link> : null}
            <Link href={`${base}/mentions-legales`}>{copy.footer.terms}</Link>
            <Link href={`${base}/confidentialite`}>{copy.footer.privacy}</Link>
          </div>
        </div>
      </LamsaContainer>
      <div className="border-t border-white/10">
        <LamsaContainer className="flex flex-col items-center justify-between gap-2 py-4 text-center text-[11px] text-white/45 sm:flex-row sm:text-start">
          <span>© {new Date().getFullYear()} {storeName} — {copy.footer.copyright}</span>
          <span>{copy.footer.poweredBy} Marqova</span>
        </LamsaContainer>
      </div>
    </footer>
  );
}
