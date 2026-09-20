import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import type { StoreLanguage } from "@/lib/types";
import { SouqIcon, type SouqIconName } from "../souq/souq-ui";

/** NOOR line icons reuse the shared, audited icon set. */
export function NoorIcon(props: { name: SouqIconName; className?: string; title?: string; filled?: boolean }) {
  return <SouqIcon {...props} />;
}

export function NoorContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("noor-container", className)}>{children}</div>;
}

export function NoorEyebrow({ children }: { children: ReactNode }) {
  return <p className="noor-eyebrow">{children}</p>;
}

export function NoorHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "start",
}: {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  action?: ReactNode;
  align?: "start" | "center";
}) {
  return (
    <header className={cn("noor-section-head", align === "center" && "text-center")}>
      <div className={cn("min-w-0", align === "center" && "mx-auto")}>
        {eyebrow ? <NoorEyebrow>{eyebrow}</NoorEyebrow> : null}
        <h2 className="noor-heading">{title}</h2>
        {subtitle ? <p className={cn("noor-subtitle", align === "center" && "mx-auto")}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function NoorPrice({
  cents,
  compareAtCents,
  lang = "ar",
  currency = "DZD",
  large = false,
}: {
  cents: number;
  compareAtCents?: number | null;
  lang?: StoreLanguage | string | null;
  currency?: string;
  large?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={cn("noor-price font-bold text-[var(--noor-plum)]", large ? "text-2xl" : "text-base sm:text-lg")}>
        {formatSouqPrice(cents, lang, currency)}
      </span>
      {compareAtCents && compareAtCents > cents ? (
        <span className="noor-price text-xs text-[var(--noor-muted)] line-through opacity-70">
          {formatSouqPrice(compareAtCents, lang, currency)}
        </span>
      ) : null}
    </div>
  );
}

export function NoorStars({ value, count }: { value: number | null; count?: number }) {
  if (value === null) return null;
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${value} من 5`}>
      <span className="flex gap-0.5 text-[var(--noor-gold)]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <NoorIcon key={index} name="star" filled={index < rounded} className="h-3.5 w-3.5" />
        ))}
      </span>
      {count ? <span className="text-[11px] text-[var(--noor-muted)]">({count})</span> : null}
    </span>
  );
}

export function NoorBadge({ tone = "plum", children }: { tone?: "plum" | "light" | "sage"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "noor-product-label",
        tone === "light" && "noor-product-label--light",
        tone === "sage" && "noor-product-label--sage",
      )}
    >
      {children}
    </span>
  );
}

export function NoorEmpty({ title, hint }: { title: string; hint?: string | null }) {
  return (
    <div className="rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-white)] px-5 py-14 text-center">
      <NoorIcon name="spark" className="mx-auto h-8 w-8 text-[var(--noor-rose)]" />
      <p className="mt-3 font-semibold text-[var(--noor-ink)]">{title}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--noor-muted)]">{hint}</p> : null}
    </div>
  );
}
