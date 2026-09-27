"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Spinner } from "@/components/ui";
import { apiErrorMessage, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Publish / unpublish a product straight from the list — no need to open the
 * form for a one-field change. Reuses PUT /api/dashboard/products/[id], which
 * only patches the keys it receives (capability checked server-side).
 */
export function ProductVisibilityToggle({
  productId,
  name,
  isActive,
  canManage,
}: {
  productId: string;
  name: string;
  isActive: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState(isActive);
  const [busy, setBusy] = useState(false);

  if (!canManage) {
    return (
      <Badge tone={isActive ? "green" : "gray"} dot size="sm">
        {isActive ? "Actif" : "Masqué"}
      </Badge>
    );
  }

  async function toggle() {
    const next = !state;
    setState(next); // optimistic
    setBusy(true);
    const res = await fetch(`/api/dashboard/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setState(!next); // rollback
      toast.error("Modification impossible", apiErrorMessage(data, "Le produit n'a pas pu être mis à jour."));
      return;
    }
    toast.success(next ? "Produit publié" : "Produit masqué de la boutique", name);
    router.refresh();
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={state}
      aria-label={state ? `Masquer ${name}` : `Publier ${name}`}
      title={state ? "Visible sur la boutique — cliquer pour masquer" : "Masqué — cliquer pour publier"}
      onClick={() => void toggle()}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1 pe-2.5 ps-1 text-xs font-semibold transition disabled:opacity-60",
        state ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
      )}
    >
      <span
        className={cn(
          "relative flex h-5 w-9 shrink-0 items-center rounded-full transition",
          state ? "bg-emerald-500" : "bg-slate-300",
        )}
      >
        {busy ? (
          <Spinner size={12} className="ms-1 text-white" />
        ) : (
          <span
            className={cn(
              "absolute h-4 w-4 rounded-full bg-white shadow-sm transition-all",
              state ? "start-[18px]" : "start-0.5",
            )}
          />
        )}
      </span>
      {state ? "Actif" : "Masqué"}
    </button>
  );
}
