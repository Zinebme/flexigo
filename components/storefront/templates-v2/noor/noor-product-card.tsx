import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SouqProductSummary } from "@/lib/storefront/souq/catalog";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { StoreLanguage } from "@/lib/types";
import { discountPercent } from "@/lib/storefront/souq/order-model";
import { StorefrontImage } from "../../image";
import { NoorBadge, NoorIcon, NoorPrice, NoorStars } from "./noor-ui";

/**
 * NoorProductCard — beauty-focused, soft and editorial.
 * 4:5 image well, rounded card, subtle badges and an understated CTA.
 */
export function NoorProductCard({
  product,
  base,
  copy,
  lang,
  currency = "DZD",
  priority = false,
  className = "",
}: {
  product: SouqProductSummary;
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage | string | null;
  currency?: string;
  priority?: boolean;
  className?: string;
}) {
  const href = `${base}/produit/${product.slug}`;
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const unavailable = !product.hasVariants && product.stock <= 0;
  return (
    <article className={cn("noor-product group min-w-0", className)}>
      <Link
        href={href}
        className="relative block aspect-[4/5] overflow-hidden rounded-[var(--noor-radius-card)] bg-[var(--noor-blush)]"
        aria-label={product.name}
      >
        {product.image ? (
          <StorefrontImage
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 480px) 48vw, (max-width: 1024px) 31vw, 24vw"
            className={cn("noor-product-image object-cover", unavailable && "grayscale-[35%] opacity-70")}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[var(--noor-rose)]">
            <NoorIcon name="spark" className="h-9 w-9" />
          </span>
        )}
        <span className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.isFeatured ? <NoorBadge>{copy.product.bestSeller}</NoorBadge> : null}
          {discount > 0 ? <NoorBadge tone="light">{copy.product.specialOffer}</NoorBadge> : null}
        </span>
        {unavailable ? (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-[var(--noor-white)]/95 px-3 py-2 text-center text-xs font-semibold text-[var(--noor-muted)]">
            {copy.product.outOfStock}
          </span>
        ) : null}
      </Link>
      <div className="pt-3">
        {product.categoryName ? (
          <p className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-[var(--noor-rose-deep)]">{product.categoryName}</p>
        ) : null}
        <Link href={href} className="line-clamp-2 min-h-11 text-[13px] font-semibold leading-[1.7] text-[var(--noor-ink)] transition hover:text-[var(--noor-plum)] sm:text-sm">
          {product.name}
        </Link>
        {product.ratingAverage !== null ? (
          <div className="mt-1"><NoorStars value={product.ratingAverage} count={product.ratingCount} /></div>
        ) : null}
        <div className="mt-1.5"><NoorPrice cents={product.priceCents} compareAtCents={product.compareAtPriceCents} lang={lang} currency={currency} /></div>
        <Link
          href={href}
          className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--noor-border)] px-4 text-xs font-semibold text-[var(--noor-plum)] transition hover:border-[var(--noor-rose)] hover:bg-[var(--noor-blush)]"
        >
          {unavailable ? copy.product.notAvailable : copy.product.orderNow}
          <NoorIcon name="arrow-left" className="h-3.5 w-3.5 ltr:rotate-180" />
        </Link>
      </div>
    </article>
  );
}
