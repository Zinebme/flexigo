"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { Button, Field, Spinner, inputCls, selectCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { apiErrorMessage, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type EditableOrder = {
  id: string;
  full_name: string;
  phone: string;
  commune: string;
  address: string | null;
  office: string | null;
  delivery_type: string;
  status: string;
};

/**
 * Order editing — PATCH /api/dashboard/orders/[id].
 * Payload and validation are exactly the ones from the order-management branch
 * (full_name, phone, commune, address, office, status, note); only the markup
 * follows the new dashboard design system.
 */
export function OrderEditForm({ order }: { order: EditableOrder }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(order.full_name);
  const [phone, setPhone] = useState(order.phone);
  const [commune, setCommune] = useState(order.commune);
  const [address, setAddress] = useState(order.address ?? "");
  const [office, setOffice] = useState(order.office ?? "");
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          phone,
          commune,
          address: address || null,
          office: office || null,
          status,
          note,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string | { message?: string } };
      if (!res.ok) {
        toast.error(
          "Enregistrement impossible",
          apiErrorMessage(data, typeof data.error === "string" ? data.error : "Erreur inconnue"),
        );
        return;
      }
      setNote("");
      toast.success("Commande enregistrée", `${order.full_name} · ${ORDER_STATUS_LABELS[status as OrderStatus] ?? status}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Nom du client" htmlFor={`edit-name-${order.id}`}>
        <input
          id={`edit-name-${order.id}`}
          required
          minLength={2}
          maxLength={120}
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Téléphone" htmlFor={`edit-phone-${order.id}`}>
        <input
          id={`edit-phone-${order.id}`}
          required
          minLength={8}
          maxLength={24}
          className={cn(inputCls, "fx-num")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <Field label="Commune" htmlFor={`edit-commune-${order.id}`}>
        <input
          id={`edit-commune-${order.id}`}
          required
          minLength={2}
          maxLength={120}
          className={inputCls}
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
        />
      </Field>
      <Field label="Statut" htmlFor={`edit-status-${order.id}`}>
        <div className="relative">
          <select
            id={`edit-status-${order.id}`}
            className={selectCls}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value as OrderStatus]}
              </option>
            ))}
          </select>
        </div>
      </Field>

      {order.delivery_type === "home" ? (
        <Field label="Adresse de livraison" htmlFor={`edit-address-${order.id}`} className="sm:col-span-2">
          <input
            id={`edit-address-${order.id}`}
            maxLength={500}
            className={inputCls}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rue, quartier, point de repère…"
          />
        </Field>
      ) : null}

      {order.delivery_type === "office" ? (
        <Field
          label="Bureau de retrait confirmé"
          htmlFor={`edit-office-${order.id}`}
          className="sm:col-span-2"
          hint="Nom et adresse du bureau où le colis a été déposé."
        >
          <input
            id={`edit-office-${order.id}`}
            maxLength={120}
            className={inputCls}
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            placeholder="Nom et adresse du bureau"
          />
        </Field>
      ) : null}

      <Field
        label="Ajouter une note interne"
        htmlFor={`edit-note-${order.id}`}
        className="sm:col-span-2"
        hint={`${note.length}/2000 — ajoutée à l'historique, invisible pour le client.`}
      >
        <textarea
          id={`edit-note-${order.id}`}
          maxLength={2000}
          rows={2}
          className={cn(inputCls, "resize-y")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex : client joignable après 18 h…"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-2">
        <span className="me-auto inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Icon name="info" size={13} />
          Les modifications sont enregistrées immédiatement.
        </span>
        <Button type="submit" tone="primary" disabled={busy} icon={busy ? undefined : "check"}>
          {busy ? (
            <>
              <Spinner size={15} /> Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </form>
  );
}
