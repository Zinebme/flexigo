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
import { LamsaIcon, LamsaPrice, LamsaStars } from "./lamsa-ui";
import { LamsaStickyOrder } from "./lamsa-sticky-order";

export interface LamsaProductViewData extends SouqOrderFormData {
  images: string[];
  description: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  shipping: { hasZones: boolean; homeFromCents: number | null; officeFromCents: number | null; officeEnabled: boolean };
}

export function LamsaProductView({ data }: { data: LamsaProductViewData }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const form = useSouqOrderState(data, formRef);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchStart = useRef<number | null>(null);
  const images = data.images.length ? data.images : data.product.imageUrl ? [data.product.imageUrl] : [];
  const current = images[Math.min(active, Math.max(0, images.length - 1))] ?? null;
  const displayPrice = form.variant?.price_cents ?? data.product.priceCents;
  const discount = discountPercent(displayPrice, data.product.compareAtPriceCents);
  const anchorId = data.anchorId ?? "lamsa-order-form";
  const stickyPrice = form.preview.lines.length ? form.preview.subtotalCents : displayPrice;

  const previous = () => setActive((value) => (value > 0 ? value - 1 : images.length - 1));
  const next = () => setActive((value) => (value + 1) % images.length);
  return (
    <div className="pb-22 lg:pb-0">
      <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:gap-12 xl:gap-16">
        <div className="min-w-0 lg:order-2 lg:sticky lg:top-28 lg:self-start">
          <div className="grid gap-3 lg:grid-cols-[74px_1fr]">
            {images.length > 1 ? <ul className="hidden max-h-[630px] flex-col gap-2 overflow-y-auto lg:flex">{images.map((image, index) => <li key={`${image}-${index}`}><button type="button" onClick={() => setActive(index)} aria-current={index === active} aria-label={data.copy.product.imageOf.replace("{n}", String(index + 1)).replace("{total}", String(images.length))} className={cn("relative aspect-[3/4] w-full overflow-hidden border-2 bg-[var(--lamsa-beige)]", active === index ? "border-[var(--lamsa-chocolate)]" : "border-transparent opacity-70")}><StorefrontImage src={image} alt="" fill sizes="74px" className="object-cover" /></button></li>)}</ul> : null}
            <div
              className="relative aspect-[4/5] overflow-hidden bg-[var(--lamsa-beige)]"
              onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (touchStart.current === null || end === undefined || Math.abs(end - touchStart.current) < 42 || images.length < 2) return;
                if (end > touchStart.current) previous(); else next();
                touchStart.current = null;
              }}
            >
              {current ? <button type="button" onClick={() => setZoom(true)} className="absolute inset-0 h-full w-full cursor-zoom-in" aria-label={data.copy.product.gallery}><StorefrontImage src={current} alt={data.product.name} fill priority sizes="(max-width:1024px) 100vw, 48vw" className="object-cover" /></button> : <span className="flex h-full items-center justify-center text-[var(--lamsa-taupe)]"><LamsaIcon name="image" className="h-10 w-10" /></span>}
              {discount > 0 ? <span className="lamsa-product-label absolute start-3 top-3">{data.copy.product.specialOffer}</span> : null}
              {images.length > 1 ? <><button type="button" onClick={previous} aria-label="الصورة السابقة" className="lamsa-gallery-arrow start-3"><LamsaIcon name="chevron-right" className="h-4 w-4" /></button><button type="button" onClick={next} aria-label="الصورة التالية" className="lamsa-gallery-arrow end-3"><LamsaIcon name="chevron-left" className="h-4 w-4" /></button><span className="absolute bottom-3 end-3 bg-[var(--lamsa-ivory)]/90 px-2.5 py-1 text-[11px] text-[var(--lamsa-ink)]" dir="ltr">{active + 1} / {images.length}</span></> : null}
            </div>
          </div>
          {images.length > 1 ? <div className="mt-3 flex justify-center gap-1.5 lg:hidden" aria-label={data.copy.product.gallery}>{images.map((_, index) => <button key={index} type="button" onClick={() => setActive(index)} aria-label={String(index + 1)} className={cn("h-1 rounded-full transition-all", active === index ? "w-7 bg-[var(--lamsa-chocolate)]" : "w-3 bg-[var(--lamsa-border)]")} />)}</div> : null}
        </div>

        <div className="min-w-0 lg:order-1">
          <div className="flex flex-wrap items-center gap-3"><LamsaStars value={data.ratingAverage} count={data.ratingCount} />{form.inStock ? <span className="text-[11px] font-semibold text-[#526A56]">{data.copy.product.inStock}</span> : <span className="text-[11px] font-semibold text-[#9B3D35]">{data.copy.product.outOfStock}</span>}</div>
          <h1 className="lamsa-display mt-3 text-[1.65rem] leading-[1.55] text-[var(--lamsa-ink)] sm:text-[2rem]">{data.product.name}</h1>
          <div className="mt-3"><LamsaPrice cents={displayPrice} compareAtCents={data.product.compareAtPriceCents} lang={data.lang} currency={data.currency} large /></div>

          {data.optionGroups.length ? <section className="mt-7 border-t border-[var(--lamsa-border)] pt-6" aria-labelledby="lamsa-options-title"><h2 id="lamsa-options-title" className="mb-4 text-sm font-semibold text-[var(--lamsa-ink)]">{data.copy.product.chooseOptions}</h2><SouqOptionPickers groups={data.optionGroups} state={form} copy={data.copy} lang={data.lang} />{form.optionIssues.length && form.submitState.status === "error" ? <p className="souq-error mt-2" role="alert">{data.copy.errors.options}</p> : null}</section> : null}

          {data.settings.showQuantityOffers ? <section className="mt-6"><SouqQuantityOffers baseUnitCents={displayPrice} offers={data.offers} productId={data.product.id} quantity={form.quantity} onChange={form.setQuantity} copy={data.copy} lang={data.lang} currency={data.currency} /></section> : null}

          <div className="lamsa-order-form mt-7">
            <SouqOrderFormView data={{ ...data, showOptionPickers: false, showQuantityOffers: false }} form={form} formRef={formRef} />
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-[var(--lamsa-border)] bg-[var(--lamsa-border)] text-[11px] sm:grid-cols-3">
            <li className="flex min-h-13 items-center gap-2 bg-[var(--lamsa-ivory)] px-3"><LamsaIcon name="cash" className="h-4 w-4 text-[var(--lamsa-gold)]" />{data.copy.product.codPayment}</li>
            {data.shipping.hasZones ? <li className="flex min-h-13 items-center gap-2 bg-[var(--lamsa-ivory)] px-3"><LamsaIcon name="truck" className="h-4 w-4 text-[var(--lamsa-gold)]" />{data.copy.product.deliveryTo58}</li> : null}
            <li className="col-span-2 flex min-h-13 items-center gap-2 bg-[var(--lamsa-ivory)] px-3 sm:col-span-1"><LamsaIcon name="phone" className="h-4 w-4 text-[var(--lamsa-gold)]" />{data.copy.product.secureOrder}</li>
          </ul>
        </div>
      </div>

      {zoom && current ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#161310]/94 p-4" role="dialog" aria-modal="true" aria-label={data.copy.product.gallery}><button type="button" className="absolute inset-0" onClick={() => setZoom(false)} aria-label={data.copy.common.close} /><div className="relative h-[88dvh] w-full max-w-4xl"><StorefrontImage src={current} alt={data.product.name} fill sizes="100vw" className="object-contain" /></div><button type="button" onClick={() => setZoom(false)} className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center bg-white text-black" aria-label={data.copy.common.close}><LamsaIcon name="close" className="h-5 w-5" /></button></div> : null}

      <LamsaStickyOrder anchorId={anchorId} label={`${data.copy.product.orderNow} • ${formatSouqPrice(stickyPrice, data.lang, data.currency)}`} disabled={!form.inStock} disabledLabel={data.copy.product.outOfStock} />
    </div>
  );
}
