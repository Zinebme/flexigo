import { notFound } from "next/navigation";
import { resolveStoreBySlug } from "@/lib/storefront/resolve";
import { getStorefrontData } from "@/lib/storefront/data";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { UnavailableScreen } from "@/components/storefront/unavailable";
import { SouqShell } from "@/components/storefront/templates-v2/souq/souq-shell";
import { LamsaShell } from "@/components/storefront/templates-v2/lamsa/lamsa-shell";
import { NoorShell } from "@/components/storefront/templates-v2/noor/noor-shell";
import { VoltShell } from "@/components/storefront/templates-v2/volt/volt-shell";
import { DarShell } from "@/components/storefront/templates-v2/dar/dar-shell";
import { PulseShell } from "@/components/storefront/templates-v2/pulse/pulse-shell";
import { LittleShell } from "@/components/storefront/templates-v2/little/little-shell";
import { isSouqTemplate } from "@/lib/templates/souq";
import { isLamsaTemplate } from "@/lib/templates/lamsa";
import { isNoorTemplate } from "@/lib/templates/noor";
import { isVoltTemplate } from "@/lib/templates/volt";
import { isDarTemplate } from "@/lib/templates/dar";
import { isPulseTemplate } from "@/lib/templates/pulse";
import { isLittleTemplate } from "@/lib/templates/little";

/**
 * Storefront layout — the single entry point for every tenant site.
 *
 * Resolution: slug → store (cached 30 s). Only ACTIVE stores render content;
 * everything else gets a generic screen (no tenant data leak for drafts,
 * suspended or archived sites). Language: store default, overridable by the
 * fx_lang cookie set by the header switcher (Arabic renders RTL).
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await resolveStoreBySlug(slug);
  if (!store) notFound();
  if (store.status !== "active") {
    return <UnavailableScreen kind={store.status} />;
  }

  const data = await getStorefrontData(slug);
  if (!data) notFound();

  // V2 storefronts are explicit: no existing tenant is migrated implicitly.
  if (isLittleTemplate(store.template_key) || isLittleTemplate(data.template_key)) return <LittleShell data={data}>{children}</LittleShell>;
  if (isPulseTemplate(store.template_key) || isPulseTemplate(data.template_key)) return <PulseShell data={data}>{children}</PulseShell>;
  if (isDarTemplate(store.template_key) || isDarTemplate(data.template_key)) {
    return <DarShell data={data}>{children}</DarShell>;
  }
  if (isVoltTemplate(store.template_key) || isVoltTemplate(data.template_key)) {
    return <VoltShell data={data}>{children}</VoltShell>;
  }
  if (isNoorTemplate(store.template_key) || isNoorTemplate(data.template_key)) {
    return <NoorShell data={data}>{children}</NoorShell>;
  }
  if (isLamsaTemplate(store.template_key) || isLamsaTemplate(data.template_key)) {
    return <LamsaShell data={data}>{children}</LamsaShell>;
  }
  if (isSouqTemplate(store.template_key) || isSouqTemplate(data.template_key)) {
    return <SouqShell data={data}>{children}</SouqShell>;
  }

  const primary = data.theme?.primary_color ?? "#1d4ed8";
  const bg = data.theme?.background_color ?? "#ffffff";

  return (
    <div
      dir={data.dict.dir}
      style={{ backgroundColor: bg, ["--fx-primary" as string]: primary }}
      className="min-h-screen"
    >
      <StorefrontHeader data={data} />
      <main className="min-h-[60vh]">{children}</main>
      <StorefrontFooter data={data} />
    </div>
  );
}
