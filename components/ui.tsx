import Link from "next/link";
import { cn } from "../lib/utils";
import { Icon, type IconName } from "./ui/icons";

/**
 * Minimal, dependency-free UI kit for the dashboards (French SaaS).
 * Server-friendly: everything here is plain markup + Tailwind, so it can be
 * rendered from server components and reused inside client components.
 *
 * Visual language: calm slate neutrals, white surfaces, soft borders/shadows,
 * blue primary, consistent 36–40px control heights (Shopify/Stripe/Linear-ish).
 */

// ---------------------------------------------------------------------------
// Class tokens — shared by every form/button in the dashboards.
// ---------------------------------------------------------------------------

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const inputSmCls =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

export const selectCls = cn(inputCls, "fx-select cursor-pointer appearance-none pe-9");

export const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

export const hintCls = "mt-1.5 text-xs leading-5 text-slate-500";

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px";

export const btnPrimary = cn(
  btnBase,
  "bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
);
export const btnSecondary = cn(
  btnBase,
  "border border-slate-300 bg-white px-4 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100",
);
export const btnDanger = cn(
  btnBase,
  "bg-red-600 px-4 py-2.5 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
);
export const btnDangerSoft = cn(
  btnBase,
  "border border-red-200 bg-red-50 px-4 py-2.5 text-red-700 hover:bg-red-100 active:bg-red-200",
);
export const btnGhost = cn(btnBase, "px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900");
export const btnDark = cn(
  btnBase,
  "bg-slate-900 px-4 py-2.5 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950",
);
/** Compact sizes — for table rows, toolbars and dense cards. */
export const btnSm = "px-3 py-1.5 text-xs";
export const btnXs = "px-2 py-1 text-xs";
export const btnIconCls = cn(btnBase, "h-9 w-9 border border-slate-200 bg-white p-0 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900");

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonTone = "primary" | "secondary" | "ghost" | "danger" | "dangerSoft" | "dark";

const TONE_CLASS: Record<ButtonTone, string> = {
  primary: btnPrimary,
  secondary: btnSecondary,
  ghost: btnGhost,
  danger: btnDanger,
  dangerSoft: btnDangerSoft,
  dark: btnDark,
};

/**
 * One button to rule them all: renders a `<button>`, or a Next `<Link>` when
 * `href` is given (keeps keyboard/URL behaviour consistent everywhere).
 */
export function Button({
  children,
  href,
  onClick,
  tone = "secondary",
  size = "md",
  icon,
  iconRight,
  type = "button",
  disabled,
  loading,
  className,
  title,
  external,
  download,
}: {
  children?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: ButtonTone;
  size?: "xs" | "sm" | "md";
  icon?: IconName;
  iconRight?: IconName;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
  external?: boolean;
  download?: boolean;
}) {
  const classes = cn(
    TONE_CLASS[tone],
    size === "xs" ? btnXs : size === "sm" ? btnSm : "",
    className,
  );
  const iconSize = size === "md" ? 16 : 14;
  const content = (
    <>
      {loading ? <Spinner size={iconSize} /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" download={download} className={classes} title={title} aria-disabled={disabled}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} title={title} download={download} aria-disabled={disabled}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={classes} title={title}>
      {content}
    </button>
  );
}

/** Square icon-only action (tables, toolbars, headers). Always labelled for a11y. */
export function IconButton({
  icon,
  label,
  href,
  onClick,
  tone = "secondary",
  size = 36,
  disabled,
  external,
  className,
}: {
  icon: IconName;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "secondary" | "ghost" | "danger";
  size?: number;
  disabled?: boolean;
  external?: boolean;
  className?: string;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
    tone === "ghost"
      ? "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      : tone === "danger"
        ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
        : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900",
    className,
  );
  const style = { width: size, height: size };
  const inner = <Icon name={icon} size={Math.round(size * 0.46)} />;

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={classes} style={style}>
        {inner}
      </a>
    ) : (
      <Link href={href} aria-label={label} title={label} className={classes} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={classes} style={style}>
      {inner}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  children,
  backHref,
  backLabel,
  icon,
  eyebrow,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: IconName;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <Icon name="arrowLeft" size={14} />
            {backLabel ?? "Retour"}
          </Link>
        ) : null}
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 sm:flex">
              <Icon name={icon} size={20} />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</div> : null}
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]",
        hover && "transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/[0.06]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  children,
  icon,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  icon?: IconName;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3", className)}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  icon,
  href,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "primary";
  icon?: IconName;
  href?: string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-red-600",
    primary: "text-blue-600",
  };
  const iconTones: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    good: "bg-emerald-50 text-emerald-600",
    warn: "bg-amber-50 text-amber-600",
    bad: "bg-red-50 text-red-600",
    primary: "bg-blue-50 text-blue-600",
  };
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
        {icon ? (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconTones[tone])}>
            <Icon name={icon} size={18} />
          </span>
        ) : null}
      </div>
      <div className={cn("fx-num mt-2 text-2xl font-extrabold tracking-tight", tones[tone])}>{value}</div>
      {hint ? <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
          className,
        )}
      >
        {body}
      </Link>
    );
  }
  return <Card className={cn("p-5", className)}>{body}</Card>;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const badgeTones: Record<string, string> = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  slate: "bg-slate-800 text-white ring-slate-900",
};

