"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Spinner, inputCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const QUICK_CHANGES = [1, 5, 10, -1, -5];

/**
 * Stock adjustment with mandatory reason (audited server-side).
 * POST /api/dashboard/products/[id]/stock
 */
export function StockAdjustForm({ productId, currentStock, canAdjust }: { productId: string; currentStock: number; canAdjust: boolean }) {
  const router = useRouter();
  const toast = useToast();
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
      const message = typeof data.error === "string" ? data.error : (data.error?.message ?? "Mouvement impossible");
      setError(message);
      toast.error("Mouvement impossible", message);
      return;
    }
    setChange("");
    setReason("");
    setOkMsg(`Nouveau stock : ${data.stock}.`);
    toast.success("Stock mis à jour", `Nouveau stock : ${data.stock}`);
    router.refresh();
  }

  if (!canAdjust) return null;

  const delta = Number.parseInt(change, 10);
  const preview = Number.isFinite(delta) ? currentStock + delta : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[150px_minmax(0,1fr)_auto] md:items-end">
        <Field label="Mouvement" htmlFor={`stock-change-${productId}`} hint="Ex : +5 ou -2">
          <input
            id={`stock-change-${productId}`}
            type="number"
            className={cn(inputCls, "fx-num")}
            placeholder="+5 / -2"
            value={change}
            onChange={(e) => setChange(e.target.value)}
            required
          />
        </Field>
        <Field label="Raison" htmlFor={`stock-reason-${productId}`} hint="Obligatoire et journalisée (audit).">
          <input
            id={`stock-reason-${productId}`}
            className={inputCls}
            placeholder="Inventaire, casse, réception fournisseur…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
            maxLength={200}
          />
        </Field>
        <Button type="submit" tone="dark" disabled={busy} icon={busy ? undefined : "check"} className="md:mb-0.5">
          {busy ? (<><Spinner size={15} /> Application…</>) : "Appliquer"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-xs font-semibold text-slate-400">Rapide :</span>
        {QUICK_CHANGES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setChange(String(value))}
            className={cn(
              "fx-num rounded-lg border px-2.5 py-1 text-xs font-bold transition",
              change === String(value)
                ? "border-slate-900 bg-slate-900 text-white"
                : value < 0
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
            )}
          >
            {value > 0 ? `+${value}` : value}
          </button>
        ))}
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-red-600"><Icon name="alert" size={14} />{error}</p>
      ) : null}
      {okMsg && !error ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Icon name="checkCircle" size={14} />{okMsg}</p>
      ) : null}

      <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Stock actuel : <strong className="fx-num text-slate-800">{currentStock}</strong></span>
        {preview != null && preview !== currentStock ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            <Icon name="arrowRight" size={12} />
            après : <strong className="fx-num">{preview}</strong>
          </span>
        ) : null}
      </p>
    </form>
  );
}
