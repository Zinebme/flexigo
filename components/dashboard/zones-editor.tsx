"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WILAYAS } from "@/lib/algeria/wilayas";

interface Zone {
  wilaya_code: number;
  home_fee_cents: number | null;
  office_fee_cents: number | null;
  is_active: boolean;
}

/**
 * Per-wilaya shipping fee editor. Each row saves independently (upsert).
 * wilaya 0 = default zone. Fees entered in DA, stored as cents server-side.
 */
export function ZonesEditor({ initial, canManage }: { initial: Zone[]; canManage: boolean }) {
  const router = useRouter();
  const byCode = new Map(initial.map((z) => [z.wilaya_code, z]));
  const [drafts, setDrafts] = useState<Record<number, { home: string; office: string; active: boolean }>>(() => {
    const d: Record<number, { home: string; office: string; active: boolean }> = {};
    for (const z of initial) {
      d[z.wilaya_code] = {
        home: z.home_fee_cents != null ? String(z.home_fee_cents / 100) : "",
        office: z.office_fee_cents != null ? String(z.office_fee_cents / 100) : "",
        active: z.is_active,
      };
    }
    return d;
  });
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okCode, setOkCode] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  async function save(code: number) {
    const d = drafts[code];
    const def = byCode.get(code);
    if (!d && !def) return;
    setBusy(code);
    setError(null);
    const body: Record<string, unknown> = { wilaya_code: code, is_active: d?.active ?? def?.is_active ?? true };
    if (d?.home) body.home_fee = Number.parseFloat(d.home);
    if (d?.office) body.office_fee = Number.parseFloat(d.office);
    const res = await fetch("/api/dashboard/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(null);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOkCode(code);
    setTimeout(() => setOkCode(null), 1500);
    router.refresh();
  }

  async function remove(code: number) {
    if (!window.confirm(`Réinitialiser la zone de la wilaya ${code} (reprend la zone par défaut) ?`)) return;
    setBusy(code);
    setError(null);
    const res = await fetch("/api/dashboard/zones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wilaya_code: code }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Suppression impossible"));
    }
    setBusy(null);
  }

  async function saveAll() {
    setBulkBusy(true);
    setError(null);
    setBulkMessage(null);
    try {
      const rowsToSave = [{ code: 0, name: "Par défaut" }, ...WILAYAS];
      for (const row of rowsToSave) {
        const d = drafts[row.code];
        if (!d && row.code !== 0) continue;
        const body = {
          wilaya_code: row.code,
          home_fee: Number.parseFloat(d?.home || "0"),
          office_fee: Number.parseFloat(d?.office || "0"),
          is_active: d?.active ?? true,
        };
        const res = await fetch("/api/dashboard/zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
          throw new Error(typeof data.error === "string" ? data.error : (data.error?.message ?? `Échec wilaya ${row.code}`));
        }
      }
      setBulkMessage("Tarifs enregistrés pour toutes les wilayas.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement global impossible");
    } finally {
      setBulkBusy(false);
    }
  }

  function applyDefaultToAll() {
    const def = drafts[0] ?? { home: "", office: "", active: true };
    const next = { ...drafts };
    for (const w of WILAYAS) next[w.code] = { home: def.home, office: def.office, active: true };
    setDrafts(next);
    setBulkMessage("Tarif par défaut copié sur les 58 wilayas. Cliquez sur « Enregistrer les 58 ».");
  }

  if (!canManage) return null;

  const input = "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm";
  const rows: Array<{ code: number; name: string }> = [{ code: 0, name: "Par défaut" }, ...WILAYAS];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Définissez les frais de livraison par wilaya. Vous pouvez enregistrer ligne par ligne ou les 58 d’un coup.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={applyDefaultToAll} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Copier le tarif par défaut</button>
          <button type="button" onClick={saveAll} disabled={bulkBusy} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{bulkBusy ? "Enregistrement…" : "Enregistrer les 58"}</button>
        </div>
      </div>
      {bulkMessage && <p className="mb-2 text-sm text-emerald-600">{bulkMessage}</p>}
      <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="text-left text-xs font-semibold text-slate-500">
              <th className="px-4 py-2">Wilaya</th>
              <th className="px-4 py-2">Domicile (DA)</th>
              <th className="px-4 py-2">Bureau (DA)</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = drafts[r.code];
              return (
                <tr key={r.code} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700">{r.name}</td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" className={input} placeholder="—" value={d?.home ?? ""} disabled={!canManage}
                      onChange={(e) => setDrafts((p) => ({ ...p, [r.code]: { home: e.target.value, office: p[r.code]?.office ?? "", active: p[r.code]?.active ?? true } }))} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" className={input} placeholder="—" value={d?.office ?? ""} disabled={!canManage}
                      onChange={(e) => setDrafts((p) => ({ ...p, [r.code]: { home: p[r.code]?.home ?? "", office: e.target.value, active: p[r.code]?.active ?? true } }))} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={d?.active ?? true} disabled={!canManage}
                      onChange={(e) => setDrafts((p) => ({ ...p, [r.code]: { home: p[r.code]?.home ?? "", office: p[r.code]?.office ?? "", active: e.target.checked } }))} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {busy === r.code ? (
                      <span className="text-xs text-slate-400">Enregistrement…</span>
                    ) : okCode === r.code ? (
                      <span className="text-xs text-emerald-600">Enregistré ✓</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-900" onClick={() => save(r.code)}>
                          Enregistrer
                        </button>
                        {r.code !== 0 && (
                          <button className="rounded-md px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50" onClick={() => remove(r.code)}>
                            Réinit.
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
