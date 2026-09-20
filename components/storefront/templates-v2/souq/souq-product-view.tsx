"use client";

/**
 * SOUQ — product page interactive layer.
 *
 * Owns the gallery + the shared checkout state, so the SAME selections drive
 * the visible price, the quantity offers and the COD form (no duplicate state,
 * no drift between what the customer sees and what is submitted).
 *
 * Desktop: gallery left / product info + COD form right (RTL-aware ordering).
 * Mobile: gallery → info → options → COD form, so the form is reachable with
 * minimal scrolling.
 */
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { discountPercent } from "@/lib/storefront/souq/order-model";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import {
  SouqOrderFormView,
  SouqOptionPickers,
  SouqQuantityOffers,
  useSouqOrderState,
  type SouqOrderFormData,
} from "./souq-order-form";
import { SouqStickyCta } from "./souq-sticky-cta";
import { SouqBadge, SouqIcon, SouqImageFallback, SouqPrice, SouqStars, SouqTrustStrip } from "./souq-ui";
import { StorefrontImage } from "../../image";

export interface SouqProductViewData extends SouqOrderFormData {
  images: string[];
  description: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  shipping: {
    homeFromCents: number | null;
    officeFromCents: number | null;
    officeEnabled: boolean;
  };
  /** Short benefit lines (from content or derived from the description). */
  benefits: string[];
}

