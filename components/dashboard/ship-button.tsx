"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { apiErrorMessage, useToast } from "@/components/ui/toast";

/**
 * "Envoyer au transporteur" — creates a shipment via the store's active
 * provider (mock/manual). POST /api/dashboard/orders/[id]/ship.
 * Same endpoint/payload as before; feedback now goes through a toast and the
 * page refreshes so the tracking panel appears immediately.
 */
export function ShipButton({
  orderId,
  providerKey,
  enabled,
  full = true,
}: {
  orderId: string;
  providerKey: string;
  enabled: boolean;
  full?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function ship() {
    setBusy(true);
    const res = await fetch(`/api/dashboard/orders/${orderId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; tracking_number?: string };
    setBusy(false);
    if (!res.ok) {
      toast.error("Envoi impossible", apiErrorMessage(data, "Erreur inconnue"));
      return;
    }
    toast.success(
      "Colis transmis au transporteur",
      data.tracking_number ? `Numéro de suivi : ${data.tracking_number}` : undefined,
    );
    router.refresh();
  }

  if (!enabled) return null;

  return (
    <div>
      <Button tone="primary" onClick={() => void ship()} disabled={busy} className={full ? "w-full" : ""} icon={busy ? undefined : "truck"}>
        {busy ? (
          <>
            <Spinner size={15} /> Envoi au transporteur…
          </>
        ) : (
          "Envoyer au transporteur"
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">
        Transporteur configuré : <span className="font-semibold text-slate-600">{providerKey}</span>
      </p>
    </div>
  );
}
