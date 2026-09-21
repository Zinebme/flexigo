import { notFound } from "next/navigation";
import { ShowcaseInnerPage, showcaseConfigs, type ShowcaseTheme } from "@/components/storefront/showcase-preview";

export const dynamic = "force-static";

const themes = ["volt", "dar", "pulse", "little"] as const;
const pages = ["boutique", "a-propos", "faq", "contact"] as const;

export function generateStaticParams() {
  return themes.flatMap((theme) => pages.map((page) => ({ theme, page })));
}

export default async function PreviewInnerPage({ params }: { params: Promise<{ theme: string; page: string }> }) {
  const { theme, page } = await params;
  if (!(theme in showcaseConfigs) || !pages.includes(page as (typeof pages)[number])) notFound();
  return <ShowcaseInnerPage theme={theme as ShowcaseTheme} page={page as (typeof pages)[number]} />;
}
