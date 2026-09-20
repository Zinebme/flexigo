"use client";

/**
 * SOUQ — smart sticky mobile CTA on product pages ("اطلب الآن • 2 900 دج").
 *
 * Behavior:
 *  - compact bar, appears above the safe-area padding, never covers inputs;
 *  - smooth-scrolls to (and focuses) the COD form;
 *  - automatically slides away while the customer is inside the order form,
 *    so it never hides the fields they are filling.
 */
import { useCallback, useEffect, useState } from "react";
import type { SouqCopy } from "@/lib/storefront/souq/copy";
import { SouqIcon } from "./souq-ui";

export function SouqStickyCta({
  anchorId,
  priceLabel,
  inStock,
  copy,
  secondaryHref,
  secondaryLabel,
}: {
  anchorId: string;
  priceLabel: string;
  inStock: boolean;
  copy: SouqCopy;
  secondaryHref?: string | null;
  secondaryLabel?: string | null;
}) {
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(anchorId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setFormVisible(entry.isIntersecting);
      },
      // Triggers only once a meaningful part of the form is on screen.
      { rootMargin: "-10% 0px -45% 0px", threshold: 0.15 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [anchorId]);

  const scrollToForm = useCallback(() => {
    const target = document.getElementById(anchorId);
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => {
      const focusable = target.querySelector<HTMLElement>("input, select, button");
      focusable?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 420);
  }, [anchorId]);

  return (
    <div
      className="souq-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-[var(--souq-border)] bg-white/97 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgb(15_42_71_/_0.45)] backdrop-blur lg:hidden"
      data-hidden={formVisible ? "true" : "false"}
      aria-hidden={formVisible}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2">
        {secondaryHref && secondaryLabel ? (
          <a
            href={secondaryHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={secondaryLabel}
            className="souq-press flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-emerald-200 text-emerald-700"
          >
            <SouqIcon name="whatsapp" className="h-5 w-5" />
          </a>
        ) : null}
        <span className="souq-price min-w-0 flex-1 truncate text-sm font-extrabold text-[var(--souq-primary)]">{priceLabel}</span>
        <button
          type="button"
          onClick={scrollToForm}
          disabled={!inStock}
          className="souq-press flex shrink-0 items-center gap-2 rounded-[14px] bg-[var(--souq-accent)] px-4 py-3 text-sm font-extrabold text-[var(--souq-accent-text)] disabled:opacity-60"
        >
          <SouqIcon name="cart" className="h-4 w-4" />
          {inStock ? copy.product.orderNow : copy.product.outOfStock}
        </button>
      </div>
    </div>
  );
}
