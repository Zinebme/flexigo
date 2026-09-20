import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import type { StoreLanguage } from "@/lib/types";
import { SouqIcon, type SouqIconName } from "../souq/souq-ui";

export function LamsaIcon(props: { name: SouqIconName; className?: string; title?: string; filled?: boolean }) {
  return <SouqIcon {...props} />;
}

export function LamsaContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("lamsa-container", className)}>{children}</div>;
}

export function LamsaHeading({
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
    <header className={cn("lamsa-section-head", align === "center" && "text-center")}>
      <div className={cn("min-w-0", align === "center" && "mx-auto")}>
        {eyebrow ? <p className="lamsa-eyebrow">{eyebrow}</p> : null}
        <h2 className="lamsa-heading">{title}</h2>
        {subtitle ? <p className={cn("lamsa-subtitle", align === "center" && "mx-auto")}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function LamsaPrice({
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
      <span className={cn("lamsa-price font-bold text-[var(--lamsa-chocolate)]", large ? "text-2xl" : "text-base sm:text-lg")}>
        {formatSouqPrice(cents, lang, currency)}
      </span>
      {compareAtCents && compareAtCents > cents ? (
        <span className="lamsa-price text-xs text-[var(--lamsa-taupe)] line-through">
          {formatSouqPrice(compareAtCents, lang, currency)}
        </span>
      ) : null}
    </div>
  );
}

export function LamsaStars({ value, count }: { value: number | null; count?: number }) {
  if (value === null) return null;
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${value} من 5`}>
      <span className="flex gap-0.5 text-[var(--lamsa-gold)]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <LamsaIcon key={index} name="star" filled={index < rounded} className="h-3.5 w-3.5" />
        ))}
      </span>
      {count ? <span className="text-[11px] text-[var(--lamsa-muted)]">({count})</span> : null}
    </span>
  );
}

export function LamsaEmpty({ title, hint }: { title: string; hint?: string | null }) {
  return (
    <div className="rounded-[22px] border border-[var(--lamsa-border)] bg-[var(--lamsa-white)] px-5 py-14 text-center">
      <LamsaIcon name="image" className="mx-auto h-8 w-8 text-[var(--lamsa-taupe)]" />
      <p className="mt-3 font-semibold text-[var(--lamsa-ink)]">{title}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--lamsa-muted)]">{hint}</p> : null}
    </div>
  );
}
