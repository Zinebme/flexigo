import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnonSupabase } from "../../../../../../lib/supabase/anon";
import { getStorefrontData } from "../../../../../../lib/storefront/data";
import { loadCatalog } from "../../../../../../lib/storefront/catalog";
import { ShopBrowser } from "../../../../../../components/storefront/shop-browser";
import { SouqCategoryPage } from "../../../../../../components/storefront/templates-v2/souq/souq-shop-page";
import { LamsaCategoryPage } from "../../../../../../components/storefront/templates-v2/lamsa/lamsa-shop-page";
import { NoorCategoryPage } from "../../../../../../components/storefront/templates-v2/noor/noor-shop-page";
import { VoltCategoryPage } from "../../../../../../components/storefront/templates-v2/volt/volt-shop-page";
import { DarCategoryPage } from "../../../../../../components/storefront/templates-v2/dar/dar-shop-page";
import { PulseCategoryPage } from "../../../../../../components/storefront/templates-v2/pulse/pulse-shop-page";
import { LittleCategoryPage } from "../../../../../../components/storefront/templates-v2/little/little-shop-page";
import { isSouqTemplate } from "../../../../../../lib/templates/souq";
import { isLamsaTemplate } from "../../../../../../lib/templates/lamsa";
import { isNoorTemplate } from "../../../../../../lib/templates/noor";
import { isVoltTemplate } from "../../../../../../lib/templates/volt";
import { isDarTemplate } from "../../../../../../lib/templates/dar";
import { isPulseTemplate } from "../../../../../../lib/templates/pulse";
import { isLittleTemplate } from "../../../../../../lib/templates/little";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}): Promise<Metadata> {
  const { slug, category } = await params;
  const data = await getStorefrontData(slug);
  if (!data) return { title: "Catégorie" };
  const anon = getAnonSupabase();
  const { data: cat } = await anon
    .from("categories")
    .select("name")
    .eq("store_id", data.id)
    .eq("slug", category)
    .eq("is_visible", true)
    .maybeSingle();
  return { title: cat ? `${cat.name} — ${data.name}` : "Catégorie" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}) {
  const { slug, category } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();

  const anon = getAnonSupabase();
  const { data: cat } = await anon
    .from("categories")
    .select("id, name, slug, description")
    .eq("store_id", data.id)
    .eq("slug", category)
    .eq("is_visible", true)
    .maybeSingle();
  if (!cat) notFound();

  if (isLittleTemplate(data.template_key)) return <LittleCategoryPage data={data} category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }} />;
  if (isPulseTemplate(data.template_key)) return <PulseCategoryPage data={data} category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }} />;
  if (isDarTemplate(data.template_key)) {
    return <DarCategoryPage data={data} category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }} />;
  }
  if (isVoltTemplate(data.template_key)) {
    return <VoltCategoryPage data={data} category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }} />;
  }
  if (isNoorTemplate(data.template_key)) {
    return <NoorCategoryPage data={data} category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }} />;
  }
  if (isLamsaTemplate(data.template_key)) {
    return <LamsaCategoryPage data={data} category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }} />;
  }
  if (isSouqTemplate(data.template_key)) {
    return (
      <SouqCategoryPage
        data={data}
        category={{ id: cat.id, name: cat.name, slug: cat.slug ?? category, description: cat.description ?? null }}
      />
    );
  }

  const { products, categories } = await loadCatalog(data.id);
  const inCategory = products.filter((p) => p.category_id === cat.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">{cat.name}</h1>
      {cat.description ? <p className="mt-2 max-w-2xl text-slate-500">{cat.description}</p> : null}
      <div className="mt-8">
        <ShopBrowser
          products={inCategory}
          categories={categories.filter((c) => c.id === cat.id)}
          base={data.base}
          dict={{
            search: data.dict.shop.search,
            noResults: data.dict.shop.noResults,
            categories: data.dict.shop.categories,
            all: cat.name,
            order: data.dict.actions.order,
          }}
        />
      </div>
    </div>
  );
}