const dotTones: Record<string, string> = {
  gray: "bg-slate-400",
  neutral: "bg-slate-400",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  slate: "bg-white",
};

export function Badge({
  children,
  tone = "gray",
  dot = false,
  icon,
  size = "md",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTones | string;
  dot?: boolean;
  icon?: IconName;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}) {
  const t = badgeTones[tone] ?? badgeTones.gray;
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        t,
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dotTones[tone] ?? dotTones.gray)} /> : null}
      {icon ? <Icon name={icon} size={size === "sm" ? 11 : 12} strokeWidth={2} /> : null}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function Table({
  head,
  children,
  className = "",
  sticky = false,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div className={cn("fx-scroll overflow-x-auto", sticky && "max-h-[70vh] overflow-y-auto")}>
      <table className={cn("w-full border-collapse text-sm", className)}>
        <thead className={cn(sticky && "sticky top-0 z-10")}>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {head}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
  align,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  title?: string;
}) {
  return (
    <th
      title={title}
      className={cn(
        "px-4 py-3 font-bold whitespace-nowrap",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
  title,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  title?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "",
        className,
      )}
      colSpan={colSpan}
      title={title}
    >
      {children}
    </td>
  );
}

/** Consistent hover treatment for table rows. */
export const rowCls = "fx-row hover:bg-slate-50/80";

// ---------------------------------------------------------------------------
// States: empty / loading / feedback
// ---------------------------------------------------------------------------

export function EmptyState({
  icon = "📭",
  title,
  text,
  action,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", compact ? "py-10" : "py-16")}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500 ring-1 ring-inset ring-slate-200">
        {icon}
      </div>
      <div className="mt-4 text-sm font-bold text-slate-800">{title}</div>
      {text ? <div className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{text}</div> : null}
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cn("fx-spin", className)} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("fx-skeleton rounded-lg", className)} style={style} aria-hidden="true" />;
}

/** Table placeholder shown by `loading.tsx` files while the server streams data. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-4 py-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className={cn("h-4 flex-1", i === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

type AlertStyle = { box: string; icon: IconName; text: string };

const ALERT_FALLBACK: AlertStyle = { box: "border-blue-200 bg-blue-50/70", icon: "info", text: "text-blue-800" };

const alertTones: Record<string, AlertStyle> = {
  info: { box: "border-blue-200 bg-blue-50/70", icon: "info", text: "text-blue-800" },
  success: { box: "border-emerald-200 bg-emerald-50/70", icon: "checkCircle", text: "text-emerald-800" },
  warning: { box: "border-amber-200 bg-amber-50/70", icon: "alert", text: "text-amber-800" },
  danger: { box: "border-red-200 bg-red-50/70", icon: "alert", text: "text-red-800" },
  neutral: { box: "border-slate-200 bg-slate-50", icon: "info", text: "text-slate-700" },
};

/** Inline banner: tips, errors, confirmations (replaces ad-hoc coloured boxes). */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  action,
  className,
}: {
  tone?: string;
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: IconName;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = alertTones[tone] ?? ALERT_FALLBACK;
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", t.box, className)} role={tone === "danger" ? "alert" : "status"}>
      <span className={cn("mt-0.5 shrink-0", t.text)}>
        <Icon name={icon ?? t.icon} size={17} />
      </span>
      <div className={cn("min-w-0 flex-1 text-sm leading-6", t.text)}>
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={cn(title ? "mt-0.5" : "", "opacity-90")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

/** CSS-only switch (no JS): works in server components and inside client forms. */
export function Switch({
  checked,
  label,
  description,
  disabled,
  name,
  onChange,
  defaultChecked,
}: {
  checked?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultChecked?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-slate-300 hover:bg-slate-50/60",
      )}
    >
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          name={name}
          onChange={onChange}
        />
        <span className="block h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-500/20" />
        <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4" />
      </span>
      {label || description ? (
        <span className="min-w-0">
          {label ? <span className="block text-sm font-semibold text-slate-800">{label}</span> : null}
          {description ? <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

/** Label + control wrapper with optional hint/error, for consistent form rhythm. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <Icon name="alert" size={12} /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  step,
  icon,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  step?: number;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
          {step ?? (icon ? <Icon name={icon} size={16} /> : null)}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** URL-driven pill tabs (server-rendered links → no JS needed, shareable). */
export function LinkTabs({
  items,
  className,
}: {
  items: Array<{ href: string; label: React.ReactNode; count?: number; active?: boolean }>;
  className?: string;
}) {
  return (
    <div className={cn("fx-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
            item.active
              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span
              className={cn(
                "fx-num rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                item.active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={cn("h-px w-full bg-slate-100", className)} />;
}

/** Label/value row used in the order & customer side panels. */
export function DataRow({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2", className)}>
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="min-w-0 text-end text-sm font-medium text-slate-800">{children}</dd>
    </div>
  );
}
