import { notFound } from "next/navigation";
import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqProductBySlug, loadSouqZones, souqCheckoutSettingsFor } from "@/lib/storefront/souq/catalog";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { serializeLamsaJsonLd } from "@/lib/storefront/lamsa/json-ld";
import { LamsaProductView } from "./lamsa-product-view";
import { LamsaContainer, LamsaHeading, LamsaIcon, LamsaStars } from "./lamsa-ui";
import { LamsaProductCard } from "./lamsa-product-card";

export async function LamsaProductPage({ data, productSlug }: { data: StorefrontData; productSlug: string }) {
  const [bundle, zones] = await Promise.all([loadSouqProductBySlug(data.id, productSlug, data.settings), loadSouqZones(data.id)]);
  if (!bundle) notFound();
  const { product } = bundle;
  const copy = lamsaCopy(data.lang);
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
    ...(bundle.ratingAverage !== null && bundle.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: bundle.ratingAverage, reviewCount: bundle.ratingCount } } : {}),
    offers: { "@type": "Offer", priceCurrency: data.currency, price: (product.price_cents / 100).toFixed(2), availability: bundle.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLamsaJsonLd(jsonLd) }} />
      <LamsaContainer className="py-4 sm:py-7">
        <nav className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-[var(--lamsa-muted)]" aria-label={copy.product.breadcrumbHome}>
          <Link href={data.base}>{copy.product.breadcrumbHome}</Link><LamsaIcon name="chevron-left" className="h-3 w-3 shrink-0 ltr:rotate-180" /><Link href={`${data.base}/boutique`}>{copy.product.breadcrumbShop}</Link>{category ? <><LamsaIcon name="chevron-left" className="h-3 w-3 shrink-0 ltr:rotate-180" /><span>{category.categoryName}</span></> : null}<LamsaIcon name="chevron-left" className="h-3 w-3 shrink-0 ltr:rotate-180" /><span className="truncate text-[var(--lamsa-ink)]">{product.name}</span>
        </nav>
        <div className="mt-5">
          <LamsaProductView data={{
            storeSlug: data.slug,
            base: data.base,
            copy,
            lang: data.lang,
            currency: data.currency,
            settings,
            product: { id: product.id, slug: product.slug, name: product.name, priceCents: product.price_cents,freeShipping:product.free_shipping, compareAtPriceCents: product.compare_at_price_cents, imageUrl: bundle.images[0] ?? null, stock: product.stock, ratingAverage: bundle.ratingAverage, ratingCount: bundle.ratingCount },
            variants: bundle.variants,
            optionGroups: bundle.optionGroups,
            addOnProducts: bundle.addOnProducts,
            offers: bundle.offers,
            zones,
            officeDeliveryEnabled: bundle.shipping.officeEnabled,
            whatsapp: data.settings?.contact?.whatsapp ?? null,
            anchorId: "lamsa-order-form",
            images: bundle.images,
            description,
            ratingAverage: bundle.ratingAverage,
            ratingCount: bundle.ratingCount,
            shipping: bundle.shipping,
          }} />
        </div>
      </LamsaContainer>

      {description ? <section className="lamsa-section border-t border-[var(--lamsa-border)] bg-[var(--lamsa-white)]"><LamsaContainer className="max-w-3xl"><LamsaHeading eyebrow="تفاصيل القطعة" title={copy.product.description} /><p className="whitespace-pre-line text-sm leading-8 text-[var(--lamsa-muted)]">{description}</p></LamsaContainer></section> : null}

      {bundle.reviews.length ? <section className="lamsa-section"><LamsaContainer className="max-w-4xl"><LamsaHeading title={`قالوا عن ${data.name}`} subtitle={copy.sections.reviewsSubtitle} /><ul className="grid gap-4 sm:grid-cols-2">{bundle.reviews.map((review) => <li key={review.id}><figure className="h-full border border-[var(--lamsa-border)] bg-[var(--lamsa-white)] p-6"><LamsaStars value={review.rating} /><blockquote className="mt-4 text-sm leading-7 text-[var(--lamsa-muted)]">{review.body ?? review.title}</blockquote><figcaption className="mt-5 text-xs font-semibold text-[var(--lamsa-ink)]">{review.customerName}</figcaption></figure></li>)}</ul></LamsaContainer></section> : null}

      {bundle.faq.length ? <section className="lamsa-section bg-[var(--lamsa-white)]"><LamsaContainer className="max-w-3xl"><LamsaHeading title={copy.product.faq} /><div className="border-t border-[var(--lamsa-border)]">{bundle.faq.map((item) => <details key={item.id} className="lamsa-faq border-b border-[var(--lamsa-border)]"><summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold"><span>{item.question}</span><LamsaIcon name="plus" className="lamsa-faq-icon h-4 w-4" /></summary><p className="pb-5 text-sm leading-7 text-[var(--lamsa-muted)]">{item.answer}</p></details>)}</div></LamsaContainer></section> : null}

      {bundle.related.length ? <section className="lamsa-section"><LamsaContainer><LamsaHeading title={copy.product.related} action={<Link href={`${data.base}/boutique`} className="lamsa-text-link">{copy.sections.viewAll}<LamsaIcon name="arrow-left" className="h-3.5 w-3.5 ltr:rotate-180" /></Link>} /><ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-5">{bundle.related.slice(0, 4).map((item) => <li key={item.id}><LamsaProductCard product={item} base={data.base} copy={copy} lang={data.lang} currency={data.currency} /></li>)}</ul></LamsaContainer></section> : null}
    </>
  );
}
