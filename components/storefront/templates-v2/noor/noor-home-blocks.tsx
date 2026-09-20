"use client";

import { useState } from "react";
import type { SouqReview } from "@/lib/storefront/souq/catalog";
import { StorefrontImage } from "../../image";
import { NoorIcon, NoorStars } from "./noor-ui";

// ---------------------------------------------------------------------------
// Benefit cards
// ---------------------------------------------------------------------------

const BENEFIT_ICONS = ["spark", "check", "shield", "headset", "cash", "truck"] as const;

export function NoorBenefits({ items }: { items: Array<{ title?: string | null; text?: string | null }> }) {
  const visible = items.filter((item) => item.title || item.text).slice(0, 4);
  if (!visible.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {visible.map((item, index) => (
        <li key={index} className="rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-white)] p-5 text-center shadow-[var(--noor-shadow-soft)]">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--noor-blush)] text-[var(--noor-rose-deep)]">
            <NoorIcon name={BENEFIT_ICONS[index % BENEFIT_ICONS.length] ?? "spark"} className="h-5 w-5" />
          </span>
          {item.title ? <h3 className="mt-3 text-sm font-semibold text-[var(--noor-ink)]">{item.title}</h3> : null}
          {item.text ? <p className="mt-1 text-xs leading-6 text-[var(--noor-muted)]">{item.text}</p> : null}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Routine (data-driven editorial steps)
// ---------------------------------------------------------------------------

export function NoorRoutine({ steps }: { steps: Array<{ title?: string | null; text?: string | null }> }) {
  const visible = steps.filter((step) => step.title || step.text).slice(0, 6);
  if (!visible.length) return null;
  return (
    <ol className="grid gap-4 sm:grid-cols-3 sm:gap-5">
      {visible.map((step, index) => (
        <li key={index} className="relative rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-white)] p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--noor-plum)] text-sm font-bold text-white" aria-hidden="true">
            {index + 1}
          </span>
          {step.title ? <h3 className="mt-4 text-base font-semibold text-[var(--noor-plum)]">{step.title}</h3> : null}
          {step.text ? <p className="mt-2 text-sm leading-7 text-[var(--noor-muted)]">{step.text}</p> : null}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Before / after — renders only when the merchant supplies both images.
// ---------------------------------------------------------------------------

export function NoorBeforeAfter({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  note,
  layout = "split",
}: {
  beforeImage: string | null;
  afterImage: string | null;
  beforeLabel?: string | null;
  afterLabel?: string | null;
  note?: string | null;
  layout?: "split" | "slider" | "side";
}) {
  const [position, setPosition] = useState(50);
  // Never invent results: the block is fully omitted unless both images exist.
  if (!beforeImage || !afterImage) return null;

  if (layout === "slider") {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--noor-radius-card)] bg-[var(--noor-blush)]">
        <div className="absolute inset-0">
          <StorefrontImage src={afterImage} alt={afterLabel ?? "بعد"} fill sizes="(max-width:767px) 100vw, 1100px" className="object-cover" />
        </div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <StorefrontImage src={beforeImage} alt={beforeLabel ?? "قبل"} fill sizes="(max-width:767px) 100vw, 1100px" className="object-cover" />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="مقارنة قبل / بعد"
          className="absolute inset-x-4 bottom-4 z-10 accent-[var(--noor-plum)]"
        />
        <span className="absolute start-3 top-3 rounded-full bg-[var(--noor-white)]/90 px-3 py-1 text-xs font-semibold text-[var(--noor-plum)]">{beforeLabel ?? "قبل"}</span>
        <span className="absolute end-3 top-3 rounded-full bg-[var(--noor-plum)]/90 px-3 py-1 text-xs font-semibold text-white">{afterLabel ?? "بعد"}</span>
        {note ? <p className="absolute inset-x-4 bottom-12 text-center text-[11px] text-white/90">{note}</p> : null}
      </div>
    );
  }

  const stacked = layout === "side";
  return (
    <div className={stacked ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
      {[
        { image: beforeImage, label: beforeLabel ?? "قبل" },
        { image: afterImage, label: afterLabel ?? "بعد" },
      ].map((frame) => (
        <figure key={frame.label} className="relative overflow-hidden rounded-[var(--noor-radius-card)] bg-[var(--noor-blush)]">
          <div className="relative aspect-[4/3]">
            <StorefrontImage src={frame.image} alt={frame.label} fill sizes="(max-width:767px) 100vw, 550px" className="object-cover" />
          </div>
          <figcaption className="absolute start-3 top-3 rounded-full bg-[var(--noor-white)]/90 px-3 py-1 text-xs font-semibold text-[var(--noor-plum)]">{frame.label}</figcaption>
        </figure>
      ))}
      {note ? <p className="text-xs leading-6 text-[var(--noor-muted)] sm:col-span-2">{note}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results / stats — only merchant-provided numbers are shown.
// ---------------------------------------------------------------------------

export function NoorStats({ items }: { items: Array<{ value?: string | null; label?: string | null }> }) {
  const visible = items.filter((item) => item.value && item.label).slice(0, 4);
  if (!visible.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {visible.map((item, index) => (
        <li key={index} className="rounded-[var(--noor-radius-card)] bg-[var(--noor-blush)] p-6 text-center">
          <p className="noor-display text-3xl font-bold text-[var(--noor-plum)]">{item.value}</p>
          <p className="mt-2 text-xs leading-6 text-[var(--noor-muted)]">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Social gallery (2 cols mobile / 4 cols desktop)
// ---------------------------------------------------------------------------

export function NoorSocialGallery({ images, altBase }: { images: string[]; altBase: string }) {
  if (!images.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {images.slice(0, 8).map((image, index) => (
        <li key={`${image}-${index}`} className={index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}>
          <div className="relative aspect-square overflow-hidden rounded-[var(--noor-radius-card)] bg-[var(--noor-blush)]">
            <StorefrontImage src={image} alt={`${altBase} ${index + 1}`} fill sizes="(max-width:640px) 50vw, 25vw" className="noor-product-image object-cover" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Review cards
// ---------------------------------------------------------------------------

export function NoorReviewCards({ reviews }: { reviews: SouqReview[] }) {
  if (!reviews.length) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.slice(0, 6).map((review) => (
        <li key={review.id}>
          <figure className="h-full rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-white)] p-6 shadow-[var(--noor-shadow-soft)] sm:p-7">
            <NoorStars value={review.rating} />
            <blockquote className="mt-4 text-sm leading-7 text-[var(--noor-muted)]">« {review.body ?? review.title} »</blockquote>
            <figcaption className="mt-5 border-t border-[var(--noor-border)] pt-3 text-xs font-semibold text-[var(--noor-ink)]">
              {review.customerName}
              {review.verifiedOrder ? <span className="ms-2 text-[10px] text-[var(--noor-sage-deep)]">طلب موثّق</span> : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
