/**
 * SOUQ — presentational primitives (server + client safe, no hooks).
 *
 * Kept deliberately small: every other SOUQ component composes these so the
 * visual language stays consistent (rounded cards, navy structure, amber
 * accent, RTL-correct icon placement).
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import type { StoreLanguage } from "@/lib/types";

// ---------------------------------------------------------------------------
// Icons — inline SVG (no icon library, no extra JS payload)
// ---------------------------------------------------------------------------

export type SouqIconName =
  | "search"
  | "menu"
  | "close"
  | "chevron"
  | "chevron-left"
  | "chevron-right"
  | "cart"
  | "truck"
  | "office"
  | "cash"
  | "shield"
  | "headset"
  | "star"
  | "check"
  | "plus"
  | "minus"
  | "whatsapp"
  | "phone"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "spark"
  | "grid"
  | "arrow-left"
  | "image";

const PATHS: Record<SouqIconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </>
  ),
  cart: (
    <>
      <path d="M4 5h2l2.4 10.2a2 2 0 002 1.6h7.8a2 2 0 002-1.6L21 8H7" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </>
  ),
  office: (
    <>
      <path d="M4 20V6a1 1 0 011-1h8a1 1 0 011 1v14" />
      <path d="M14 10h5a1 1 0 011 1v9" />
      <path d="M7 9h3M7 13h3M17 14h1" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  headset: (
    <>
      <path d="M5 13v-1a7 7 0 0114 0v1" />
      <path d="M5 13h3v5H6a1 1 0 01-1-1z" />
      <path d="M19 13h-3v5h2a1 1 0 001-1z" />
      <path d="M16 19a3 3 0 01-3 2h-1" />
    </>
  ),
  star: <path d="M12 4l2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  whatsapp: (
    <>
      <path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.3A9 9 0 1012 3z" />
      <path d="M9.5 9.2c0 3 2.3 5.3 5.3 5.3.5 0 1-.4 1-.9v-.9l-1.6-.6-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-.6-1.6h-.9c-.5 0-1 .4-1 1z" />
    </>
  ),
  phone: <path d="M7 3h3l1.5 4-2 1.4a12 12 0 005.1 5.1l1.4-2 4 1.5v3a2 2 0 01-2.2 2A16.5 16.5 0 015 5.2 2 2 0 017 3z" />,
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M16.8 7.4h.01" />
    </>
  ),
  facebook: <path d="M14.5 8.5H16V5.8h-2a3.5 3.5 0 00-3.5 3.5v1.6H9v2.7h1.5V21h3v-7.4h2l.5-2.7h-2.5V9.6c0-.6.5-1.1 1-1.1z" />,
  tiktok: (
    <>
      <path d="M14 4v9.5a3.5 3.5 0 11-3.5-3.5" />
      <path d="M14 4c.5 2 2 3.4 4 3.6" />
    </>
  ),
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M5 17l4.5-4.5L14 17l2.5-2.5L20 18" />
    </>
  ),
};

export function SouqIcon({
  name,
  className = "h-5 w-5",
  filled = false,
  title,
}: {
  name: SouqIconName;
  className?: string;
  filled?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

/** Chevron that mirrors automatically in RTL (‹ becomes ›). */
export function SouqDirChevron({ direction = "forward", className = "h-4 w-4" }: { direction?: "forward" | "back"; className?: string }) {
  return <SouqIcon name={direction === "forward" ? "chevron-left" : "chevron-right"} className={`${className} rtl:rotate-0 ltr:rotate-180`} />;
}

// ---------------------------------------------------------------------------
// Layout + typography
// ---------------------------------------------------------------------------

export function SouqContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("souq-container", className)}>{children}</div>;
}

