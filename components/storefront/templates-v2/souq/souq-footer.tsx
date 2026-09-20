/**
 * SOUQ — RTL footer (server component).
 *
 * Only renders blocks that genuinely have data: no empty columns, no fake
 * promises. Social links come from the store's contact settings.
 */
import Link from "next/link";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { SouqCategory } from "@/lib/storefront/souq/catalog";
import { SouqContainer, SouqIcon, SouqTrustStrip } from "./souq-ui";

export interface SouqFooterProps {
  storeName: string;
  base: string;
  copy: SouqCopy;
  logoUrl: string | null;
  description: string | null;
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
  } | null;
  categories: SouqCategory[];
  faqEnabled: boolean;
  year: number;
}

export function SouqFooter({
  storeName,
  base,
  copy,
  logoUrl,
  description,
  contact,
  categories,
  faqEnabled,
  year,
}: SouqFooterProps) {
  const waHref = contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : null;
  const socials: Array<{ key: string; href: string; icon: "instagram" | "facebook" | "tiktok"; label: string }> = [];
  if (contact?.instagram) socials.push({ key: "instagram", href: contact.instagram, icon: "instagram", label: "Instagram" });
  if (contact?.facebook) socials.push({ key: "facebook", href: contact.facebook, icon: "facebook", label: "Facebook" });
  if (contact?.tiktok) socials.push({ key: "tiktok", href: contact.tiktok, icon: "tiktok", label: "TikTok" });

  return (
    <footer className="mt-12 border-t border-[var(--souq-border)] bg-white">
      <SouqContainer className="py-6">
        <SouqTrustStrip
          items={[
            { icon: "cash", label: copy.promo.cod },
            { icon: "truck", label: copy.promo.delivery },
            { icon: "shield", label: copy.promo.secure },
            { icon: "headset", label: copy.promo.support },
          ]}
        />
      </SouqContainer>

      <div className="bg-[var(--souq-primary)] text-white">
        <SouqContainer className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- merchant logo, arbitrary size
                <img src={logoUrl} alt={storeName} className="h-9 w-auto max-w-[160px] object-contain brightness-0 invert" />
              ) : (
                <span className="text-lg font-extrabold">{storeName}</span>
              )}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/75">{description ?? copy.footer.aboutFallback}</p>
            <p className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[var(--souq-accent)]">
              <SouqIcon name="cash" className="h-4 w-4" />
              {copy.footer.codLine}
            </p>
          </div>

          <nav aria-label={copy.footer.navigation}>
            <h3 className="text-sm font-extrabold">{copy.footer.navigation}</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/80">
              <li>
                <Link className="transition hover:text-[var(--souq-accent)]" href={base}>
                  {copy.nav.home}
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/boutique`}>
                  {copy.nav.shop}
                </Link>
              </li>
              {categories.slice(0, 4).map((category) => (
                <li key={category.id}>
                  <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/categorie/${category.slug}`}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={copy.footer.help}>
            <h3 className="text-sm font-extrabold">{copy.footer.help}</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/80">
              {faqEnabled ? (
                <li>
                  <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/faq`}>
                    {copy.footer.faq}
                  </Link>
                </li>
              ) : null}
              <li>
                <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/a-propos`}>
                  {copy.footer.aboutPage}
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/contact`}>
                  {copy.nav.contact}
                </Link>
              </li>
            </ul>

            <h3 className="mt-6 text-sm font-extrabold">{copy.footer.policies}</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/80">
              <li>
                <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/mentions-legales`}>
                  {copy.footer.terms}
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-[var(--souq-accent)]" href={`${base}/confidentialite`}>
                  {copy.footer.privacy}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-extrabold">{copy.footer.contact}</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/85">
              {contact?.phone ? (
                <li>
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 transition hover:text-[var(--souq-accent)]" dir="ltr">
                    <SouqIcon name="phone" className="h-4 w-4 shrink-0" />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {waHref ? (
                <li>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-[var(--souq-accent)]">
                    <SouqIcon name="whatsapp" className="h-4 w-4 shrink-0" />
                    {copy.product.whatsappAsk}
                  </a>
                </li>
              ) : null}
              {contact?.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 break-all transition hover:text-[var(--souq-accent)]" dir="ltr">
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact?.address ? <li className="leading-relaxed text-white/70">{contact.address}</li> : null}
            </ul>

            {socials.length > 0 ? (
              <div className="mt-4 flex gap-2">
                {socials.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="souq-press flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-white transition hover:bg-[var(--souq-accent)] hover:text-[var(--souq-accent-text)]"
                  >
                    <SouqIcon name={social.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </SouqContainer>

        <div className="border-t border-white/10">
          <SouqContainer className="flex flex-col items-center justify-between gap-2 py-4 text-center text-[11px] text-white/60 sm:flex-row sm:text-start">
            <span>
              © {year} {storeName} — {copy.footer.copyright}
            </span>
            <span className="flex items-center gap-1.5">
              {copy.footer.poweredBy}
              <span className="font-extrabold text-white/80">FlexiGo</span>
            </span>
          </SouqContainer>
        </div>
      </div>
    </footer>
  );
}
