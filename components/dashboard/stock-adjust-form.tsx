"use client";

import { useState } from "react";

/**
 * Stock adjustment with mandatory reason (audited server-side).
 * POST /api/dashboard/products/[id]/stock
 */
export function StockAdjustForm({ productId, currentStock, canAdjust }: { productId: string; currentStock: number; canAdjust: boolean }) {
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fetch(`/api/dashboard/products/${productId}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change: Number.parseInt(change, 10), reason: reason.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; stock?: number; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Mouvement impossible"));
      return;
    }
    setChange("");
    setReason("");
    setOkMsg(`Nouveau stock : ${data.stock}.`);
  }

  if (!canAdjust) return null;
  return (
    <form onSubmit={submit} className="grid gap-2 md:grid-cols-[110px_1fr_auto]">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Ajustement</label>
        <input
          type="number"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          placeholder="+5 / -2"
          value={change}
          onChange={(e) => setChange(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Raison (obligatoire, journalisée)</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          placeholder="Inventaire, casse, réception…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={3}
          maxLength={200}
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Enregistrement…" : "Appliquer"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600 md:col-span-3">{okMsg}</p>}
      <p className="text-xs text-slate-400 md:col-span-3">Stock actuel : {currentStock}</p>
    </form>
  );
}