export function SouqSectionHeading({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string | null;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4 sm:mb-7", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--souq-primary)] sm:text-2xl">
          <span className="inline-block h-5 w-1.5 shrink-0 rounded-full bg-[var(--souq-accent)]" aria-hidden="true" />
          <span className="truncate">{title}</span>
        </h2>
        {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SouqBadge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "primary" | "success" | "danger" | "soft";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    accent: "bg-[var(--souq-accent)] text-[var(--souq-accent-text)]",
    primary: "bg-[var(--souq-primary)] text-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    soft: "bg-[var(--souq-accent-soft)] text-[var(--souq-primary)]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Anchor styled as a SOUQ button (works without JS, honours RTL). */
export function SouqButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "accent" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: SouqIconName;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const sizes = {
    sm: "px-3.5 py-2 text-[13px] rounded-[12px]",
    md: "px-4 py-2.5 text-sm rounded-[14px]",
    lg: "px-5 py-3.5 text-base rounded-[16px]",
  };
  const variants = {
    primary: "bg-[var(--souq-primary)] text-white hover:bg-[color-mix(in_srgb,var(--souq-primary)_88%,black)]",
    accent: "bg-[var(--souq-accent)] text-[var(--souq-accent-text)] hover:bg-[var(--souq-accent-hover)] shadow-[0_10px_24px_-14px_rgb(245_158_11_/_0.9)]",
    outline: "border border-[var(--souq-border)] bg-white text-[var(--souq-primary)] hover:border-[var(--souq-primary)]",
    ghost: "text-[var(--souq-primary)] hover:bg-[var(--souq-primary-soft)]",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
  };
  return (
    <a
      href={href}
      className={cn("souq-press inline-flex items-center justify-center gap-2 font-bold", sizes[size], variants[variant], className)}
      {...rest}
    >
      {icon ? <SouqIcon name={icon} className="h-[18px] w-[18px]" /> : null}
      <span>{children}</span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Commerce atoms
// ---------------------------------------------------------------------------

export function SouqPrice({
  cents,
  compareAtCents = null,
  lang = "ar",
  size = "md",
  currency = "DZD",
  className = "",
}: {
  cents: number;
  compareAtCents?: number | null;
  lang?: StoreLanguage | string | null;
  size?: "sm" | "md" | "lg" | "xl";
  currency?: string;
  className?: string;
}) {
  const sizes = {
    sm: "text-sm font-extrabold",
    md: "text-base font-extrabold",
    lg: "text-xl font-extrabold sm:text-2xl",
    xl: "text-2xl font-extrabold sm:text-3xl",
  };
  const hasCompare = Boolean(compareAtCents && compareAtCents > cents);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("souq-price text-[var(--souq-primary)]", sizes[size])}>{formatSouqPrice(cents, lang, currency)}</span>
      {hasCompare ? (
        <span className="souq-price text-xs text-slate-400 line-through">{formatSouqPrice(compareAtCents as number, lang, currency)}</span>
      ) : null}
    </div>
  );
}

export function SouqStars({ value, count = 0, className = "" }: { value: number | null; count?: number; className?: string }) {
  if (value === null || value <= 0) return null;
  const rounded = Math.round(value);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <SouqIcon
            key={star}
            name="star"
            filled
            className={cn("h-3.5 w-3.5", star <= rounded ? "text-amber-400" : "text-slate-200")}
          />
        ))}
      </span>
      <span className="text-[11px] font-semibold text-slate-500" dir="ltr">
        {value.toFixed(1)}
        {count > 0 ? ` (${count})` : ""}
      </span>
    </div>
  );
}

export function SouqTrustStrip({
  items,
  className = "",
}: {
  items: Array<{ icon: SouqIconName; label: string }>;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 rounded-[14px] border border-[var(--souq-border)] bg-white px-3 py-2.5 text-[12px] font-bold text-slate-700"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]">
            <SouqIcon name={item.icon} className="h-4 w-4" />
          </span>
          <span className="min-w-0 leading-tight">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SouqEmptyState({
  title,
  hint,
  icon = "grid",
}: {
  title: string;
  hint?: string | null;
  icon?: SouqIconName;
}) {
  return (
    <div className="souq-card flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SouqIcon name={icon} className="h-6 w-6" />
      </span>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {hint ? <p className="max-w-md text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/** Placeholder used when a product has no image at all. */
export function SouqImageFallback({ className = "" }: { className?: string }) {
  return (
    <div
      data-souq-fallback="true"
      className={cn("flex h-full w-full items-center justify-center bg-slate-100 text-slate-300", className)}
      aria-hidden="true"
    >
      <SouqIcon name="image" className="h-10 w-10" />
    </div>
  );
}
