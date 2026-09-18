import type { Metadata } from "next";
import { getStorefrontData } from "../../../../../lib/storefront/data";
import { ContentPage } from "../../../../../components/storefront/content-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  return { title: data ? `${data.name} — Mentions légales` : "Mentions légales" };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <ContentPage params={props.params} pageKey="legal-terms" />;
}
