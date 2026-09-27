"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, inputCls } from "@/components/ui";
import { apiErrorMessage, useToast } from "@/components/ui/toast";

/**
 * "Envoyer au transporteur" — creates a shipment via the store's active
 * provider (mock/manual). POST /api/dashboard/orders/[id]/ship.
 *
 * Kept from the order-management branch: `compact` mode for the orders table,
 * the optional manual tracking number (sent as `tracking_number`) and the
 * `router.refresh()` so the shipment/tracking panel shows up immediately.
 * Feedback goes through a toast instead of inline text.
 */
export function ShipButton({
  orderId,
  providerKey,
  enabled,
  compact = false,
}: {
  orderId: string;
  providerKey: string;
  enabled: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState("");
  const manual = providerKey === "manual";

  async function ship() {
    setBusy(true);
    const res = await fetch(`/api/dashboard/orders/${orderId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manual && tracking.trim() ? { tracking_number: tracking.trim() } : {}),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; tracking_number?: string };
    setBusy(false);
    if (!res.ok) {
      toast.error("Envoi impossible", apiErrorMessage(data, "Erreur inconnue"));
      return;
    }
    toast.success(
      manual ? "Expédition enregistrée" : "Colis transmis au transporteur",
      data.tracking_number ? `Numéro de suivi : ${data.tracking_number}` : undefined,
    );
    router.refresh();
  }

  if (!enabled) return null;

  if (compact) {
    return (
      <Button
        tone="primary"
        size="sm"
        icon={busy ? undefined : "truck"}
        disabled={busy}
        onClick={() => void ship()}
      >
        {busy ? <Spinner size={14} /> : manual ? "Expédier" : "Transporteur"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {manual ? (
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Numéro de suivi (facultatif)</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            maxLength={120}
            placeholder="À renseigner après dépôt"
            className={`${inputCls} mt-1 w-full`}
          />
        </label>
      ) : null}
      <Button
        tone="primary"
        className="w-full"
        icon={busy ? undefined : "truck"}
        disabled={busy}
        onClick={() => void ship()}
      >
        {busy ? (
          <>
            <Spinner size={15} /> Envoi en cours…
          </>
        ) : manual ? (
          "Marquer comme expédiée"
        ) : (
          `Envoyer via ${providerKey}`
        )}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Transporteur configuré : <span className="font-semibold text-slate-600">{providerKey}</span>
      </p>
    </div>
  );
}
