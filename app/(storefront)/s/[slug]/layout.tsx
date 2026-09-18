import { notFound } from "next/navigation";
import { resolveStoreBySlug } from "../../../../lib/storefront/resolve";
import { getStorefrontData } from "../../../../lib/storefront/data";
import { StorefrontHeader } from "../../../../components/storefront/header";
import { StorefrontFooter } from "../../../../components/storefront/footer";
import { UnavailableScreen } from "../../../../components/storefront/unavailable";

/**
 * Storefront layout — the single entry point for every tenant site.
 *
 * Resolution: slug → store (cached 30 s). Only ACTIVE stores render content;
 * everything else gets a generic screen (no tenant data leak for drafts,
 * suspended or archived sites). Language: store default, overridable via
 * ?lang=fr|ar|en (Arabic renders RTL).
 */
export default async function StorefrontLayout({
  children,
  params,
  searchParams,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const store = await resolveStoreBySlug(slug);
  if (!store) notFound();
  if (store.status !== "active") {
    return <UnavailableScreen kind={store.status} />;
  }

  const qs = await searchParams;
  const langParam = Array.isArray(qs.lang) ? qs.lang[0] : qs.lang;
  const data = await getStorefrontData(slug, langParam);
  if (!data) notFound();

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
