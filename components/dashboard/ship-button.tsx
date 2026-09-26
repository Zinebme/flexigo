"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Envoyer au transporteur" — creates a shipment via the store's active
 * provider (mock/manual). POST /api/dashboard/orders/[id]/ship.
 */
export function ShipButton({ orderId, providerKey, enabled, compact = false }: { orderId: string; providerKey: string; enabled: boolean; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function ship() {
    setError(null);
    setOkMsg(null);
    setBusy(true);
    const res = await fetch(`/api/dashboard/orders/${orderId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; tracking_number?: string };
    setBusy(false);
    if (!res.ok) setError(data.error ?? "Erreur inconnue");
    else { setOkMsg(`Étiquette créée${data.tracking_number ? ` — n° ${data.tracking_number}` : ""}.`); router.refresh(); }
  }

  if (!enabled) return null;
  return (
    <div className="space-y-2">
      <button
        className={compact ? "rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50" : "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"}
        onClick={ship}
        disabled={busy}
      >
        {busy ? "Envoi…" : compact ? "🚚 Transporteur" : `🚚 Envoyer au transporteur (${providerKey})`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
    </div>
  );
}
