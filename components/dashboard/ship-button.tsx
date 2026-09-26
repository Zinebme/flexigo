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
  const [tracking, setTracking] = useState("");
  const manual = providerKey === "manual";

  async function ship() {
    setError(null);
    setOkMsg(null);
    setBusy(true);
    const res = await fetch(`/api/dashboard/orders/${orderId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manual && tracking.trim() ? { tracking_number: tracking.trim() } : {}),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; tracking_number?: string };
    setBusy(false);
    if (!res.ok) setError(data.error ?? "Erreur inconnue");
    else { setOkMsg(`${manual ? "Expédition enregistrée" : "Envoi créé"}${data.tracking_number ? ` — n° ${data.tracking_number}` : ""}.`); router.refresh(); }
  }

  if (!enabled) return null;
  return (
    <div className="space-y-2">
      {manual && !compact && <label className="block text-sm font-medium text-slate-700">Numéro de suivi (facultatif)<input value={tracking} onChange={e => setTracking(e.target.value)} maxLength={120} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="À renseigner après dépôt" /></label>}
      <button
        className={compact ? "rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50" : "rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"}
        onClick={ship}
        disabled={busy}
      >
        {busy ? "Enregistrement…" : compact ? manual ? "🚚 Expédier" : "🚚 Transporteur" : manual ? "Marquer comme expédiée" : `Envoyer via ${providerKey}`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
    </div>
  );
}
