"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { Btn, Confirm } from "@/components/admin/ui";

export type StoreStatus = "draft" | "active" | "suspended" | "archived";

export const STATUS_TONE: Record<StoreStatus, "gray" | "green" | "amber" | "red"> = {
  draft: "gray",
  active: "green",
  suspended: "amber",
  archived: "red",
};

export const STATUS_LABEL: Record<StoreStatus, string> = {
  draft: "Brouillon",
  active: "Actif",
  suspended: "Suspendu",
  archived: "Archivé",
};

export interface AdminStoreRow {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  website_type: string;
  template_key: string;
  owner_email: string | null;
  orders_count: number;
  gmv_cents: number;
}

async function post(url: string, body?: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } | string };
  if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error?.message ?? "Erreur inattendue"));
  return data;
}

export function SiteActions({ store, onChanged }: { store: AdminStoreRow; onChanged?: () => void }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState(false);
  const [dupName, setDupName] = useState(`${store.name} (copie)`);
  const [dupSlug, setDupSlug] = useState(`${store.slug}-copie`);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; action: () => Promise<void> }>(null);

  function ask(title: string, message: string, action: () => Promise<unknown>) {
    setConfirm({ title, message, action: action as () => Promise<void> });
  }

  async function run(label: string, action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setMenu(false);
      onChanged?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  const statusAction = (status: StoreStatus, label: string, confirmMsg?: string) =>
    confirmMsg
      ? ask(label, confirmMsg, () => post(`/api/admin/stores/${store.id}/status`, { status }))
      : run(label, () => post(`/api/admin/stores/${store.id}/status`, { status }));

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="hidden max-w-44 truncate text-xs text-red-600 lg:inline" title={error}>{error}</span>}
      {dup ? (
        <div className="flex flex-wrap items-center gap-1">
          <input
            value={dupName}
            onChange={(e) => setDupName(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="Nom du site"
          />
          <input
            value={dupSlug}
            onChange={(e) => setDupSlug(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs"
            placeholder="slug"
          />
          <Btn size="sm" onClick={() => run("Dupliquer", async () => { await post(`/api/admin/stores/${store.id}/duplicate`, { name: dupName, slug: dupSlug }); setDup(false); })}>
            Créer
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setDup(false)}>Annuler</Btn>
        </div>
      ) : (
        <div className="relative">
          <Btn size="sm" variant="ghost" onClick={() => setMenu(!menu)}>{busy ? "…" : "⋯ Actions"}</Btn>
          {menu ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">Accéder</div>
                <a href={`/s/${store.slug}`} target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  🌐 Ouvrir la boutique
                </a>
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => run("Dashboard client", async () => { await post("/api/admin/support/start", { store_id: store.id }); router.push("/dashboard"); })}
                >
                  🖥️ Tableau de bord client (assistance)
                </button>
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-violet-700 hover:bg-violet-50"
                  onClick={() => run("Accès assistance", async () => { await post("/api/admin/support/start", { store_id: store.id }); router.push("/dashboard"); })}
                >
                  🛟 Accès assistance
                </button>
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => run("Quitter l'assistance", () => post("/api/admin/support/quit"))}
                >
                  ⏹️ Quitter l'assistance
                </button>

                <div className="mt-1 border-t border-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">Cycle de vie</div>
                {store.status === "draft" && (
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50" onClick={() => statusAction("active", "Publier le site")}>
                    🚀 Publier le site
                  </button>
                )}
                {store.status === "active" && (
                  <>
                    <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => statusAction("draft", "Dépublier le site")}>
                      ⏸️ Dépublier
                    </button>
                    <button
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-amber-700 hover:bg-amber-50"
                      onClick={() => statusAction("suspended", "Suspendre", "Suspendre ce site ? Il restera inaccessible pour les clients jusqu'à réactivation.")}
                    >
                      ⛔ Suspendre
                    </button>
                  </>
                )}
                {store.status === "suspended" && (
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50" onClick={() => statusAction("active", "Réactiver le site")}>
                    ▶️ Réactiver
                  </button>
                )}
                {store.status !== "archived" ? (
                  <button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => statusAction("archived", "Archiver", "Archiver ce site ? Il sera masqué et ses pages ne seront plus publiques.")}
                  >
                    🗄️ Archiver
                  </button>
                ) : (
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50" onClick={() => statusAction("draft", "Restaurer depuis l'archive")}>
                    ♻️ Restaurer (brouillon)
                  </button>
                )}

                <div className="mt-1 border-t border-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">Données</div>
                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => { setDup(true); setMenu(false); }}>
                  📋 Dupliquer le site
                </button>
                <a href={`/api/admin/export/store/${store.id}`} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenu(false)}>
                  📤 Exporter les données (CSV)
                </a>
              </div>
            </>
          ) : null}
        </div>
      )}
      <span className="hidden xl:inline"><Badge tone={STATUS_TONE[store.status]}>{STATUS_LABEL[store.status]}</Badge></span>
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
          setBusy(true);
          setError(null);
          try {
            await c.action();
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Une erreur est survenue");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
