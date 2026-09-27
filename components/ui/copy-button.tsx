"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

/**
 * Click-to-copy button (order number, phone, tracking reference…).
 * Small quality-of-life win: no more selecting text inside a table cell.
 */
export function CopyButton({
  value,
  label,
  toastTitle,
  className,
  size = 14,
}: {
  value: string;
  label?: string;
  toastTitle?: string;
  className?: string;
  size?: number;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for non-secure contexts.
        const el = document.createElement("textarea");
        el.value = value;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success(toastTitle ?? "Copié", value);
    } catch {
      toast.error("Copie impossible", "Sélectionnez la valeur manuellement.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={label ? `Copier ${label}` : "Copier"}
      aria-label={label ? `Copier ${label}` : "Copier"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700",
        copied && "text-emerald-600",
        className,
      )}
    >
      <Icon name={copied ? "check" : "copy"} size={size} strokeWidth={copied ? 2.4 : 1.75} />
    </button>
  );
}
