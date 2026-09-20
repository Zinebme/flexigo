import type { ReactNode } from "react";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqSearchIndex, loadSouqShop } from "@/lib/storefront/souq/catalog";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { noorCssVars } from "@/lib/storefront/noor/tokens";
import { noorFontVariables } from "@/lib/storefront/noor/fonts";
import { NoorHeader } from "./noor-header";
import { NoorFooter } from "./noor-footer";
import "./noor.css";

/**
 * NOOR storefront shell — root + header + footer. The template is fully
 * isolated: its own design system, typography and navigation, while reading
 * the exact same RLS-protected tenant data as every other template.
 */
export async function NoorShell({ data, children }: { data: StorefrontData; children: ReactNode }) {
  const copy = noorCopy(data.lang);
  const [searchIndex, shop] = await Promise.all([loadSouqSearchIndex(data.id, 180), loadSouqShop(data.id)]);
  const base = data.base;
  const contact = data.settings?.contact ?? null;
  const nav = [
    { href: base, label: copy.nav.home },
    { href: `${base}/boutique?sort=new`, label: copy.nav.newArrivals },
    { href: `${base}/boutique`, label: copy.nav.categories },
    { href: `${base}/boutique?sort=featured`, label: copy.nav.bestSellers },
    { href: `${base}/boutique?filter=offers`, label: copy.nav.offers },
    { href: `${base}/a-propos`, label: copy.nav.about },
  ];
  return (
    <div dir={copy.dir} className={`noor-root ${noorFontVariables} min-h-screen`} style={noorCssVars(data.theme)} data-template="noor-v1">
      <NoorHeader
        storeName={data.name}
        base={base}
        logoUrl={data.theme?.logo_url ?? null}
        announcement={data.theme?.announcement ?? null}
        copy={copy}
        lang={data.lang}
        currency={data.currency}
        searchIndex={searchIndex}
        categories={shop.categories}
        nav={nav}
        whatsapp={contact?.whatsapp ?? null}
      />
      <main className="min-h-[60vh]">{children}</main>
      <NoorFooter
        storeName={data.name}
        base={base}
        logoUrl={data.theme?.logo_url ?? null}
        copy={copy}
        categories={shop.categories}
        contact={
          contact
            ? {
                phone: contact.phone ?? null,
                whatsapp: contact.whatsapp ?? null,
                email: contact.email ?? null,
                address: contact.address ?? null,
                instagram: contact.instagram ?? null,
                facebook: contact.facebook ?? null,
                tiktok: contact.tiktok ?? null,
              }
            : null
        }
        faqEnabled={data.settings?.business?.faq_enabled !== false}
      />
    </div>
  );
}
