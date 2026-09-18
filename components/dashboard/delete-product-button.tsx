"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Soft-delete with confirmation dialog (never a hard delete from UI). */
export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
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
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Suppression impossible"));
      return;
    }
    router.push("/dashboard/produits");
  }

  if (!confirming) {
    return (
      <button
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
        onClick={() => setConfirming(true)}
      >
        Supprimer le produit
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="mb-3 text-sm font-medium text-red-700">
        Supprimer « {productName} » ? Il disparaîtra de la boutique (les commandes passées sont conservées).
      </p>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          onClick={del}
          disabled={busy}
        >
          {busy ? "Suppression…" : "Oui, supprimer"}
        </button>
        <button
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
          onClick={() => setConfirming(false)}
          disabled={busy}
        >
          Annuler
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
