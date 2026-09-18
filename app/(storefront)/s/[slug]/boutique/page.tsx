import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontData } from "../../../../../lib/storefront/data";
import { loadCatalog } from "../../../../../lib/storefront/catalog";
import { ShopBrowser } from "../../../../../components/storefront/shop-browser";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  return { title: data ? `${data.name} — Boutique` : "Boutique" };
}

export default async function BoutiquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();
  if (data.website_type === "portfolio") notFound();
  const { products, categories } = await loadCatalog(data.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-extrabold text-slate-900">{data.dict.shop.title}</h1>
      <ShopBrowser
        products={products}
        categories={categories}
        base={data.base}
        dict={{
          search: data.dict.shop.search,
          noResults: data.dict.shop.noResults,
          categories: data.dict.shop.categories,
          all: data.dict.shop.all,
          order: data.dict.actions.order,
        }}
      />
    </div>
  );
}
