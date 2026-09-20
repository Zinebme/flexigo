import type { ReactNode } from "react";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqSearchIndex, loadSouqShop } from "@/lib/storefront/souq/catalog";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { lamsaCssVars } from "@/lib/storefront/lamsa/tokens";
import { lamsaFontVariables } from "@/lib/storefront/lamsa/fonts";
import { LamsaHeader } from "./lamsa-header";
import { LamsaFooter } from "./lamsa-footer";
import "./lamsa.css";

export async function LamsaShell({ data, children }: { data: StorefrontData; children: ReactNode }) {
  const copy = lamsaCopy(data.lang);
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
    { href: `${base}/contact`, label: copy.nav.contact },
  ];
  return (
    <div dir={copy.dir} className={`lamsa-root ${lamsaFontVariables} min-h-screen`} style={lamsaCssVars(data.theme)} data-template="lamsa-v1">
      <LamsaHeader storeName={data.name} base={base} logoUrl={data.theme?.logo_url ?? null} announcement={data.theme?.announcement ?? null} copy={copy} lang={data.lang} currency={data.currency} searchIndex={searchIndex} categories={shop.categories} nav={nav} whatsapp={contact?.whatsapp ?? null} />
      <main className="min-h-[60vh]">{children}</main>
      <LamsaFooter storeName={data.name} base={base} logoUrl={data.theme?.logo_url ?? null} copy={copy} categories={shop.categories} contact={contact ? { phone: contact.phone ?? null, whatsapp: contact.whatsapp ?? null, email: contact.email ?? null, address: contact.address ?? null, instagram: contact.instagram ?? null, facebook: contact.facebook ?? null, tiktok: contact.tiktok ?? null } : null} faqEnabled={data.settings?.business?.faq_enabled !== false} />
    </div>
  );
}
