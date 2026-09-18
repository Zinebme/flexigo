"use client";

import { useState } from "react";

/**
 * Order status change (with optional note) → POST /api/dashboard/orders/[id].
 * Roles allowed: OWNER, MANAGER, ORDER_MANAGER (enforced server-side).
 */
export function StatusUpdateForm({ orderId, currentStatus, statuses, canChange, canNote }: {
  orderId: string;
  currentStatus: string;
  statuses: Array<{ value: string; label: string }>;
  canChange: boolean;
  canNote: boolean;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fetch(`/api/dashboard/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: note.trim() || undefined }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) setError(data.error ?? "Erreur inconnue");
    else {
      setNote("");
      setOkMsg("Statut mis à jour.");
    }
  }

  if (!canChange && !canNote) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {canChange && (
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
        {canNote && (
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
            placeholder="Note interne (optionnel)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          onClick={submit}
          disabled={busy || (!canChange && status === currentStatus && !note.trim())}
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
    </div>
  );
}
