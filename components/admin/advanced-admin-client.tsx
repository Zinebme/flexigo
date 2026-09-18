"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnSecondary } from "@/components/ui";
import { Btn, Confirm } from "@/components/admin/ui";

interface PageVersion { id: string; page_key: string; version: number; created_at: string; published_by: string | null }

export function AdvancedAdminClient({ storeId, storeSlug, pageVersions }: { storeId: string; storeSlug: string; pageVersions: PageVersion[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; action: () => Promise<void> }>(null);
  const [repairPayload, setRepairPayload] = useState("{}");

  async function post(url: string, body?: unknown) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string; ok?: boolean; version?: number };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      setOk(`OK — ${url}`);
      router.refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-900">Administration avancée (super admin uniquement)</h3>
      <p className="mt-1 text-xs text-slate-500">Outils sûrs — pas de console SQL brute. Toutes les actions sont auditées.</p>

      {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {ok && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</div>}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-800">Restaurer une version de page</h4>
          <p className="mt-1 text-xs text-slate-500">Restaure une ancienne version publiée → devient une NOUVELLE version (pas d'écrasement destructif).</p>
          <div className="mt-3 max-h-48 overflow-auto rounded border border-slate-100">
            {pageVersions.length === 0 ? <p className="p-2 text-xs text-slate-400">Aucune version.</p> : (
              <ul className="divide-y divide-slate-100 text-xs">
                {pageVersions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-2 py-1.5">
                    <span>{v.page_key} · v{v.version} · {new Date(v.created_at).toLocaleString("fr-DZ")}</span>
                    <Btn size="sm" variant="secondary" disabled={busy} onClick={() => setConfirm({
                      title: `Restaurer ${v.page_key} v${v.version} ?`,
                      message: `Cette action crée une nouvelle version à partir de v${v.version}.`,
                      action: async () => { await post(`/api/admin/stores/${storeId}/restore-homepage`, { page_key: v.page_key, version: v.version }); },
                    })}>Restaurer</Btn>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-800">Réparer la configuration</h4>
          <p className="mt-1 text-xs text-slate-500">Valide et corrige settings/theme/pages/zones — supprime les clés invalides, régénère les sections par défaut si manquantes.</p>
          <div className="mt-2">
            <label className={labelCls}>Payload JSON (optionnel — ex: {"{"} &quot;regenerate_sections&quot;: true {"}"})</label>
            <textarea value={repairPayload} onChange={(e) => setRepairPayload(e.target.value)} className={inputCls} rows={3} />
          </div>
          <div className="mt-2 flex gap-2">
            <button disabled={busy} onClick={() => setConfirm({
              title: "Réparer la configuration ?",
              message: "Cette action corrige la config invalide du site. Auditée.",
              action: async () => {
                let parsed: unknown = {};
                try { parsed = JSON.parse(repairPayload); } catch { parsed = {}; }
                await post(`/api/admin/stores/${storeId}/repair-config`, parsed);
              },
            })} className={btnSecondary}>Réparer</button>
            <a href={`/api/admin/export/store/${storeId}`} className={btnSecondary}>Exporter CSV</a>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-800">Intégrations — déconnecter / reset</h4>
          <p className="mt-1 text-xs text-slate-500">Déconnecte une intégration (shipping, Sheets, WhatsApp) — secrets restent chiffrés, statut → error/disconnected.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn size="sm" variant="secondary" disabled={busy} onClick={() => post(`/api/admin/stores/${storeId}/repair-config`, { action: "disconnect_shipping" })}>Déconnecter shipping</Btn>
            <Btn size="sm" variant="secondary" disabled={busy} onClick={() => post(`/api/admin/stores/${storeId}/repair-config`, { action: "disconnect_sheets" })}>Déconnecter Sheets</Btn>
            <Btn size="sm" variant="secondary" disabled={busy} onClick={() => post(`/api/admin/stores/${storeId}/repair-config`, { action: "reset_marketing" })}>Reset pixels</Btn>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-800">Actions rapides</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn size="sm" variant="secondary" disabled={busy} onClick={() => post(`/api/admin/support/start`, { store_id: storeId }).then(() => { router.push("/dashboard"); })}>Accès assistance</Btn>
            <Btn size="sm" variant="secondary" disabled={busy} onClick={() => post(`/api/admin/support/quit`)}>Quitter assistance</Btn>
            <a href={`/s/${storeSlug}`} target="_blank" rel="noreferrer" className={btnSecondary + " text-xs"}>Aperçu storefront</a>
          </div>
        </div>
      </div>

      <Confirm
        open={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel="Confirmer"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm;
          setConfirm(null);
          if (!c) return;
          try { await c.action(); } catch {}
        }}
      />
    </div>
  );
}
