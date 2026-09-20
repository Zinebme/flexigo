/**
 * SOUQ — storefront shell (server component).
 *
 * Applied by the tenant layout only when the store's template is SOUQ
 * (`souq-v1` / `souq`). Everything else about the platform — data, RLS,
 * checkout, dashboard — stays shared and untouched.
 */
import type { ReactNode } from "react";
import type { StorefrontData } from "@/lib/storefront/data";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { souqCssVars, souqPalette } from "@/lib/storefront/souq/tokens";
import { loadSouqSearchIndex, loadSouqShop } from "@/lib/storefront/souq/catalog";
import { SouqFooter } from "./souq-footer";
import { SouqHeader } from "./souq-header";
import "./souq.css";

export async function SouqShell({ data, children }: { data: StorefrontData; children: ReactNode }) {
  const copy = souqCopy(data.lang);
  const palette = souqPalette(data.theme);
  const base = data.base;

  // One bundled request for everything the shell needs.
  const [searchIndex, shop] = await Promise.all([
    loadSouqSearchIndex(data.id, 150),
    loadSouqShop(data.id),
  ]);

  const nav = [
    { href: base, label: copy.nav.home, exact: true },
    { href: `${base}/boutique`, label: copy.nav.categories },
    { href: `${base}/boutique?filter=offers`, label: copy.nav.offers },
    { href: `${base}/boutique?sort=featured`, label: copy.nav.bestSellers },
    { href: `${base}/boutique?sort=new`, label: copy.nav.newArrivals },
    { href: `${base}/contact`, label: copy.nav.contact },
  ];

  const contact = data.settings?.contact ?? null;

  return (
    <div dir={copy.dir} className="souq-root min-h-screen" style={souqCssVars(palette)} data-template="souq-v1">
      <SouqHeader
        storeName={data.name}
        base={base}
        logoUrl={data.theme?.logo_url ?? null}
        announcement={data.theme?.announcement ?? null}
        lang={data.lang}
        copy={copy}
        searchIndex={searchIndex}
        categories={shop.categories}
        nav={nav}
        phone={contact?.phone ?? null}
        whatsapp={contact?.whatsapp ?? null}
        orderHref={`${base}/boutique`}
      />

      <main className="min-h-[60vh]">{children}</main>

      <SouqFooter
        storeName={data.name}
        base={base}
        copy={copy}
        logoUrl={data.theme?.logo_url ?? null}
        description={null}
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
        categories={shop.categories}
        faqEnabled={data.settings?.business?.faq_enabled !== false}
        year={new Date().getFullYear()}
      />
    </div>
  );
}
