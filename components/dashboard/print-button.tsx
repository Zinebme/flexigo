"use client";

import { Icon } from "@/components/ui/icons";
import { btnSecondary, btnSm } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Prints the current screen (order sheet). Navigation, filters and action
 * buttons are hidden through the `.fx-no-print` rules in globals.css.
 */
export function PrintButton({ label = "Imprimer", className }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(btnSecondary, btnSm, "fx-no-print", className)}
      title="Imprimer cette fiche"
    >
      <Icon name="printer" size={15} />
      {label}
    </button>
  );
}
