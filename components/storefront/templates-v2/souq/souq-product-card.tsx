/**
 * SouqProductCard — the SOUQ product card (server + client safe).
 *
 * Distinct from every other FlexiGo template: image-first, discount badge on
 * the media, competitor-style trust row (rating + stock), navy price block with
 * amber "order" action, and a compact mobile footprint (2 columns from 360px).
 */
import { cn } from "@/lib/utils";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { discountPercent } from "@/lib/storefront/souq/order-model";
import type { StoreLanguage } from "@/lib/types";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import type { SouqProductSummary } from "@/lib/storefront/souq/catalog";
import { StorefrontImage } from "../../image";
import { SouqBadge, SouqIcon, SouqImageFallback, SouqStars } from "./souq-ui";

export interface SouqProductCardProps {
  product: SouqProductSummary;
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage | string | null;
  currency?: string;
  /** "grid" (default) or "compact" for horizontal scrollers. */
  layout?: "grid" | "compact";
  priority?: boolean;
  className?: string;
}

export function SouqProductCard({
  product,
  base,
  copy,
  lang,
  currency = "DZD",
  layout = "grid",
  priority = false,
  className = "",
}: SouqProductCardProps) {
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const outOfStock = !product.hasVariants && product.stock <= 0;
  const lowStock = !product.hasVariants && product.stock > 0 && product.stock <= product.lowStockThreshold;
  const productHref = `${base}/produit/${product.slug}`;

  return (
    <article
      className={cn(
        "souq-card souq-hover-lift group flex flex-col overflow-hidden",
        layout === "compact" && "w-[168px] sm:w-[200px]",
        className,
      )}
    >
      <a href={productHref} className="souq-zoom-parent relative block aspect-square overflow-hidden bg-slate-50" aria-label={product.name}>
        {product.image ? (
          <StorefrontImage
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 480px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className={cn("souq-zoom object-cover", outOfStock && "opacity-60")}
          />
        ) : (
          <SouqImageFallback />
        )}

        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <div className="flex flex-col items-start gap-1">
            {discount > 0 ? (
              <SouqBadge tone="danger" className="shadow-sm">
                {copy.product.discount} {discount}%
              </SouqBadge>
            ) : null}
            {product.isFeatured ? <SouqBadge tone="primary">{copy.product.bestSeller}</SouqBadge> : null}
          </div>
          {outOfStock ? (
            <SouqBadge tone="neutral" className="bg-white/95 text-slate-600">
              {copy.product.outOfStock}
            </SouqBadge>
          ) : lowStock ? (
            <SouqBadge tone="accent">{copy.product.lowStock.replace("{n}", String(product.stock))}</SouqBadge>
          ) : (
            <SouqBadge tone="success" className="bg-white/95">
              {copy.product.inStock}
            </SouqBadge>
          )}
        </div>
      </a>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5 sm:p-3.5">
        {product.categoryName ? (
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{product.categoryName}</span>
        ) : null}

        <a
          href={productHref}
          className="line-clamp-2 text-[13px] font-bold leading-5 text-slate-800 transition hover:text-[var(--souq-primary)] sm:text-sm"
        >
          {product.name}
        </a>

        {product.ratingAverage !== null ? <SouqStars value={product.ratingAverage} count={product.ratingCount} /> : null}

        <div className="mt-auto pt-1.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="souq-price text-[15px] font-extrabold text-[var(--souq-primary)] sm:text-base">
              {formatSouqPrice(product.priceCents, lang, currency)}
            </span>
            {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents ? (
              <span className="souq-price text-[11px] text-slate-400 line-through">
                {formatSouqPrice(product.compareAtPriceCents, lang, currency)}
              </span>
            ) : null}
          </div>

          {outOfStock ? (
            <button
              type="button"
              disabled
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[13px] border border-slate-200 bg-slate-100 px-3 py-2.5 text-[13px] font-bold text-slate-400"
            >
              {copy.product.outOfStock}
            </button>
          ) : (
            <a
              href={`${base}/commande?product=${product.id}`}
              className="souq-press mt-2 flex w-full items-center justify-center gap-1.5 rounded-[13px] bg-[var(--souq-accent)] px-3 py-2.5 text-[13px] font-extrabold text-[var(--souq-accent-text)] hover:bg-[var(--souq-accent-hover)]"
            >
              <SouqIcon name="cart" className="h-4 w-4" />
              {copy.product.orderNow}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/** Ranked row used by the "الأكثر مبيعاً" section (different visual rhythm). */
export function SouqRankedProductRow({
  product,
  base,
  copy,
  lang,
  rank,
  currency = "DZD",
}: {
  product: SouqProductSummary;
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage | string | null;
  rank: number;
  currency?: string;
}) {
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  return (
    <a
      href={`${base}/produit/${product.slug}`}
      className="souq-hover-lift flex items-center gap-3 rounded-[16px] border border-[var(--souq-border)] bg-white p-2.5 sm:p-3"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--souq-primary-soft)] text-sm font-extrabold text-[var(--souq-primary)]">
        {rank}
      </span>
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-slate-50">
        {product.image ? (
          <StorefrontImage src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
        ) : (
          <SouqImageFallback />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-[13px] font-bold text-slate-800">{product.name}</span>
        <span className="mt-1 flex items-center gap-2">
          <span className="souq-price text-sm font-extrabold text-[var(--souq-primary)]">
            {formatSouqPrice(product.priceCents, lang, currency)}
          </span>
          {discount > 0 ? <SouqBadge tone="danger">{discount}%-</SouqBadge> : null}
        </span>
      </span>
      <SouqIcon name="chevron-left" className="h-4 w-4 shrink-0 text-slate-300 ltr:rotate-180" />
      <span className="sr-only">{copy.product.orderNow}</span>
    </a>
  );
}
