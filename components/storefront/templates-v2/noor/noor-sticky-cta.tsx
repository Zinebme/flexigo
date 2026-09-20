"use client";

import { useCallback, useEffect, useState } from "react";
import { NoorIcon } from "./noor-ui";

/** NOOR mobile sticky order CTA — collapses when the COD form is visible/focused. */
export function NoorStickyCta({ anchorId, label, disabled, disabledLabel }: { anchorId: string; label: string; disabled: boolean; disabledLabel: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const target = document.getElementById(anchorId);
    if (!target) return;
    const updateFocus = () => setHidden(target.contains(document.activeElement));
    target.addEventListener("focusin", updateFocus);
    target.addEventListener("focusout", () => window.setTimeout(updateFocus, 0));
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setHidden(Boolean(entry?.isIntersecting)), { rootMargin: "-10% 0px -38%", threshold: 0.12 });
    observer?.observe(target);
    return () => {
      observer?.disconnect();
      target.removeEventListener("focusin", updateFocus);
    };
  }, [anchorId]);
  const go = useCallback(() => {
    const target = document.getElementById(anchorId);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => target.querySelector<HTMLElement>("input, select, button")?.focus({ preventScroll: true }), reduced ? 0 : 350);
  }, [anchorId]);
  return (
    <div className="noor-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-[var(--noor-border)] bg-[var(--noor-bg)]/96 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-24px_#2b1d20] backdrop-blur-lg lg:hidden" data-hidden={hidden} aria-hidden={hidden}>
      <button type="button" onClick={go} disabled={disabled} className="mx-auto flex min-h-12 w-full max-w-xl items-center justify-center gap-2 rounded-full bg-[var(--noor-plum)] px-5 text-sm font-semibold text-white disabled:opacity-55">
        <NoorIcon name="cart" className="h-4 w-4" />{disabled ? disabledLabel : label}
      </button>
    </div>
  );
}
