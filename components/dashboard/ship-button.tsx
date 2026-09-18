"use client";

import { useState } from "react";

/**
 * "Envoyer au transporteur" — creates a shipment via the store's active
 * provider (mock/manual). POST /api/dashboard/orders/[id]/ship.
 */
export function ShipButton({ orderId, providerKey, enabled }: { orderId: string; providerKey: string; enabled: boolean }) {
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
    else setOkMsg(`Étiquette créée${data.tracking_number ? ` — n° ${data.tracking_number}` : ""}.`);
  }

  if (!enabled) return null;
  return (
    <div className="space-y-2">
      <button
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        onClick={ship}
        disabled={busy}
      >
        {busy ? "Envoi…" : `🚚 Envoyer au transporteur (${providerKey})`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
    </div>
  );
}
