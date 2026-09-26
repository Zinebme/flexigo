"use client";

import { useMemo, useState } from "react";
import {
  resolveSouqCheckoutSettings,
  type SouqCheckoutFieldKey,
  type SouqCheckoutSettingsInput,
} from "@/lib/storefront/souq/checkout-settings";

const FIELD_LABELS: Record<SouqCheckoutFieldKey, string> = {
  first_name: "Prénom / nom principal",
  last_name: "Nom de famille",
  phone: "Téléphone",
  email: "Email",
  wilaya: "Wilaya",
  commune: "Commune",
  address: "Adresse de livraison",
  office: "Bureau de livraison",
};

// The checkout API and order RPC require these values. Hiding them would make
// the public form impossible to submit, so they stay protected in the builder.
const REQUIRED_CORE = new Set<SouqCheckoutFieldKey>(["first_name", "phone", "wilaya", "commune"]);

interface Props {
  initial: unknown;
  onSave: (checkout: SouqCheckoutSettingsInput) => Promise<void>;
  title?: string;
}

export function CheckoutSettingsEditor({ initial, onSave, title = "Formulaire de commande" }: Props) {
  const resolved = useMemo(() => resolveSouqCheckoutSettings(initial), [initial]);
  const [fields, setFields] = useState(resolved.fields);
  const [showQuantity, setShowQuantity] = useState(resolved.showQuantity);
  const [showOffers, setShowOffers] = useState(resolved.showQuantityOffers);
  const [showDeliveryChoice, setShowDeliveryChoice] = useState(resolved.showDeliveryChoice);
  const [variantDisplay, setVariantDisplay] = useState(resolved.variantDisplay);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchField(key: SouqCheckoutFieldKey, patch: { enabled?: boolean; required?: boolean }) {
    setFields((current) => current.map((field) => field.key === key ? { ...field, ...patch } : field));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await onSave({
        fields: fields.map((field) => ({
          key: field.key,
          enabled: REQUIRED_CORE.has(field.key) ? true : field.enabled,
          required: REQUIRED_CORE.has(field.key) ? true : (field.enabled && field.required),
        })),
        show_quantity: showQuantity,
        show_quantity_offers: showOffers,
        show_delivery_choice: showDeliveryChoice,
        variant_display: variantDisplay,
        show_email_field: fields.find((field) => field.key === "email")?.enabled ?? false,
      });
      setMessage("Formulaire enregistré.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Affichez ou masquez les champs optionnels et choisissez ceux qui sont obligatoires. Les données indispensables à une commande valide restent protégées.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[1fr_88px_100px] gap-2 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span>Champ</span><span>Afficher</span><span>Obligatoire</span>
        </div>
        {fields.filter((field) => field.key !== "office").map((field) => {
          const locked = REQUIRED_CORE.has(field.key);
          return (
            <div key={field.key} className="grid grid-cols-[1fr_88px_100px] items-center gap-2 border-t border-slate-100 px-3 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-800">{FIELD_LABELS[field.key]}</span>
                {locked ? <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">requis par la commande</span> : null}
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={locked || field.enabled} disabled={locked} aria-label={`Afficher ${FIELD_LABELS[field.key]}`} onChange={(event) => patchField(field.key, { enabled: event.target.checked, required: event.target.checked ? field.required : false })} />
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={locked || (field.enabled && field.required)} disabled={locked || !field.enabled} aria-label={`Rendre obligatoire ${FIELD_LABELS[field.key]}`} onChange={(event) => patchField(field.key, { required: event.target.checked })} />
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showQuantity} onChange={(event) => setShowQuantity(event.target.checked)} />Afficher le sélecteur de quantité</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showOffers} onChange={(event) => setShowOffers(event.target.checked)} />Afficher les offres par quantité</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showDeliveryChoice} onChange={(event) => setShowDeliveryChoice(event.target.checked)} />Proposer les modes de livraison disponibles (bureau si l’API fournit une adresse)</label>
        <label className="text-sm font-medium text-slate-700">Présentation des variantes<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={variantDisplay} onChange={(event) => setVariantDisplay(event.target.value as typeof variantDisplay)}><option value="dynamic">Automatique selon le type</option><option value="buttons">Boutons</option><option value="dropdown">Liste déroulante</option></select></label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le formulaire"}</button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}
