import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { LamsaShop } from "./lamsa-shop";
import { LamsaContainer, LamsaEmpty, LamsaIcon } from "./lamsa-ui";

type Sort = "default" | "price-asc" | "price-desc" | "new" | "featured";
function sortValue(value?: string | null): Sort { return value === "price-asc" || value === "price-desc" || value === "new" || value === "featured" ? value : "default"; }

export async function LamsaShopPage({ data, filter, sort }: { data: StorefrontData; filter?: string | null; sort?: string | null }) {
  const { products, categories } = await loadSouqShop(data.id);
  const copy = lamsaCopy(data.lang);
  return (
    <LamsaContainer className="py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--lamsa-muted)]"><Link href={data.base}>{copy.nav.home}</Link><LamsaIcon name="chevron-left" className="h-3 w-3 ltr:rotate-180" /><span>{copy.nav.shop}</span></nav>
      <div className="mt-5 mb-7"><p className="lamsa-eyebrow">{filter === "offers" ? copy.nav.offers : "المتجر"}</p><h1 className="lamsa-display mt-2 text-3xl text-[var(--lamsa-chocolate)] sm:text-4xl">{filter === "offers" ? copy.sections.flashTitle : copy.nav.shop}</h1><p className="mt-2 text-sm text-[var(--lamsa-muted)]">{filter === "offers" ? copy.sections.flashSubtitle : copy.sections.categoriesSubtitle}</p></div>
      {products.length ? <LamsaShop products={products} categories={categories} base={data.base} copy={copy} lang={data.lang} currency={data.currency} initialOffers={filter === "offers"} initialSort={sortValue(sort)} /> : <LamsaEmpty title={copy.sections.noProducts} hint={copy.sections.noProductsHint} />}
    </LamsaContainer>
  );
}

export async function LamsaCategoryPage({ data, category }: { data: StorefrontData; category: { id: string; name: string; slug: string; description: string | null } }) {
  const { products, categories } = await loadSouqShop(data.id);
  const copy = lamsaCopy(data.lang);
  const list = products.filter((product) => product.categoryId === category.id);
  return (
    <LamsaContainer className="py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--lamsa-muted)]"><Link href={data.base}>{copy.nav.home}</Link><LamsaIcon name="chevron-left" className="h-3 w-3 ltr:rotate-180" /><Link href={`${data.base}/boutique`}>{copy.nav.shop}</Link><LamsaIcon name="chevron-left" className="h-3 w-3 ltr:rotate-180" /><span>{category.name}</span></nav>
      <div className="mt-5 mb-7"><p className="lamsa-eyebrow">{copy.nav.categories}</p><h1 className="lamsa-display mt-2 text-3xl text-[var(--lamsa-chocolate)] sm:text-4xl">{category.name}</h1>{category.description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--lamsa-muted)]">{category.description}</p> : null}</div>
      {list.length ? <LamsaShop products={list} categories={categories.filter((item) => item.id === category.id)} base={data.base} copy={copy} lang={data.lang} currency={data.currency} initialCategory={category.id} /> : <LamsaEmpty title={copy.sections.noProducts} hint={copy.sections.noProductsHint} />}
    </LamsaContainer>
  );
}
