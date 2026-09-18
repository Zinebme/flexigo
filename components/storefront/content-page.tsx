import { notFound } from "next/navigation";
import { getStorefrontData } from "../../lib/storefront/data";
import { loadPublicPage, pageSections } from "../../lib/storefront/content";
import { RenderSection } from "./sections";

/**
 * Renders a published content page (about / legal terms / privacy) from the
 * structured sections system. Falls back to a friendly empty state when the
 * merchant has not filled the page yet.
 */
export async function ContentPage({
  params,
  pageKey,
}: {
  params: Promise<{ slug: string }>;
  pageKey: "about" | "legal-terms" | "legal-privacy";
}) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();
  const page = await loadPublicPage(data.id, pageKey);
  const sections = pageSections(page);

  const fallbackTitle =
    pageKey === "about" ? data.dict.about.title : pageKey === "legal-terms" ? data.dict.legal.terms : data.dict.legal.privacy;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      {sections.length === 0 ? (
        <>
          <h1 className="text-3xl font-extrabold text-slate-900">{fallbackTitle}</h1>
          <p className="mt-4 text-slate-500">Le contenu de cette page arrive bientôt.</p>
        </>
      ) : (
        sections.map((section, i) => <RenderSection key={i} data={data} section={section} />)
      )}
    </div>
  );
}
