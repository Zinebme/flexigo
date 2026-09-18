import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontData } from "../../../../lib/storefront/data";
import { loadPublicPage, pageSections } from "../../../../lib/storefront/content";
import { RenderSection } from "../../../../components/storefront/sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) return { title: "Site introuvable" };
  const page = await loadPublicPage(data.id, "home");
  const og = page?.content.sections.find((s) => s.type === "hero") as
    | { image?: string | null; subtitle?: string | null }
    | undefined;
  return {
    title: data.name,
    description:
      og?.subtitle ??
      `${data.name} — ${data.website_type === "portfolio" ? "vitrine professionnelle" : "boutique en ligne, paiement à la livraison"}`,
    openGraph: {
      title: data.name,
      images: og?.image ? [{ url: og.image }] : undefined,
    },
  };
}

export default async function StorefrontHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();
  const page = await loadPublicPage(data.id, "home");
  const sections = pageSections(page);

  return (
    <>
      {sections.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-500">
          Ce site est en cours de configuration.
        </div>
      ) : (
        sections.map((section, i) => <RenderSection key={i} data={data} section={section} />)
      )}
    </>
  );
}