export function SouqProductView({ data }: { data: SouqProductViewData }) {
  const { copy, lang, currency, product } = data;
  const formRef = useRef<HTMLFormElement | null>(null);
  const form = useSouqOrderState(data, formRef);
  const [activeImage, setActiveImage] = useState(0);

  const images = data.images.length > 0 ? data.images : product.imageUrl ? [product.imageUrl] : [];
  const current = images[Math.min(activeImage, Math.max(0, images.length - 1))];
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  // Rating fields are optional on the shared form data → normalize once.
  const rating = product.ratingAverage ?? null;
  const ratingCount = product.ratingCount ?? 0;
  const displayPriceCents = form.variant?.price_cents ?? product.priceCents;
  const outOfStock = !form.inStock && form.quantity === 1 && !form.variant && form.optionIssues.length === 0;
  const anchorId = data.anchorId ?? "souq-order-form";

  const whatsappHref = data.whatsapp ? `https://wa.me/${data.whatsapp.replace(/\D/g, "")}` : null;
  const priceLabel = `${copy.product.orderNow} • ${formatSouqPrice(
    form.preview.lines.length > 0 ? Math.round(form.preview.subtotalCents / Math.max(1, form.quantity)) : displayPriceCents,
    lang,
    currency,
  )}`;

  return (
    <div className="pb-24 lg:pb-0">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        {/* ---------------------------------------------------------------- */}
        {/* Gallery                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div className="souq-card relative overflow-hidden">
            <div className="relative aspect-square bg-slate-50">
              {current ? (
                <StorefrontImage
                  src={current}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <SouqImageFallback />
              )}

              <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                <div className="flex flex-col items-start gap-1.5">
                  {discount > 0 ? (
                    <SouqBadge tone="danger" className="px-3 py-1.5 text-xs shadow">
                      {copy.product.discount} {discount}%
                    </SouqBadge>
                  ) : null}
                  {rating !== null && ratingCount >= 3 ? (
                    <SouqBadge tone="primary" className="bg-[var(--souq-primary)]/90">
                      {copy.product.bestSeller}
                    </SouqBadge>
                  ) : null}
                </div>
                {!form.inStock ? (
                  <SouqBadge tone="neutral" className="bg-white/95 text-slate-700">
                    {copy.product.outOfStock}
                  </SouqBadge>
                ) : null}
              </div>

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImage((index) => (index > 0 ? index - 1 : images.length - 1))}
                    aria-label={copy.common.close}
                    className="souq-press absolute start-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                  >
                    <SouqIcon name={copy.dir === "rtl" ? "chevron-right" : "chevron-left"} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((index) => (index + 1) % images.length)}
                    aria-label={copy.product.gallery}
                    className="souq-press absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                  >
                    <SouqIcon name={copy.dir === "rtl" ? "chevron-left" : "chevron-right"} className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {images.length > 1 ? (
            <ul className="souq-scroll-x mt-3 px-0.5" aria-label={copy.product.gallery}>
              {images.map((url, index) => (
                <li key={`${url}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`${copy.product.imageOf.replace("{n}", String(index + 1)).replace("{total}", String(images.length))}`}
                    aria-current={index === activeImage}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-[14px] border-2 bg-slate-50 transition sm:h-20 sm:w-20",
                      index === activeImage ? "border-[var(--souq-primary)]" : "border-transparent hover:border-slate-300",
                    )}
                  >
                    <StorefrontImage src={url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Info + COD form                                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:order-1">
          <div className="flex flex-wrap items-center gap-2">
            {rating !== null ? <SouqStars value={rating} count={ratingCount} /> : null}
            {form.variant && form.variant.stock > 0 && form.variant.stock <= 5 ? (
              <SouqBadge tone="accent">{copy.product.lowStock.replace("{n}", String(form.variant.stock))}</SouqBadge>
            ) : form.inStock ? (
              <SouqBadge tone="success">
                <SouqIcon name="check" className="h-3 w-3" />
                {copy.product.inStock}
              </SouqBadge>
            ) : (
              <SouqBadge tone="danger">{copy.product.outOfStock}</SouqBadge>
            )}
          </div>

          <h1 className="mt-2.5 text-2xl font-extrabold leading-snug tracking-tight text-[var(--souq-primary)] sm:text-[28px]">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <SouqPrice cents={displayPriceCents} compareAtCents={product.compareAtPriceCents} lang={lang} currency={currency} size="lg" />
            {discount > 0 ? (
              <SouqBadge tone="accent" className="mb-1">
                {copy.product.save} {formatSouqPrice((product.compareAtPriceCents ?? 0) - displayPriceCents, lang, currency)}
              </SouqBadge>
            ) : null}
          </div>

          {data.benefits.length > 0 ? (
            <ul className="mt-4 space-y-1.5">
              {data.benefits.slice(0, 4).map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-[13px] font-semibold text-slate-600">
                  <SouqIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Option groups live next to the price (form keeps its own copy hidden) */}
          {data.optionGroups.length > 0 ? (
            <div className="mt-5">
              <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-slate-700">
                <SouqIcon name="spark" className="h-4 w-4 text-[var(--souq-accent)]" />
                {copy.product.chooseOptions}
              </p>
              <SouqOptionPickers groups={data.optionGroups} state={form} copy={copy} lang={lang} />
              {form.optionIssues.length > 0 && form.submitState.status === "error" ? (
                <p role="alert" className="souq-error mt-2">
                  {copy.errors.options}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Quantity offers next to the price too */}
          <div className="mt-5">
            <SouqQuantityOffers
              baseUnitCents={displayPriceCents}
              offers={data.offers}
              productId={product.id}
              quantity={form.quantity}
              onChange={form.setQuantity}
              copy={copy}
              lang={lang}
              currency={currency}
            />
          </div>

          <SouqTrustStrip
            className="mt-5"
            items={[
              { icon: "cash", label: copy.product.codPayment },
              { icon: "truck", label: deliverySummary(copy, data.shipping, lang) },
              { icon: "office", label: data.shipping.officeEnabled ? copy.product.deliveryOffice : copy.product.secureOrder },
              { icon: "headset", label: copy.product.customerService },
            ]}
          />

          <div className="mt-5">
            <SouqOrderFormView
              data={{ ...data, anchorId, showOptionPickers: false, showQuantityOffers: false }}
              form={form}
              formRef={formRef}
            />
          </div>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="souq-press mt-3 flex items-center justify-center gap-2 rounded-[14px] border border-emerald-200 px-4 py-3 text-sm font-extrabold text-emerald-700"
            >
              <SouqIcon name="whatsapp" className="h-5 w-5" />
              {copy.product.whatsappAsk}
            </a>
          ) : null}
        </div>
      </div>

      <SouqStickyCta
        anchorId={anchorId}
        priceLabel={priceLabel}
        inStock={form.inStock && !outOfStock}
        copy={copy}
        secondaryHref={whatsappHref}
        secondaryLabel={copy.product.whatsappAsk}
      />
    </div>
  );
}

function deliverySummary(
  copy: SouqCopy,
  shipping: SouqProductViewData["shipping"],
  lang: string,
): string {
  if (shipping.homeFromCents === null) return copy.product.deliveryTo58;
  if (shipping.homeFromCents === 0) return `${copy.product.deliveryHome} — ${copy.checkout.shippingFree}`;
  return `${copy.product.deliveryHome} — ${formatSouqPrice(shipping.homeFromCents, lang)}`;
}
