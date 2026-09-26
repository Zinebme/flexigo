"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface MerchantCarrier { key: string; label: string; isActive: boolean; automatic: boolean; officeLookup: boolean }

export function ShippingModeSelector({ manualActive, carriers, canManage, manualContent }: {
  manualActive: boolean; carriers: MerchantCarrier[]; canManage: boolean; manualContent: React.ReactNode;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"manual" | "api">(manualActive ? "manual" : "api");
  const [selectedCarrier, setSelectedCarrier] = useState(carriers[0]?.key ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectMode(providerKey: string) {
    setSaving(providerKey); setError(null);
    try {
      const res = await fetch("/api/dashboard/integrations/shipping", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider_key: providerKey }) });
      const data = (await res.json().catch(() => null)) as { error?: string | { message?: string } } | null;
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : data?.error?.message ?? "Impossible de changer le mode de livraison.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de connexion."); }
    finally { setSaving(null); }
  }

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 pt-5">
      <h2 className="text-lg font-bold text-slate-900">Mode de livraison</h2>
      <p className="mt-1 text-sm text-slate-500">Choisissez comment préparer les expéditions de votre boutique.</p>
      <div className="mt-5 flex gap-2" role="tablist" aria-label="Modes de livraison">
        <button type="button" role="tab" aria-selected={tab === "manual"} onClick={() => setTab("manual")}
          className={`rounded-t-xl px-5 py-3 text-sm font-semibold ${tab === "manual" ? "border-b-2 border-rose-500 bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-slate-50"}`}>Livraison manuelle</button>
        <button type="button" role="tab" aria-selected={tab === "api"} onClick={() => setTab("api")}
          className={`rounded-t-xl px-5 py-3 text-sm font-semibold ${tab === "api" ? "border-b-2 border-rose-500 bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-slate-50"}`}>Société connectée {carriers.length ? `(${carriers.length})` : ""}</button>
      </div>
    </div>
    <div className="p-5" role="tabpanel">
      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {tab === "manual" ? <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
          <div><div className="font-semibold text-slate-900">Gestion manuelle</div><p className="text-sm text-slate-500">Vous préparez l’envoi et renseignez le suivi depuis la commande.</p></div>
          {manualActive ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Mode actif</span> : canManage && <button disabled={saving !== null} onClick={() => void selectMode("manual")} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Activer ce mode</button>}
        </div>
        <div><h3 className="mb-3 font-semibold text-slate-900">Tarifs par wilaya</h3>{manualContent}</div>
      </div> : <div className="space-y-3">
        {carriers.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Aucune société n’a encore été configurée pour votre boutique.</div> : <><div className="flex flex-wrap gap-2" role="tablist" aria-label="Sociétés configurées">{carriers.map((carrier) => <button key={carrier.key} type="button" role="tab" aria-selected={selectedCarrier === carrier.key} onClick={() => setSelectedCarrier(carrier.key)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${selectedCarrier === carrier.key ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700"}`}>{carrier.label}</button>)}</div>{carriers.filter((carrier) => carrier.key === selectedCarrier).map((carrier) => <div key={carrier.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4" role="tabpanel">
          <div><div className="font-semibold text-slate-900">{carrier.label}</div><p className="mt-1 text-sm text-slate-500">{carrier.automatic ? carrier.officeLookup ? "Envoi et bureaux disponibles via API." : "Envoi via API disponible ; bureaux non synchronisés." : "Identifiants enregistrés. L’envoi automatique attend l’intégration de l’API du transporteur."}</p></div>
          {carrier.isActive ? <span className={`rounded-full px-3 py-1 text-sm font-semibold ${carrier.automatic ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{carrier.automatic ? "Mode actif" : "API indisponible"}</span> : <button disabled={!canManage || !carrier.automatic || saving !== null} onClick={() => void selectMode(carrier.key)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">{carrier.automatic ? "Utiliser cette société" : "En attente d’activation"}</button>}
        </div>)}</>}
        <p className="text-xs text-slate-500">La configuration des transporteurs est gérée par l’administratrice de la plateforme.</p>
      </div>}
    </div>
  </div>;
}
