/**
 * SOUQ — product detail page (server component).
 *
 * Full Arabic RTL product page: breadcrumb → gallery + buy box + COD form →
 * description → features → reviews → FAQ → related products.
 * Everything comes from the store's real data; SEO metadata and JSON-LD are
 * generated from the same values (no invented reviews, ratings or stock).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { souqCopy, souqFormat } from "@/lib/storefront/souq/copy";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqProductBySlug, loadSouqZones, souqCheckoutSettingsFor } from "@/lib/storefront/souq/catalog";
import { SouqProductCard } from "./souq-product-card";
import { SouqProductView } from "./souq-product-view";
import { SouqContainer, SouqIcon, SouqSectionHeading, SouqStars } from "./souq-ui";

export async function SouqProductPage({ data, productSlug }: { data: StorefrontData; productSlug: string }) {
  const copy = souqCopy(data.lang);
  const bundle = await loadSouqProductBySlug(data.id, productSlug, data.settings);
  if (!bundle) notFound();

  const zones = await loadSouqZones(data.id);
  const checkoutSettings = souqCheckoutSettingsFor(data.settings);
  const { product } = bundle;
  const base = data.base;

  const description = product.description ?? null;
  const benefits = extractBenefits(description);
  const breadcrumbCategory = bundle.related.find((item) => item.categoryId === product.category_id)?.categoryName ?? null;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description ?? undefined,
    image: bundle.images.length > 0 ? bundle.images : undefined,
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: data.name },
    ...(bundle.ratingAverage !== null && bundle.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: bundle.ratingAverage,
            reviewCount: bundle.ratingCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${base}/produit/${product.slug}`,
      priceCurrency: data.currency === "DZD" ? "DZD" : data.currency,
      price: (product.price_cents / 100).toFixed(2),
      availability: bundle.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: data.name },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SouqContainer className="py-4 sm:py-6">
        {/* Breadcrumb — RTL direction of travel, chevrons mirror automatically */}
        <nav aria-label={copy.product.breadcrumbHome} className="flex items-center gap-1.5 overflow-x-auto text-[12px] text-slate-500">
          <Link href={base} className="shrink-0 font-bold hover:text-[var(--souq-primary)]">
            {copy.product.breadcrumbHome}
          </Link>
          <SouqIcon name="chevron-left" className="h-3.5 w-3.5 shrink-0 text-slate-300 ltr:rotate-180" />
          <Link href={`${base}/boutique`} className="shrink-0 font-bold hover:text-[var(--souq-primary)]">
            {copy.product.breadcrumbShop}
          </Link>
          {breadcrumbCategory ? (
            <>
              <SouqIcon name="chevron-left" className="h-3.5 w-3.5 shrink-0 text-slate-300 ltr:rotate-180" />
              <span className="shrink-0">{breadcrumbCategory}</span>
            </>
          ) : null}
          <SouqIcon name="chevron-left" className="h-3.5 w-3.5 shrink-0 text-slate-300 ltr:rotate-180" />
          <span className="truncate font-bold text-slate-700">{product.name}</span>
        </nav>

        <div className="mt-4">
          <SouqProductView
            data={{
              storeSlug: data.slug,
              base,
              copy,
              lang: data.lang,
              currency: data.currency,
              settings: checkoutSettings,
              product: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.price_cents,freeShipping:product.free_shipping,
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
              anchorId: "souq-order-form",
              images: bundle.images,
              description,
              ratingAverage: bundle.ratingAverage,
              ratingCount: bundle.ratingCount,
              shipping: bundle.shipping,
              benefits,
            }}
          />
        </div>
      </SouqContainer>

      {/* Description */}
      {description ? (
        <section className="border-t border-[var(--souq-border)] bg-white py-8 sm:py-10">
          <SouqContainer className="max-w-3xl">
            <SouqSectionHeading title={copy.product.description} subtitle={null} />
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600">{description}</p>
          </SouqContainer>
        </section>
      ) : null}

      {/* Features */}
      {benefits.length > 2 ? (
        <section className="py-8 sm:py-10">
          <SouqContainer className="max-w-3xl">
            <SouqSectionHeading title={copy.product.features} subtitle={null} />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {benefits.slice(0, 6).map((benefit) => (
                <li key={benefit} className="souq-card flex items-start gap-2.5 p-3.5 text-[13px] font-semibold text-slate-700">
                  <SouqIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {benefit}
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      ) : null}

      {/* Reviews */}
      {bundle.reviews.length > 0 ? (
        <section className="bg-white py-8 sm:py-10">
          <SouqContainer className="max-w-3xl">
            <SouqSectionHeading
              title={copy.sections.reviewsTitle}
              action={
                bundle.ratingAverage !== null ? (
                  <div className="flex items-center gap-2">
                    <SouqStars value={bundle.ratingAverage} />
                    <span className="text-[12px] font-bold text-slate-500">
                      {souqFormat(copy.product.reviews, {})} {bundle.ratingCount}
                    </span>
                  </div>
                ) : null
              }
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {bundle.reviews.map((review) => (
                <li key={review.id}>
                  <figure className="souq-card h-full p-4">
                    <SouqStars value={review.rating} />
                    {review.title ? <p className="mt-2 text-[13px] font-extrabold text-slate-800">{review.title}</p> : null}
                    <blockquote className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{review.body}</blockquote>
                    <figcaption className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-bold text-slate-600">{review.customerName}</span>
                      {review.verifiedOrder ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                          <SouqIcon name="check" className="h-3 w-3" />
                          {copy.product.codPayment}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      ) : null}

      {/* Product FAQ */}
      {bundle.faq.length > 0 ? (
        <section className="py-8 sm:py-10">
          <SouqContainer className="max-w-3xl">
            <SouqSectionHeading title={copy.product.faq} subtitle={copy.sections.faqSubtitle} />
            <ul className="space-y-2.5">
              {bundle.faq.map((item) => (
                <li key={item.id}>
                  <details className="souq-faq-item souq-card overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <span className="text-[13.5px] font-bold text-slate-800">{item.question}</span>
                      <SouqIcon name="chevron" className="souq-faq-chevron h-4 w-4 shrink-0 text-[var(--souq-primary)]" />
                    </summary>
                    <div className="souq-faq-answer border-t border-[var(--souq-border)] px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">
                      {item.answer}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      ) : null}

      {/* Related */}
      {bundle.related.length > 0 ? (
        <section className="bg-white py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading
              title={copy.product.related}
              action={
                <Link href={`${base}/boutique`} className="flex items-center gap-1 text-[13px] font-bold text-[var(--souq-primary)] hover:underline">
                  {copy.sections.viewAll}
                  <SouqIcon name="chevron-left" className="h-4 w-4 ltr:rotate-180" />
                </Link>
              }
            />
            <ul className="souq-scroll-x sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
              {bundle.related.slice(0, 8).map((item) => (
                <li key={item.id} className="w-[168px] sm:w-auto">
                  <SouqProductCard product={item} base={base} copy={copy} lang={data.lang} currency={data.currency} />
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      ) : null}

      <p className="sr-only">
        {copy.product.codPayment} — {formatSouqPrice(product.price_cents, data.lang, data.currency)}
      </p>
    </>
  );
}

/**
 * Short benefit lines: merchant bullet lines when present, otherwise the first
 * informative sentences of the description. Never invented content.
 */
function extractBenefits(description: string | null): string[] {
  if (!description) return [];
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const bullets = lines.filter((line) => /^[-•*•–—]/.test(line)).map((line) => line.replace(/^[-•*•–—\s]+/, ""));
  if (bullets.length >= 2) return bullets.slice(0, 6);
  const sentences = description
    .split(/[.!?؟\n]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12 && sentence.length <= 90);
  return sentences.slice(0, 4);
}
