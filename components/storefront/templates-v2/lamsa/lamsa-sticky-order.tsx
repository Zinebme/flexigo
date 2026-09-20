"use client";

import { useCallback, useEffect, useState } from "react";
import { LamsaIcon } from "./lamsa-ui";

export function LamsaStickyOrder({ anchorId, label, disabled, disabledLabel }: { anchorId: string; label: string; disabled: boolean; disabledLabel: string }) {
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
    <div className="lamsa-sticky-order fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lamsa-border)] bg-[var(--lamsa-ivory)]/96 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-24px_#211b17] backdrop-blur-lg lg:hidden" data-hidden={hidden} aria-hidden={hidden}>
      <button type="button" onClick={go} disabled={disabled} className="mx-auto flex min-h-12 w-full max-w-xl items-center justify-center gap-2 bg-[var(--lamsa-chocolate)] px-5 text-sm font-semibold text-white disabled:opacity-55">
        <LamsaIcon name="cart" className="h-4 w-4" />{disabled ? disabledLabel : label}
      </button>
    </div>
  );
}
