"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

/** Soft-delete with confirmation dialog (never a hard delete from UI). */
export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function del() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/dashboard/products/${productId}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok) {
      const message = typeof data.error === "string" ? data.error : (data.error?.message ?? "Suppression impossible");
      setError(message);
      toast.error("Suppression impossible", message);
      return;
    }
    toast.success("Produit supprimé", `« ${productName} » est retiré de la boutique.`);
    router.push("/dashboard/produits");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button tone="dangerSoft" icon="trash" onClick={() => setConfirming(true)}>
        Supprimer le produit
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5">
      <p className="flex items-start gap-2 text-sm leading-6 font-medium text-red-800">
        <Icon name="alert" size={16} className="mt-1 shrink-0" />
        <span>
          Supprimer « <strong>{productName}</strong> » ? Il disparaîtra de la boutique, mais les
          commandes passées conservent leurs articles.
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button tone="danger" size="sm" disabled={busy} onClick={del} icon={busy ? undefined : "trash"}>
          {busy ? (<><Spinner size={14} /> Suppression…</>) : "Oui, supprimer"}
        </Button>
        <Button tone="secondary" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
