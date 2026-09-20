import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontData } from "../../../../../lib/storefront/data";
import { loadCatalog } from "../../../../../lib/storefront/catalog";
import { ShopBrowser } from "../../../../../components/storefront/shop-browser";
import { SouqShopPage } from "../../../../../components/storefront/templates-v2/souq/souq-shop-page";
import { LamsaShopPage } from "../../../../../components/storefront/templates-v2/lamsa/lamsa-shop-page";
import { NoorShopPage } from "../../../../../components/storefront/templates-v2/noor/noor-shop-page";
import { VoltShopPage } from "../../../../../components/storefront/templates-v2/volt/volt-shop-page";
import { DarShopPage } from "../../../../../components/storefront/templates-v2/dar/dar-shop-page";
import { PulseShopPage } from "../../../../../components/storefront/templates-v2/pulse/pulse-shop-page";
import { LittleShopPage } from "../../../../../components/storefront/templates-v2/little/little-shop-page";
import { isSouqTemplate } from "../../../../../lib/templates/souq";
import { isLamsaTemplate } from "../../../../../lib/templates/lamsa";
import { isNoorTemplate } from "../../../../../lib/templates/noor";
import { isVoltTemplate } from "../../../../../lib/templates/volt";
import { isDarTemplate } from "../../../../../lib/templates/dar";
import { isPulseTemplate } from "../../../../../lib/templates/pulse";
import { isLittleTemplate } from "../../../../../lib/templates/little";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  return { title: data ? `${data.name} — Boutique` : "Boutique" };
}

export default async function BoutiquePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();
  if (data.website_type === "portfolio") notFound();

  if (isLittleTemplate(data.template_key) || isPulseTemplate(data.template_key) || isDarTemplate(data.template_key) || isVoltTemplate(data.template_key) || isNoorTemplate(data.template_key) || isLamsaTemplate(data.template_key) || isSouqTemplate(data.template_key)) {
    const query = searchParams ? await searchParams : {};
    const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
    if (isLittleTemplate(data.template_key)) return <LittleShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
    if (isPulseTemplate(data.template_key)) return <PulseShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
    if (isDarTemplate(data.template_key)) {
      return <DarShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
    }
    if (isVoltTemplate(data.template_key)) {
      return <VoltShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
    }
    if (isNoorTemplate(data.template_key)) {
      return <NoorShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
    }
    if (isLamsaTemplate(data.template_key)) {
      return <LamsaShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
    }
    return <SouqShopPage data={data} filter={first(query.filter) ?? null} sort={first(query.sort) ?? null} />;
  }

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
