import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnonSupabase } from "../../../../../../lib/supabase/anon";
import { getStorefrontData } from "../../../../../../lib/storefront/data";
import { loadCatalog } from "../../../../../../lib/storefront/catalog";
import { ShopBrowser } from "../../../../../../components/storefront/shop-browser";
import { SouqCategoryPage } from "../../../../../../components/storefront/templates-v2/souq/souq-shop-page";
import { isSouqTemplate } from "../../../../../../lib/templates/souq";

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

  // SOUQ storefront: dedicated RTL category page.
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

