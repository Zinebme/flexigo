"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { orderStatusSelectTone } from "./order-status";

export function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function update(next: string) {
    setStatus(next);
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || "Statut non enregistré");
      router.refresh();
      setSaved(true);
    } catch (e) {
      setStatus(currentStatus);
      setError(e instanceof Error ? e.message : "Statut non enregistré");
    } finally { setBusy(false); }
  }

  return <div><select aria-label={`Statut de la commande ${orderId}`} className={`max-w-full rounded-lg border px-2.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50 ${orderStatusSelectTone(status)}`} value={status} disabled={busy} onChange={(e) => void update(e.target.value)}>
    {ORDER_STATUSES.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value as OrderStatus]}</option>)}
  </select>{busy && <span role="status" className="ml-2 text-xs text-slate-500">Enregistrement…</span>}{saved && !busy && <span role="status" className="ml-2 text-xs text-emerald-700">Enregistré</span>}{error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}
