"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimary } from "@/components/ui";

interface Store { id: string; name: string; slug: string }
interface Domain {
  id: string; store_id: string; hostname: string; status: string; is_primary: boolean;
  created_at: string; verified_at: string | null; verification_data: Record<string, unknown> | null;
  txt: { type: "TXT"; name: string; value: string };
}
interface DnsTargets { cname: string; apexIps: string[] }

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm sm:grid-cols-[5rem_1fr_1.5fr_auto] sm:items-center">
    <strong>{type}</strong><code className="break-all">{name}</code><code className="break-all">{value}</code>
    <button type="button" className="rounded-lg border px-3 py-2 hover:bg-slate-50" onClick={async () => {
      try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
    }}>{copied ? "Copié" : "Copier"}</button>
  </div>;
}

export function DomainsManager({ stores, domains, platformHost, dnsTargets }: { stores: Store[]; domains: Domain[]; platformHost: string; dnsTargets: DnsTargets }) {
  const router = useRouter();
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [hostname, setHostname] = useState("");
  const [dnsMode, setDnsMode] = useState<"apex" | "subdomain">("apex");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; ok?: string }>({});
  const storeMap = new Map(stores.map((store) => [store.id, store]));

  async function call(url: string, method: string, body?: Record<string, unknown>, success?: string) {
    setBusy(true); setFeedback({});
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = (await res.json().catch(() => ({}))) as { error?: string | { message?: string }; detail?: string };
      const explanation = data.detail ?? (typeof data.error === "string" ? data.error : data.error?.message);
      if (!res.ok) throw new Error(explanation ?? "L'opération a échoué.");
      setFeedback({ ok: success ?? explanation ?? "Modification enregistrée." });
      router.refresh(); return true;
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Erreur inattendue." });
      router.refresh(); return false;
    } finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <p className="font-semibold">Sous-domaines automatiques</p>
      <p>Chaque boutique correspond à <code>slug.{platformHost}</code>. L'hébergement Sites actuel refuse les domaines wildcard : le DNS <code>*.{platformHost}</code> seul ne rend pas ces adresses accessibles. Ajoutez chaque hostname dans Sites, ou activez le wildcard sur une infrastructure compatible.</p>
      <div className="mt-3 flex flex-wrap gap-2">{stores.map((store) => <span key={store.id} className="rounded-lg bg-white px-2 py-1">{store.slug}.{platformHost}</span>)}</div>
    </div>

    <form className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.2fr_1fr_auto] md:items-end" onSubmit={async (event) => {
      event.preventDefault();
      const ok = await call("/api/admin/domains", "POST", { store_id: storeId, hostname: hostname.trim().toLowerCase(), dns_mode: dnsMode }, "Domaine ajouté. Configurez les DNS ci-dessous, puis vérifiez-le.");
      if (ok) setHostname("");
    }}>
      <div><label className={labelCls} htmlFor="domain-store">Boutique</label><select id="domain-store" value={storeId} onChange={(event) => setStoreId(event.target.value)} className={inputCls}>{stores.map((store) => <option key={store.id} value={store.id}>{store.name} ({store.slug})</option>)}</select></div>
      <div><label className={labelCls} htmlFor="domain-host">Domaine personnalisé</label><input id="domain-host" required value={hostname} onChange={(event) => setHostname(event.target.value)} className={inputCls} placeholder="almasa-dz.com" /></div>
      <div><label className={labelCls} htmlFor="domain-mode">Type de domaine</label><select id="domain-mode" value={dnsMode} onChange={(event) => setDnsMode(event.target.value as "apex" | "subdomain")} className={inputCls}><option value="apex">Racine (@) · A</option><option value="subdomain">Sous-domaine (www, shop…) · CNAME</option></select></div>
      <button type="submit" disabled={busy || !storeId} className={btnPrimary}>Ajouter</button>
    </form>
    {feedback.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{feedback.error}</p>}
    {feedback.ok && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{feedback.ok}</p>}

    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Domaines personnalisés ({domains.length})</h3>
      {domains.length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm">Aucun domaine personnalisé pour le moment.</p>}
      {domains.map((domain) => {
        const details = domain.verification_data ?? {};
        const mode = details.dns_mode === "subdomain" ? "subdomain" : "apex";
        const label = domain.status === "verified" ? "Vérifié" : domain.status === "failed" ? "Échec" : "En attente";
        const color = domain.status === "verified" ? "bg-emerald-50 text-emerald-700" : domain.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800";
        const checked = typeof details.last_checked_at === "string" ? new Date(details.last_checked_at).toLocaleString("fr-FR") : "Jamais";
        const failure = details.last_result === "failed" && typeof details.detail === "string" ? details.detail : null;
        const routing = mode === "apex" ? dnsTargets.apexIps.map((ip) => ({ type: "A", name: "@", value: ip })) : dnsTargets.cname ? [{ type: "CNAME", name: domain.hostname.split(".")[0] ?? domain.hostname, value: dnsTargets.cname }] : [];
        return <section key={domain.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="break-all font-semibold">{domain.hostname}</h4><span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{label}</span>{domain.is_primary && <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Principal</span>}</div><p className="mt-1 text-sm text-slate-600">{storeMap.get(domain.store_id)?.name ?? "Boutique inconnue"} · {storeMap.get(domain.store_id)?.slug ?? "—"}</p></div><button type="button" onClick={() => setExpanded(expanded === domain.id ? null : domain.id)} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">{expanded === domain.id ? "Masquer DNS" : "Copier DNS"}</button></div>
          <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><div>Créé le : {new Date(domain.created_at).toLocaleString("fr-FR")}</div><div>Dernière vérification : {checked}</div>{domain.verified_at && <div>Vérifié le : {new Date(domain.verified_at).toLocaleString("fr-FR")}</div>}{failure && <div className="text-red-700 sm:col-span-2">Erreur : {failure}</div>}</dl>
          {expanded === domain.id && <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4">
            <div className="space-y-2"><p className="text-sm font-semibold">1. Vérification de propriété</p><DnsRow {...domain.txt} /></div>
            <div className="space-y-2"><p className="text-sm font-semibold">2. Routage vers Marqova</p><label className="flex items-center gap-2 text-sm">Configuration DNS <select value={mode} className={inputCls + " max-w-xs"} disabled={busy} onChange={(event) => void call(`/api/admin/domains/${domain.id}`, "PATCH", { dns_mode: event.target.value }, "Type DNS enregistré.")}><option value="apex">Racine (@) · A</option><option value="subdomain">Sous-domaine · CNAME</option></select></label>{routing.length ? routing.map((record) => <DnsRow key={record.value} {...record} />) : <p className="text-sm text-amber-800">Cible DNS non configurée côté serveur. Renseignez MARQOVA_DNS_CNAME_TARGET et MARQOVA_DNS_APEX_IPV4_TARGETS.</p>}</div>
            <p className="text-sm text-slate-600">Ajoutez aussi ce hostname dans Sites et activez son certificat TLS. Le TXT seul ne réalise pas cette étape.</p>
            {domain.status === "verified" && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={details.hosting_ready === true} disabled={busy} onChange={(event) => { if (!event.target.checked || window.confirm(`Confirmer que ${domain.hostname} est actif dans Sites avec HTTPS ?`)) void call(`/api/admin/domains/${domain.id}`, "PATCH", { hosting_ready: event.target.checked }, "État de l'hébergement enregistré."); }} /> Domaine ajouté dans Sites, HTTPS actif</label>}
          </div>}
          <div className="mt-4 flex flex-wrap gap-2 text-sm"><button type="button" disabled={busy} className="rounded-lg border px-3 py-2 hover:bg-slate-50" onClick={() => void call(`/api/admin/domains/${domain.id}/verify`, "POST", undefined, "Enregistrement TXT vérifié.")}>Vérifier maintenant</button><button type="button" disabled={busy || domain.status !== "verified" || domain.is_primary} className="rounded-lg border px-3 py-2 hover:bg-slate-50 disabled:opacity-50" onClick={() => void call(`/api/admin/domains/${domain.id}`, "PATCH", { is_primary: true }, "Domaine principal mis à jour.")}>Définir comme principal</button><button type="button" disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50" onClick={() => { if (window.confirm(`Supprimer ${domain.hostname} ?`)) void call(`/api/admin/domains/${domain.id}`, "DELETE", undefined, "Domaine supprimé."); }}>Supprimer</button></div>
        </section>;
      })}
    </div>
  </div>;
}
