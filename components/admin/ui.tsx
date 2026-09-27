"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";
import { Spinner } from "@/components/ui";

/**
 * Small interactive building blocks for the platform admin area
 * (client-side: buttons with size/variant, modal dialog, confirm dialog).
 * The violet accent keeps the platform area visually distinct from the
 * merchant dashboard (blue).
 */

export type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-violet-600 text-white shadow-sm hover:bg-violet-500 active:bg-violet-700",
  secondary: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

/**
 * Class string for admin buttons — exported so server pages can style
 * `<Link>` elements identically to `<Btn>`.
 */
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

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
  className = "",
  title,
  icon,
  busy,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
  icon?: IconName;
  busy?: boolean;
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled || busy}
      onClick={onClick}
      className={adminBtnCls(variant, size, className)}
    >
      {busy ? <Spinner size={size === "sm" ? 13 : 15} /> : icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fx-anim-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 pt-12 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fx-anim-pop w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-me-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
            aria-label="Fermer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fx-anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="fx-anim-pop w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              danger ? "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100" : "bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100",
            )}
          >
            <Icon name={danger ? "alert" : "info"} size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={() => void onConfirm()} busy={busy}>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}
