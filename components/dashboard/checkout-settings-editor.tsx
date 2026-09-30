"use client";

import { useMemo, useState } from "react";
import {
  resolveSouqCheckoutSettings,
  type SouqFormSection,
  type SouqCustomField,
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
const SECTION_LABELS: Record<SouqFormSection, string> = {
  offers: "Offres", contact: "Coordonnées", delivery: "Livraison", quantity: "Quantité",
  options: "Variantes et choix", custom: "Champs personnalisés", summary: "Récapitulatif",
};

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
  const [sectionOrder, setSectionOrder] = useState(resolved.sectionOrder);
  const [customFields, setCustomFields] = useState(resolved.customFields);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchField(key: SouqCheckoutFieldKey, patch: { enabled?: boolean; required?: boolean }) {
    setFields((current) => current.map((field) => field.key === key ? { ...field, ...patch } : field));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSectionOrder((current) => {
      const next = [...current];
      const other = index + direction;
      if (other < 0 || other >= next.length) return current;
      const moved = next[index]!;
      next[index] = next[other]!;
      next[other] = moved;
      return next;
    });
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((current) => {
      const next = [...current];
      const other = index + direction;
      if (other < 0 || other >= next.length) return current;
      const moved = next[index]!;
      next[index] = next[other]!;
      next[other] = moved;
      return next;
    });
  }

  function patchCustom(id: string, patch: Partial<SouqCustomField>) {
    setCustomFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field));
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
        section_order: sectionOrder,
        custom_fields: customFields.map((field) => ({ ...field, label: field.label.trim(), options: field.type === "choice" ? [...new Set(field.options.map((option) => option.trim()).filter(Boolean))] : [] })),
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

      <div className="rounded-xl border border-slate-200 p-4">
        <h4 className="font-semibold text-slate-900">Ordre du formulaire</h4>
        <p className="mt-1 text-xs text-slate-500">Déplacez les blocs affichés dans la commande. Le bouton de confirmation reste à la fin.</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {sectionOrder.map((section, index) => (
            <li key={section} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span>{index + 1}. {SECTION_LABELS[section]}</span>
              <span className="flex gap-1">
                <button type="button" aria-label={`Monter ${SECTION_LABELS[section]}`} disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded border px-2 py-1 disabled:opacity-40">↑</button>
                <button type="button" aria-label={`Descendre ${SECTION_LABELS[section]}`} disabled={index === sectionOrder.length - 1} onClick={() => moveSection(index, 1)} className="rounded border px-2 py-1 disabled:opacity-40">↓</button>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[1fr_76px_88px_100px] gap-2 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span>Champ</span><span>Ordre</span><span>Afficher</span><span>Obligatoire</span>
        </div>
        {fields.map((field, index) => {
          const locked = REQUIRED_CORE.has(field.key) || field.key === "office";
          return (
            <div key={field.key} className="grid grid-cols-[1fr_76px_88px_100px] items-center gap-2 border-t border-slate-100 px-3 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-800">{FIELD_LABELS[field.key]}</span>
                {locked ? <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">requis par la commande</span> : null}
              </div>
              <span className="flex gap-1">
                <button type="button" aria-label={`Monter ${FIELD_LABELS[field.key]}`} disabled={index === 0} onClick={() => moveField(index, -1)} className="rounded border px-2 py-1 disabled:opacity-40">↑</button>
                <button type="button" aria-label={`Descendre ${FIELD_LABELS[field.key]}`} disabled={index === fields.length - 1} onClick={() => moveField(index, 1)} className="rounded border px-2 py-1 disabled:opacity-40">↓</button>
              </span>
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={locked || field.enabled} disabled={locked} aria-label={`Afficher ${FIELD_LABELS[field.key]}`} onChange={(event) => patchField(field.key, { enabled: event.target.checked, required: event.target.checked ? field.required : false })} />
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={locked || (field.enabled && field.required)} disabled={locked || !field.enabled} aria-label={`Rendre obligatoire ${FIELD_LABELS[field.key]}`} onChange={(event) => patchField(field.key, { required: event.target.checked })} />
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showQuantity} onChange={(event) => setShowQuantity(event.target.checked)} />Afficher le sélecteur de quantité</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showOffers} onChange={(event) => setShowOffers(event.target.checked)} />Afficher les offres par quantité</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showDeliveryChoice} onChange={(event) => setShowDeliveryChoice(event.target.checked)} />Proposer le choix domicile ou bureau selon les tarifs configurés</label>
        <label className="text-sm font-medium text-slate-700">Présentation des variantes<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={variantDisplay} onChange={(event) => setVariantDisplay(event.target.value as typeof variantDisplay)}><option value="dynamic">Automatique selon le type</option><option value="buttons">Boutons</option><option value="dropdown">Liste déroulante</option></select></label>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <div><h4 className="font-semibold text-slate-900">Champs personnalisés</h4><p className="text-xs text-slate-500">Texte ou choix unique. Les réponses figurent dans les notes de la commande.</p></div>
          <button type="button" disabled={customFields.length >= 12} className="rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-700 disabled:opacity-40" onClick={() => setCustomFields((current) => [...current, { id: `f_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`, label: "Nouveau champ", type: "text", options: [], enabled: true, required: false }])}>+ Ajouter</button>
        </div>
        <div className="mt-3 space-y-3">
          {customFields.map((field) => <div key={field.id} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm sm:grid-cols-2">
            <label>Libellé<input className="mt-1 w-full rounded border p-2" maxLength={80} required value={field.label} onChange={(event) => patchCustom(field.id, { label: event.target.value })} /></label>
            <label>Type<select className="mt-1 w-full rounded border p-2" value={field.type} onChange={(event) => patchCustom(field.id, { type: event.target.value as SouqCustomField["type"] })}><option value="text">Texte</option><option value="choice">Boutons de choix</option></select></label>
            {field.type === "choice" ? <label className="sm:col-span-2">Choix (un par ligne)<textarea className="mt-1 w-full rounded border p-2" rows={3} value={field.options.join("\n")} onChange={(event) => patchCustom(field.id, { options: event.target.value.split("\n").slice(0, 20) })} /></label> : null}
            <label className="flex items-center gap-2"><input type="checkbox" checked={field.enabled} onChange={(event) => patchCustom(field.id, { enabled: event.target.checked })} /> Visible</label>
            <label className="flex items-center gap-2"><input type="checkbox" disabled={!field.enabled} checked={field.enabled && field.required} onChange={(event) => patchCustom(field.id, { required: event.target.checked })} /> Obligatoire</label>
            <button type="button" className="justify-self-start text-red-600" onClick={() => setCustomFields((current) => current.filter((item) => item.id !== field.id))}>Supprimer ce champ</button>
          </div>)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le formulaire"}</button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}
