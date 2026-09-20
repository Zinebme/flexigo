import { notFound } from "next/navigation";
import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqProductBySlug, loadSouqZones, souqCheckoutSettingsFor } from "@/lib/storefront/souq/catalog";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { serializeNoorJsonLd } from "@/lib/storefront/noor/json-ld";
import { NoorProductView } from "./noor-product-view";
import { NoorProductCard } from "./noor-product-card";
import { NoorContainer, NoorHeading, NoorIcon } from "./noor-ui";
import { NoorReviewCards } from "./noor-home-blocks";

export async function NoorProductPage({ data, productSlug }: { data: StorefrontData; productSlug: string }) {
  const [bundle, zones] = await Promise.all([loadSouqProductBySlug(data.id, productSlug, data.settings), loadSouqZones(data.id)]);
  if (!bundle) notFound();
  const { product } = bundle;
  const copy = noorCopy(data.lang);
  const settings = souqCheckoutSettingsFor(data.settings);
  const description = product.description?.trim() || null;
  const category = bundle.related.find((item) => item.categoryId === product.category_id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description ?? undefined,
    image: bundle.images.length ? bundle.images : undefined,
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: data.name },
    ...(bundle.ratingAverage !== null && bundle.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: bundle.ratingAverage, reviewCount: bundle.ratingCount } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: data.currency,
      price: (product.price_cents / 100).toFixed(2),
      availability: bundle.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeNoorJsonLd(jsonLd) }} />
      <NoorContainer className="py-4 sm:py-7">
        <nav className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-[var(--noor-muted)]" aria-label={copy.product.breadcrumbHome}>
          <Link href={data.base}>{copy.product.breadcrumbHome}</Link>
          <NoorIcon name="chevron-left" className="h-3 w-3 shrink-0 ltr:rotate-180" />
          <Link href={`${data.base}/boutique`}>{copy.product.breadcrumbShop}</Link>
          {category ? (
            <>
              <NoorIcon name="chevron-left" className="h-3 w-3 shrink-0 ltr:rotate-180" />
              <span>{category.categoryName}</span>
            </>
          ) : null}
          <NoorIcon name="chevron-left" className="h-3 w-3 shrink-0 ltr:rotate-180" />
          <span className="truncate text-[var(--noor-ink)]">{product.name}</span>
        </nav>
        <div className="mt-5">
          <NoorProductView
            data={{
              storeSlug: data.slug,
              base: data.base,
              copy,
              lang: data.lang,
              currency: data.currency,
              settings,
              product: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.price_cents,
                compareAtPriceCents: product.compare_at_price_cents,
                imageUrl: bundle.images[0] ?? null,
                stock: product.stock,
                ratingAverage: bundle.ratingAverage,
                ratingCount: bundle.ratingCount,
              },
              variants: bundle.variants,
              optionGroups: bundle.optionGroups,
              addOnProducts: bundle.addOnProducts,
              offers: bundle.offers,
              zones,
              officeDeliveryEnabled: bundle.shipping.officeEnabled,
              whatsapp: data.settings?.contact?.whatsapp ?? null,
              anchorId: "noor-order-form",
              images: bundle.images,
              description,
              ratingAverage: bundle.ratingAverage,
              ratingCount: bundle.ratingCount,
              shipping: bundle.shipping,
            }}
          />
        </div>
      </NoorContainer>

      {description ? (
        <section className="noor-section border-t border-[var(--noor-border)] bg-[var(--noor-white)]">
          <NoorContainer className="max-w-3xl">
            <NoorHeading eyebrow="تفاصيل المنتج" title={copy.product.description} />
            <p className="whitespace-pre-line text-sm leading-8 text-[var(--noor-muted)]">{description}</p>
          </NoorContainer>
        </section>
      ) : null}

      {bundle.reviews.length ? (
        <section className="noor-section">
          <NoorContainer className="max-w-4xl">
            <NoorHeading title={`قالوا عن ${data.name}`} subtitle={copy.sections.reviewsSubtitle} />
            <NoorReviewCards reviews={bundle.reviews} />
          </NoorContainer>
        </section>
      ) : null}

      {bundle.faq.length ? (
        <section className="noor-section bg-[var(--noor-white)]">
          <NoorContainer className="max-w-3xl">
            <NoorHeading title={copy.product.faq} />
            <div className="border-t border-[var(--noor-border)]">
              {bundle.faq.map((item) => (
                <details key={item.id} className="noor-faq border-b border-[var(--noor-border)]">
                  <summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold">
                    <span>{item.question}</span>
                    <NoorIcon name="plus" className="noor-faq-icon h-4 w-4" />
                  </summary>
                  <p className="pb-5 text-sm leading-7 text-[var(--noor-muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </NoorContainer>
        </section>
      ) : null}

      {bundle.related.length ? (
        <section className="noor-section">
          <NoorContainer>
            <NoorHeading
              title={copy.product.related}
              action={<Link href={`${data.base}/boutique`} className="noor-text-link">{copy.sections.viewAll}<NoorIcon name="arrow-left" className="h-3.5 w-3.5 ltr:rotate-180" /></Link>}
            />
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-5">
              {bundle.related.slice(0, 4).map((item) => (
                <li key={item.id}><NoorProductCard product={item} base={data.base} copy={copy} lang={data.lang} currency={data.currency} /></li>
              ))}
            </ul>
          </NoorContainer>
        </section>
      ) : null}
    </>
  );
}
