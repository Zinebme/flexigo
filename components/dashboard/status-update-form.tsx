"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { Button, Spinner } from "@/components/ui";
import { apiErrorMessage, useToast } from "@/components/ui/toast";
import {
  ORDER_STAGE_LABELS,
  ORDER_STATUS_STAGE,
  orderStatusLabel,
  statusDotClass,
  type OrderStage,
} from "@/components/order-status";
import { cn } from "@/lib/utils";

/**
 * Order status change (with optional note) → POST /api/dashboard/orders/[id].
 * Roles allowed: OWNER, MANAGER, ORDER_MANAGER (enforced server-side).
 *
 * Same endpoint and payload as before, but the dropdown became grouped status
 * chips (one click instead of two), feedback moved to a toast, and the page is
 * refreshed so the badge/timeline never show stale data.
 *
 * The parent passes a `key` tied to the order's status/updated_at so the local
 * selection resets after each save without an effect.
 */

const STAGE_ORDER: OrderStage[] = ["todo", "delivery", "done", "problem"];
const NOTE_MAX = 2000;

export function StatusUpdateForm({
  orderId,
  currentStatus,
  statuses,
  canChange,
  canNote,
}: {
  orderId: string;
  currentStatus: string;
  statuses: Array<{ value: string; label: string }>;
  canChange: boolean;
  canNote: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!canChange && !canNote) return null;

  const changed = canChange && status !== currentStatus;
  const hasNote = note.trim().length > 0;
  const canSubmit = (changed || hasNote) && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    const res = await fetch(`/api/dashboard/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: changed ? status : undefined,
        note: hasNote ? note.trim() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast.error("Enregistrement impossible", apiErrorMessage(data, "Erreur inconnue"));
      return;
    }
    setNote("");
    toast.success(
      changed ? `Statut : ${orderStatusLabel(status)}` : "Note ajoutée",
      changed && hasNote ? "Note interne enregistrée." : undefined,
    );
    router.refresh();
  }

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    items: statuses.filter((s) => ORDER_STATUS_STAGE[s.value] === stage),
  })).filter((g) => g.items.length > 0);

  // Statuses whose stage is unknown still need to be reachable.
  const others = statuses.filter((s) => !ORDER_STATUS_STAGE[s.value]);

  return (
    <div className="space-y-4">
      {canChange ? (
        <div className="space-y-3">
          {grouped.map((group) => (
            <div key={group.stage}>
              <div className="mb-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {ORDER_STAGE_LABELS[group.stage]}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((s) => {
                  const selected = status === s.value;
                  const isCurrent = currentStatus === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        selected
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", selected ? "bg-white" : statusDotClass(s.value))} />
                      {s.label}
                      {isCurrent ? (
                        <span className={cn("ms-0.5 text-[10px] font-bold uppercase", selected ? "text-white/70" : "text-slate-400")}>
                          actuel
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {others.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {others.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  aria-pressed={status === s.value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    status === s.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {canNote ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor={`note-${orderId}`} className="text-sm font-semibold text-slate-700">
              Note interne
            </label>
            <span className={cn("fx-num text-xs", note.length > NOTE_MAX * 0.9 ? "text-amber-600" : "text-slate-400")}>
              {note.length}/{NOTE_MAX}
            </span>
          </div>
          <textarea
            id={`note-${orderId}`}
            rows={2}
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Appel client, précision livraison, accord commercial… (horodaté et signé automatiquement)"
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button tone="primary" onClick={() => void submit()} disabled={!canSubmit} icon={busy ? undefined : "check"}>
          {busy ? (
            <>
              <Spinner size={15} /> Enregistrement…
            </>
          ) : changed ? (
            `Enregistrer « ${orderStatusLabel(status)} »`
          ) : (
            "Enregistrer"
          )}
        </Button>
        {changed ? (
          <button
            type="button"
            onClick={() => setStatus(currentStatus)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <Icon name="refresh" size={13} />
            Annuler le changement
          </button>
        ) : null}
        {!changed && !hasNote ? (
          <span className="text-xs text-slate-400">Choisissez un nouveau statut ou ajoutez une note.</span>
        ) : null}
      </div>
    </div>
  );
}
