"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/types";
import {
  ORDER_STATUS_STAGE,
  ORDER_STAGE_LABELS,
  OrderStatusBadge,
  orderStatusLabel,
  statusDotClass,
  type OrderStage,
} from "@/components/order-status";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui";
import { apiErrorMessage, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Inline status picker for the order list: change a status without opening the
 * order (one click instead of three). Uses the existing
 * POST /api/dashboard/orders/[id] endpoint — permissions stay server-side.
 *
 * The popover is rendered with `position: fixed` so it is never clipped by the
 * table's horizontal scroll container.
 */

const STAGE_ORDER: OrderStage[] = ["todo", "delivery", "done", "problem"];
const MENU_WIDTH = 248;
const MENU_HEIGHT = 320; // must match the popover's max-h-80

export function OrderQuickStatus({
  orderId,
  status,
  canManage,
  orderNumber,
  size = "sm",
}: {
  orderId: string;
  status: string;
  canManage: boolean;
  orderNumber?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const roomBelow = window.innerHeight - rect.bottom;
    // Flip above the trigger when there is not enough room underneath.
    const top = roomBelow < MENU_HEIGHT + 12 ? Math.max(8, rect.top - MENU_HEIGHT - 6) : rect.bottom + 6;
    setPos({ top, left });
    setOpen(true);
  }

  async function change(next: string) {
    setOpen(false);
    if (next === status) return;
    setBusy(next);
    const res = await fetch(`/api/dashboard/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      toast.error("Statut non modifié", apiErrorMessage(data, "Erreur inconnue"));
      return;
    }
    toast.success(
      "Statut mis à jour",
      `${orderNumber ? `${orderNumber} → ` : ""}${orderStatusLabel(next)}`,
    );
    router.refresh();
  }

  if (!canManage) return <OrderStatusBadge status={status} size={size} />;

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Changer le statut"
        className={cn(
          "group inline-flex items-center gap-1 rounded-full pe-1.5 transition hover:ring-2 hover:ring-blue-500/20",
          busy && "opacity-60",
        )}
      >
        {busy ? <Spinner size={14} className="text-slate-500" /> : <OrderStatusBadge status={status} size={size} />}
        <Icon name="chevronDown" size={13} className="text-slate-400 transition group-hover:text-slate-600" />
      </button>

      {open && pos ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="fx-anim-pop fixed z-50 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 fx-scroll"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            role="menu"
          >
            {STAGE_ORDER.map((stage) => {
              const items = ORDER_STATUSES.filter((s) => ORDER_STATUS_STAGE[s] === stage);
              if (!items.length) return null;
              return (
                <div key={stage} className="mb-1 last:mb-0">
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {ORDER_STAGE_LABELS[stage]}
                  </div>
                  {items.map((s) => {
                    const active = s === status;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="menuitem"
                        onClick={() => void change(s)}
                        disabled={busy !== null}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-start text-sm transition disabled:opacity-50",
                          active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDotClass(s))} />
                        <span className="min-w-0 flex-1 truncate">{orderStatusLabel(s)}</span>
                        {active ? <Icon name="check" size={14} className="shrink-0 text-blue-600" strokeWidth={2.4} /> : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <div className="mt-1 border-t border-slate-100 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/dashboard/commandes/${orderId}`);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <Icon name="external" size={14} className="text-slate-400" />
                Ouvrir la fiche commande
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
