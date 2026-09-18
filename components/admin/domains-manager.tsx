"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimary } from "@/components/ui";

interface Store { id: string; name: string; slug: string }

export function DomainsManager({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [hostname, setHostname] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, hostname: hostname.trim().toLowerCase(), is_primary: isPrimary }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string; ok?: boolean };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      setOk(`Domaine ${hostname} ajouté. Configurez le DNS: CNAME vers votre hébergement ou A record. Vérification via /api/admin/domains/[id]/verify.`);
      setHostname("");
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="font-bold text-slate-900">Ajouter un domaine personnalisé</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelCls}>Site</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputCls}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name} (/{s.slug})</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Hostname</label>
          <input value={hostname} onChange={(e) => setHostname(e.target.value)} className={inputCls} placeholder="www.monestore.com.dz" />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} /> Définir comme primaire</label>
          <button type="submit" disabled={busy || !hostname || !storeId} className={btnPrimary}>{busy ? "…" : "Ajouter"}</button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <strong>Instructions DNS (provider-neutral):</strong> ajoutez un enregistrement CNAME <code className="font-mono">www</code> → <code className="font-mono">votre-plateforme.vercel.app</code> (ou A record vers l'IP VPS Hostinger). La vérification interroge le domaine et marque <code>verified</code>. Le routage se fait via <code>proxy.ts</code> (hostname → store). Preview toujours disponible via <code>/s/[slug]</code>.
      </div>
    </form>
  );
}
