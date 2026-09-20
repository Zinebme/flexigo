"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { discountPercent } from "@/lib/storefront/souq/order-model";
import {
  SouqOptionPickers,
  SouqOrderFormView,
  SouqQuantityOffers,
  useSouqOrderState,
  type SouqOrderFormData,
} from "../souq/souq-order-form";
import { StorefrontImage } from "../../image";
import { NoorIcon, NoorPrice, NoorStars } from "./noor-ui";
import { NoorStickyCta } from "./noor-sticky-cta";

export interface NoorProductViewData extends SouqOrderFormData {
  images: string[];
  description: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  shipping: { hasZones: boolean; homeFromCents: number | null; officeFromCents: number | null; officeEnabled: boolean };
}

/**
 * NOOR product buy-box. The gallery is NOOR-specific (swipe, thumbnails, zoom,
 * active indicator); the variant pickers, quantity offers and COD form reuse
 * the shared, secure FlexiGo checkout engine and receive the NOOR skin.
 */
export function NoorProductView({ data }: { data: NoorProductViewData }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const form = useSouqOrderState(data, formRef);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchStart = useRef<number | null>(null);

  const images = data.images.length ? data.images : data.product.imageUrl ? [data.product.imageUrl] : [];
  const current = images[Math.min(active, Math.max(0, images.length - 1))] ?? null;
  const next = () => setActive((value) => (value + 1) % images.length);
  const previous = () => setActive((value) => (value - 1 + images.length) % images.length);

  const displayPrice = form.variant?.price_cents ?? data.product.priceCents;
  const discount = discountPercent(displayPrice, data.product.compareAtPriceCents);
  const stickyPrice = form.preview.totalCents;
  const anchorId = data.anchorId ?? "noor-order-form";

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="lg:order-2">
          <div className="relative">
            {images.length > 1 ? (
              <ul className="mb-3 hidden gap-2 lg:flex" aria-label={data.copy.product.gallery}>
                {images.map((image, index) => (
                  <li key={`${image}-${index}`}>
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`${data.copy.product.gallery} ${index + 1}`}
                      className={cn("relative h-18 w-18 overflow-hidden rounded-2xl border-2 bg-[var(--noor-blush)]", active === index ? "border-[var(--noor-plum)]" : "border-transparent opacity-70")}
                    >
                      <StorefrontImage src={image} alt="" fill sizes="74px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[var(--noor-radius-card)] bg-[var(--noor-blush)]"
              onTouchStart={(event) => {
                touchStart.current = event.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (touchStart.current === null || end === undefined || Math.abs(end - touchStart.current) < 42 || images.length < 2) return;
                if (end > touchStart.current) previous();
                else next();
                touchStart.current = null;
              }}
            >
              {current ? (
                <button type="button" onClick={() => setZoom(true)} className="absolute inset-0 h-full w-full cursor-zoom-in" aria-label={data.copy.product.gallery}>
                  <StorefrontImage src={current} alt={data.product.name} fill priority sizes="(max-width:1024px) 100vw, 48vw" className="object-cover" />
                </button>
              ) : (
                <span className="flex h-full items-center justify-center text-[var(--noor-rose)]"><NoorIcon name="image" className="h-10 w-10" /></span>
              )}
              {discount > 0 ? <span className="noor-product-label absolute start-3 top-3">{data.copy.product.specialOffer}</span> : null}
              {images.length > 1 ? (
                <>
                  <button type="button" onClick={previous} aria-label="الصورة السابقة" className="noor-gallery-arrow start-3"><NoorIcon name="chevron-right" className="h-4 w-4" /></button>
                  <button type="button" onClick={next} aria-label="الصورة التالية" className="noor-gallery-arrow end-3"><NoorIcon name="chevron-left" className="h-4 w-4" /></button>
                  <span className="absolute bottom-3 end-3 rounded-full bg-[var(--noor-white)]/90 px-2.5 py-1 text-[11px] text-[var(--noor-ink)]" dir="ltr">{active + 1} / {images.length}</span>
                </>
              ) : null}
            </div>
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex justify-center gap-1.5 lg:hidden" aria-label={data.copy.product.gallery}>
              {images.map((_, index) => (
                <button key={index} type="button" onClick={() => setActive(index)} aria-label={String(index + 1)} className={cn("h-1 rounded-full transition-all", active === index ? "w-7 bg-[var(--noor-plum)]" : "w-3 bg-[var(--noor-border)]")} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Info + buy box */}
        <div className="min-w-0 lg:order-1">
          <div className="flex flex-wrap items-center gap-3">
            <NoorStars value={data.ratingAverage} count={data.ratingCount} />
            {form.inStock ? (
              <span className="text-[11px] font-semibold text-[var(--noor-sage-deep)]">{data.copy.product.inStock}</span>
            ) : (
              <span className="text-[11px] font-semibold text-[var(--noor-danger)]">{data.copy.product.outOfStock}</span>
            )}
          </div>
          <h1 className="noor-display mt-3 text-[1.65rem] leading-[1.5] text-[var(--noor-plum)] sm:text-[2rem]">{data.product.name}</h1>
          <div className="mt-3"><NoorPrice cents={displayPrice} compareAtCents={data.product.compareAtPriceCents} lang={data.lang} currency={data.currency} large /></div>

          {data.description ? <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--noor-muted)]">{data.description}</p> : null}

          {data.optionGroups.length ? (
            <section className="mt-7 border-t border-[var(--noor-border)] pt-6" aria-labelledby="noor-options-title">
              <h2 id="noor-options-title" className="mb-4 text-sm font-semibold text-[var(--noor-ink)]">{data.copy.product.chooseOptions}</h2>
              <SouqOptionPickers groups={data.optionGroups} state={form} copy={data.copy} lang={data.lang} />
              {form.optionIssues.length && form.submitState.status === "error" ? <p className="souq-error mt-2" role="alert">{data.copy.errors.options}</p> : null}
            </section>
          ) : null}

          {data.settings.showQuantityOffers ? (
            <section className="mt-6">
              <SouqQuantityOffers baseUnitCents={displayPrice} offers={data.offers} productId={data.product.id} quantity={form.quantity} onChange={form.setQuantity} copy={data.copy} lang={data.lang} currency={data.currency} />
            </section>
          ) : null}

          <div className="noor-order-form mt-7">
            <SouqOrderFormView data={{ ...data, showOptionPickers: false, showQuantityOffers: false }} form={form} formRef={formRef} />
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-border)] text-[11px] sm:grid-cols-3">
            <li className="flex min-h-13 items-center gap-2 bg-[var(--noor-blush)]/60 px-3"><NoorIcon name="cash" className="h-4 w-4 text-[var(--noor-rose-deep)]" />{data.copy.product.codPayment}</li>
            {data.shipping.hasZones ? <li className="flex min-h-13 items-center gap-2 bg-[var(--noor-blush)]/60 px-3"><NoorIcon name="truck" className="h-4 w-4 text-[var(--noor-rose-deep)]" />{data.copy.product.deliveryTo58}</li> : null}
            <li className="col-span-2 flex min-h-13 items-center gap-2 bg-[var(--noor-blush)]/60 px-3 sm:col-span-1"><NoorIcon name="shield" className="h-4 w-4 text-[var(--noor-rose-deep)]" />{data.copy.product.secureOrder}</li>
          </ul>
        </div>
      </div>

      {zoom && current ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#201417]/94 p-4" role="dialog" aria-modal="true" aria-label={data.copy.product.gallery}>
          <button type="button" className="absolute inset-0" onClick={() => setZoom(false)} aria-label={data.copy.common.close} />
          <div className="relative h-[88dvh] w-full max-w-4xl"><StorefrontImage src={current} alt={data.product.name} fill sizes="100vw" className="object-contain" /></div>
          <button type="button" onClick={() => setZoom(false)} className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black" aria-label={data.copy.common.close}>
            <NoorIcon name="close" className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <NoorStickyCta anchorId={anchorId} label={`${data.copy.product.orderNow} • ${formatSouqPrice(stickyPrice, data.lang, data.currency)}`} disabled={!form.inStock} disabledLabel={data.copy.product.outOfStock} />
    </div>
  );
}
