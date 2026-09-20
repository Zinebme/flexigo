/**
 * SOUQ — shop & category pages (server components).
 */
import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { SouqContainer, SouqEmptyState, SouqIcon } from "./souq-ui";
import { SouqShopBrowser } from "./souq-shop";

type SortKey = "default" | "price-asc" | "price-desc" | "new" | "featured";

function normalizeSort(value: string | null | undefined): SortKey {
  switch (value) {
    case "price-asc":
    case "price-desc":
    case "new":
    case "featured":
      return value;
    default:
      return "default";
  }
}

export async function SouqShopPage({
  data,
  filter,
  sort,
}: {
  data: StorefrontData;
  filter?: string | null;
  sort?: string | null;
}) {
  const copy = souqCopy(data.lang);
  const { products, categories } = await loadSouqShop(data.id);

  return (
    <SouqContainer className="py-5 sm:py-8">
      <nav aria-label={copy.product.breadcrumbHome} className="mb-3 flex items-center gap-1.5 text-[12px] text-slate-500">
        <Link href={data.base} className="font-bold hover:text-[var(--souq-primary)]">
          {copy.product.breadcrumbHome}
        </Link>
        <SouqIcon name="chevron-left" className="h-3.5 w-3.5 text-slate-300 ltr:rotate-180" />
        <span className="font-bold text-slate-700">{filter === "offers" ? copy.nav.offers : copy.nav.shop}</span>
      </nav>

      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--souq-primary)] sm:text-3xl">
        {filter === "offers" ? copy.sections.flashTitle : copy.nav.shop}
      </h1>
      <p className="mt-1.5 text-[13px] text-slate-500">
        {filter === "offers" ? copy.sections.flashSubtitle : copy.sections.categoriesSubtitle}
      </p>

      <div className="mt-5">
        {products.length === 0 ? (
          <SouqEmptyState title={copy.sections.noProducts} hint={copy.sections.noProductsHint} icon="grid" />
        ) : (
          <SouqShopBrowser
            products={products}
            categories={categories}
            base={data.base}
            copy={copy}
            lang={data.lang}
            currency={data.currency}
            initialFilter={filter === "offers" ? "offers" : null}
            initialSort={normalizeSort(sort)}
          />
        )}
      </div>
    </SouqContainer>
  );
}

export async function SouqCategoryPage({
  data,
  category,
}: {
  data: StorefrontData;
  category: { id: string; name: string; slug: string; description: string | null };
}) {
  const copy = souqCopy(data.lang);
  const { products, categories } = await loadSouqShop(data.id);
  const inCategory = products.filter((product) => product.categoryId === category.id);

  return (
    <SouqContainer className="py-5 sm:py-8">
      <nav aria-label={copy.product.breadcrumbHome} className="mb-3 flex items-center gap-1.5 text-[12px] text-slate-500">
        <Link href={data.base} className="font-bold hover:text-[var(--souq-primary)]">
          {copy.product.breadcrumbHome}
        </Link>
        <SouqIcon name="chevron-left" className="h-3.5 w-3.5 text-slate-300 ltr:rotate-180" />
        <Link href={`${data.base}/boutique`} className="font-bold hover:text-[var(--souq-primary)]">
          {copy.product.breadcrumbShop}
        </Link>
        <SouqIcon name="chevron-left" className="h-3.5 w-3.5 text-slate-300 ltr:rotate-180" />
        <span className="font-bold text-slate-700">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--souq-primary)] sm:text-3xl">{category.name}</h1>
      {category.description ? <p className="mt-1.5 max-w-2xl text-[13px] text-slate-500">{category.description}</p> : null}

      <div className="mt-5">
        {inCategory.length === 0 ? (
          <SouqEmptyState title={copy.sections.noProducts} hint={copy.sections.noProductsHint} icon="grid" />
        ) : (
          <SouqShopBrowser
            products={inCategory}
            categories={categories.filter((item) => item.id === category.id)}
            base={data.base}
            copy={copy}
            lang={data.lang}
            currency={data.currency}
            initialCategoryId={category.id}
            lockedCategoryLabel={category.name}
          />
        )}
      </div>
    </SouqContainer>
  );
}
