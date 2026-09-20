import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { NoorShop } from "./noor-shop";
import { NoorContainer, NoorEmpty, NoorIcon } from "./noor-ui";

type Sort = "default" | "price-asc" | "price-desc" | "new" | "featured";
function sortValue(value?: string | null): Sort {
  return value === "price-asc" || value === "price-desc" || value === "new" || value === "featured" ? value : "default";
}

export async function NoorShopPage({ data, filter, sort }: { data: StorefrontData; filter?: string | null; sort?: string | null }) {
  const { products, categories } = await loadSouqShop(data.id);
  const copy = noorCopy(data.lang);
  return (
    <NoorContainer className="py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--noor-muted)]">
        <Link href={data.base}>{copy.nav.home}</Link>
        <NoorIcon name="chevron-left" className="h-3 w-3 ltr:rotate-180" />
        <span>{copy.nav.shop}</span>
      </nav>
      <div className="mt-5 mb-7">
        <p className="noor-eyebrow">{filter === "offers" ? copy.nav.offers : "المتجر"}</p>
        <h1 className="noor-display mt-2 text-3xl text-[var(--noor-plum)] sm:text-4xl">{filter === "offers" ? copy.sections.flashTitle : copy.nav.shop}</h1>
        <p className="mt-2 text-sm text-[var(--noor-muted)]">{filter === "offers" ? copy.sections.flashSubtitle : copy.sections.categoriesSubtitle}</p>
      </div>
      {products.length ? (
        <NoorShop products={products} categories={categories} base={data.base} copy={copy} lang={data.lang} currency={data.currency} initialOffers={filter === "offers"} initialSort={sortValue(sort)} />
      ) : (
        <NoorEmpty title={copy.sections.noProducts} hint={copy.sections.noProductsHint} />
      )}
    </NoorContainer>
  );
}

export async function NoorCategoryPage({ data, category }: { data: StorefrontData; category: { id: string; name: string; slug: string; description: string | null } }) {
  const { products, categories } = await loadSouqShop(data.id);
  const copy = noorCopy(data.lang);
  const list = products.filter((product) => product.categoryId === category.id);
  return (
    <NoorContainer className="py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--noor-muted)]">
        <Link href={data.base}>{copy.nav.home}</Link>
        <NoorIcon name="chevron-left" className="h-3 w-3 ltr:rotate-180" />
        <Link href={`${data.base}/boutique`}>{copy.nav.shop}</Link>
        <NoorIcon name="chevron-left" className="h-3 w-3 ltr:rotate-180" />
        <span>{category.name}</span>
      </nav>
      <div className="mt-5 mb-7">
        <p className="noor-eyebrow">{copy.nav.categories}</p>
        <h1 className="noor-display mt-2 text-3xl text-[var(--noor-plum)] sm:text-4xl">{category.name}</h1>
        {category.description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--noor-muted)]">{category.description}</p> : null}
      </div>
      {list.length ? (
        <NoorShop products={list} categories={categories.filter((item) => item.id === category.id)} base={data.base} copy={copy} lang={data.lang} currency={data.currency} initialCategory={category.id} />
      ) : (
        <NoorEmpty title={copy.sections.noProducts} hint={copy.sections.noProductsHint} />
      )}
    </NoorContainer>
  );
}
