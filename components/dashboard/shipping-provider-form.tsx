"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ProviderField {
  key: string;
  label: string;
  secret: boolean;
  value: string; // masked preview for secrets
  placeholder?: string;
}
export interface ProviderInfo {
  key: string;
  label: string;
  statusNote: string | null;
  fields: ProviderField[];
  is_active: boolean;
  status: string;
  last_tested_at: string | null;
  last_error: string | null;
}

/**
 * Carrier config UI. Secrets are entered once and only ever echoed back as a
 * masked preview; the server encrypts before storage.
 */
export function ManualShippingMode({ active, canManage }: { active: boolean; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function activate() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/dashboard/integrations/shipping", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider_key: "manual", is_active: true, fields: {} }) });
      if (!res.ok) throw new Error("Activation impossible");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2 text-sm"><p>{active ? "Mode manuel actif" : "Le mode manuel utilise les tarifs par wilaya ci-dessous."}</p>{canManage && !active && <button type="button" disabled={busy} onClick={activate} className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white">Activer le mode manuel</button>}{error && <p role="alert" className="text-red-600">{error}</p>}</div>;
}

export function ShippingProviderForm({ providers, canManage }: { providers: ProviderInfo[]; canManage: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState(providers.find((p) => p.is_active && p.key !== "manual")?.key ?? providers.find((p) => p.key !== "manual" && p.key !== "mock")?.key ?? "generic");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const p of providers) for (const f of p.fields) if (f.value) v[`${p.key}:${f.key}`] = f.value;
    return v;
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const current = providers.find((p) => p.key === selected);

  async function test() {
    setTesting(true);
    setTestResult(null);
    setError(null);
    const res = await fetch("/api/dashboard/integrations/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_key: selected }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: { message?: string } | string };
    setTesting(false);
    if (res.ok && data.ok) setTestResult({ ok: true, message: data.message ?? "Connexion réussie." });
    else setTestResult({ ok: false, message: typeof data.error === "string" ? data.error : (data.error?.message ?? "Échec du test") });
  }

  async function save(makeActive: boolean) {
    setSaving(true);
    setError(null);
    setOkMsg(null);
    const fields: Record<string, string> = {};
    for (const f of current?.fields ?? []) {
      const stored = values[`${selected}:${f.key}`] ?? "";
      // If the user left a masked preview untouched, send it back as-is so the
      // server keeps the existing secret (values starting with • are skipped).
      if (stored && !(f.secret && stored.startsWith("•"))) fields[f.key] = stored;
    }
    const res = await fetch("/api/dashboard/integrations/shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_key: selected, is_active: makeActive, fields }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setSaving(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOkMsg(makeActive ? "Fournisseur enregistré et activé." : "Fournisseur enregistré.");
    router.refresh();
  }

  if (!canManage) return null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Sociétés de livraison</h3>
        <p className="mt-1 text-sm text-slate-500">
          Choisissez votre transporteur puis renseignez les identifiants fournis par la société. Les secrets sont chiffrés côté serveur.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {providers.filter((p) => p.key !== "mock" && p.key !== "manual").map((p, index) => {
          const selectedCard = selected === p.key;
          const initials = p.label
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");
          const tileTone = [
            "bg-rose-50 border-rose-100",
            "bg-amber-50 border-amber-100",
            "bg-sky-50 border-sky-100",
            "bg-violet-50 border-violet-100",
            "bg-emerald-50 border-emerald-100",
            "bg-blue-50 border-blue-100",
          ][index % 6];
          return (
            <button
              type="button"
              key={p.key}
              onClick={() => {
                setSelected(p.key);
                setTestResult(null);
                setOkMsg(null);
                setError(null);
              }}
              className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${tileTone} ${selectedCard ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-black text-slate-700 shadow-sm">
                  {initials || "API"}
                </span>
                {p.is_active ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">ACTIF</span>
                ) : p.status === "error" ? (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">ERREUR</span>
                ) : null}
              </div>
              <div className="mt-4 text-sm font-bold text-slate-900">{p.label}</div>
              <div className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm">
                {selectedCard ? "Configuration ouverte" : "Lier maintenant"}
              </div>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Connexion transporteur</div>
              <h4 className="mt-1 text-lg font-bold text-slate-900">{current.label}</h4>
            </div>
            {current.is_active ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Connecté</span> : null}
          </div>

          {current.statusNote && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              {current.statusNote}
            </p>
          )}

          {current.fields.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucune clé API requise pour ce mode.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {current.fields.map((field) => (
                <div key={field.key} className={field.key === "api_base_url" ? "md:col-span-2" : ""}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
                  <input
                    type={field.secret ? "password" : "text"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder={field.placeholder ?? (field.secret ? "••••••••" : "")}
                    value={values[`${selected}:${field.key}`] ?? ""}
                    onChange={(event) => setValues((currentValues) => ({ ...currentValues, [`${selected}:${field.key}`]: event.target.value }))}
                  />
                  {field.secret ? <p className="mt-1 text-xs text-slate-400">Jamais réaffiché en clair après enregistrement.</p> : null}
                </div>
              ))}
            </div>
          )}

          {current.last_tested_at ? (
            <p className="mt-4 text-xs text-slate-400">
              Dernier test : {new Date(current.last_tested_at).toLocaleString("fr-FR")} — {current.status === "configured" ? "réussi" : current.status === "error" ? current.last_error ?? "erreur" : "non vérifié"}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              onClick={test}
              disabled={testing || current.key === "manual"}
            >
              {testing ? "Test en cours…" : "Tester la connexion"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              onClick={() => save(false)}
              disabled={saving}
            >
              Enregistrer
            </button>
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              onClick={() => save(true)}
              disabled={saving}
            >
              {current.is_active ? "Mettre à jour la connexion" : "Enregistrer et activer"}
            </button>
          </div>

          {testResult ? (
            <p className={`mt-3 text-sm ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}>
              {testResult.ok ? "Connexion joignable : " : "Échec : "}{testResult.message}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          {okMsg ? <p className="mt-2 text-sm text-emerald-600">{okMsg}</p> : null}
        </div>
      )}
    </div>
  );}
