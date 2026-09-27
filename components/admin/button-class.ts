import { cn } from "@/lib/utils";

export type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-violet-600 text-white shadow-sm hover:bg-violet-500 active:bg-violet-700",
  secondary: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

/** Shared button classes for server pages and client components. */
export function adminBtnCls(variant: BtnVariant = "primary", size: "sm" | "md" = "md", extra = "") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
    "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
    VARIANTS[variant],
    extra,
  );
}
