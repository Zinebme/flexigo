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
export function ShippingProviderForm({ providers, canManage }: { providers: ProviderInfo[]; canManage: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState(providers.find((p) => p.is_active)?.key ?? providers[0]?.key ?? "manual");
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <button
            key={p.key}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
              selected === p.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => {
              setSelected(p.key);
              setTestResult(null);
              setOkMsg(null);
              setError(null);
            }}
          >
            {p.label}
            {p.is_active && <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">ACTIF</span>}
          </button>
        ))}
      </div>

      {current && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {current.statusNote && <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{current.statusNote}</p>}
          {current.fields.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune configuration requise pour ce mode.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {current.fields.map((f) => (
                <div key={f.key} className={f.key === "api_base_url" ? "md:col-span-2" : ""}>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">{f.label}</label>
                  <input
                    type={f.secret ? "password" : "text"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    placeholder={f.secret ? (f.value || "••••••••") : undefined}
                    value={values[`${selected}:${f.key}`] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [`${selected}:${f.key}`]: e.target.value }))}
                  />
                  {f.secret && <p className="mt-1 text-xs text-slate-400">Chiffré côté serveur. Laissez vide pour conserver la valeur actuelle.</p>}
                </div>
              ))}
            </div>
          )}

          {current.last_tested_at && (
            <p className="mt-3 text-xs text-slate-400">
              Dernier test : {new Date(current.last_tested_at).toLocaleString("fr-FR")} — {current.status === "configured" ? "✅ réussi" : current.status === "error" ? `❌ ${current.last_error}` : "—"}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" onClick={test} disabled={testing}>
              {testing ? "Test en cours…" : "Tester la connexion"}
            </button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50" onClick={() => save(false)} disabled={saving}>
              Enregistrer
            </button>
            {!current.is_active && (
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50" onClick={() => save(true)} disabled={saving}>
                Enregistrer et activer
              </button>
            )}
          </div>
          {testResult && (
            <p className={`mt-3 text-sm ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}>
              {testResult.ok ? "✅ " : "❌ "}
              {testResult.message}
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {okMsg && <p className="mt-2 text-sm text-emerald-600">{okMsg}</p>}
        </div>
      )}
    </div>
  );
}
