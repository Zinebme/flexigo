"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Spinner } from "@/components/ui";
import { Icon, type IconName } from "@/components/ui/icons";
import { Btn, Confirm } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

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

const itemCls =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function MenuLabel({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "danger" }) {
  return (
    <div
      className={cn(
        "mt-1 border-t border-slate-100 px-3 pt-2.5 pb-1.5 text-[11px] font-bold tracking-wider uppercase first:mt-0 first:border-0 first:pt-1",
        tone === "danger" ? "text-red-400" : "text-slate-400",
      )}
    >
      {children}
    </div>
  );
}

function MenuIcon({ name, tone = "slate" }: { name: IconName; tone?: "slate" | "violet" | "green" | "amber" | "red" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-500",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
      <Icon name={name} size={14} />
    </span>
  );
}

/** Row-level site actions: access, lifecycle, data, delete (same endpoints as before). */
export function SiteActions({ store, onChanged }: { store: AdminStoreRow; onChanged?: () => void }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState(false);
  const [dupName, setDupName] = useState(`${store.name} (copie)`);
  const [dupSlug, setDupSlug] = useState(`${store.slug}-copie`);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; action: () => Promise<void> }>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!menu) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

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
      {error ? (
        <span className="hidden max-w-44 items-center gap-1 truncate text-xs font-medium text-red-600 lg:inline-flex" title={error}>
          <Icon name="alert" size={12} className="shrink-0" />
          {error}
        </span>
      ) : null}

      {dup ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            value={dupName}
            onChange={(e) => setDupName(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            placeholder="Nom du site"
            aria-label="Nom de la copie"
          />
          <input
            value={dupSlug}
            onChange={(e) => setDupSlug(e.target.value)}
            className="fx-num w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-xs shadow-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            placeholder="slug"
            aria-label="Slug de la copie"
          />
          <Btn
            size="sm"
            icon="copy"
            busy={busy}
            onClick={() => run("Dupliquer", async () => { await post(`/api/admin/stores/${store.id}/duplicate`, { name: dupName, slug: dupSlug }); setDup(false); })}
          >
            Créer
          </Btn>
          <Btn size="sm" variant="ghost" disabled={busy} onClick={() => setDup(false)}>Annuler</Btn>
        </div>
      ) : (
        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setMenu(!menu)}
            aria-label={`Actions pour ${store.name}`}
            aria-expanded={menu}
            aria-haspopup="menu"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition",
              menu
                ? "border-violet-300 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800",
            )}
          >
            {busy ? <Spinner size={14} /> : <Icon name="dots" size={15} />}
          </button>

          {menu ? (
            <div
              role="menu"
              className="fx-anim-pop absolute end-0 z-50 mt-1.5 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
            >
              <div className="mb-1 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Badge tone={STATUS_TONE[store.status]} dot size="sm">{STATUS_LABEL[store.status]}</Badge>
                <span className="fx-num truncate text-xs text-slate-500">/{store.slug}</span>
              </div>

              <MenuLabel>Accéder</MenuLabel>
              <a
                href={`/s/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setMenu(false)}
                className={itemCls}
              >
                <MenuIcon name="globe" />
                Ouvrir la boutique
                <Icon name="external" size={12} className="ms-auto text-slate-400" />
              </a>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className={itemCls}
                onClick={() => run("Dashboard client", async () => { await post("/api/admin/support/start", { store_id: store.id }); router.push("/dashboard"); })}
              >
                <MenuIcon name="dashboard" />
                Tableau de bord client
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className={cn(itemCls, "text-violet-700 hover:bg-violet-50")}
                onClick={() => run("Accès assistance", async () => { await post("/api/admin/support/start", { store_id: store.id }); router.push("/dashboard"); })}
              >
                <MenuIcon name="lifeBuoy" tone="violet" />
                Accès assistance
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className={itemCls}
                onClick={() => run("Quitter l'assistance", () => post("/api/admin/support/quit"))}
              >
                <MenuIcon name="logout" />
                Quitter l&apos;assistance
              </button>

              <MenuLabel>Cycle de vie</MenuLabel>
              {store.status === "draft" ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className={cn(itemCls, "text-emerald-700 hover:bg-emerald-50")}
                  onClick={() => statusAction("active", "Publier le site")}
                >
                  <MenuIcon name="zap" tone="green" />
                  Publier le site
                </button>
              ) : null}
              {store.status === "active" ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    className={itemCls}
                    onClick={() => statusAction("draft", "Dépublier le site")}
                  >
                    <MenuIcon name="eyeOff" />
                    Dépublier
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    className={cn(itemCls, "text-amber-700 hover:bg-amber-50")}
                    onClick={() => statusAction("suspended", "Suspendre", "Suspendre ce site ? Il restera inaccessible pour les clients jusqu'à réactivation.")}
                  >
                    <MenuIcon name="alert" tone="amber" />
                    Suspendre
                  </button>
                </>
              ) : null}
              {store.status === "suspended" ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className={cn(itemCls, "text-emerald-700 hover:bg-emerald-50")}
                  onClick={() => statusAction("active", "Réactiver le site")}
                >
                  <MenuIcon name="checkCircle" tone="green" />
                  Réactiver
                </button>
              ) : null}
              {store.status !== "archived" ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className={itemCls}
                  onClick={() => statusAction("archived", "Archiver", "Archiver ce site ? Il sera masqué et ses pages ne seront plus publiques.")}
                >
                  <MenuIcon name="box" />
                  Archiver
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className={cn(itemCls, "text-emerald-700 hover:bg-emerald-50")}
                  onClick={() => statusAction("draft", "Restaurer depuis l'archive")}
                >
                  <MenuIcon name="refresh" tone="green" />
                  Restaurer (brouillon)
                </button>
              )}

              <MenuLabel>Données</MenuLabel>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className={itemCls}
                onClick={() => { setDup(true); setMenu(false); }}
              >
                <MenuIcon name="copy" />
                Dupliquer le site
              </button>
              <a
                href={`/api/admin/export/store/${store.id}`}
                role="menuitem"
                onClick={() => setMenu(false)}
                className={itemCls}
              >
                <MenuIcon name="download" />
                Exporter les données (CSV)
              </a>

              <MenuLabel tone="danger">Zone sensible</MenuLabel>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className={cn(itemCls, "text-red-600 hover:bg-red-50")}
                onClick={() =>
                  ask(
                    "Supprimer le site",
                    `Retirer « ${store.name} » de Marqova ? La boutique sera immédiatement inaccessible. Les données restent conservées en base pour récupération/audit.`,
                    () => post(`/api/admin/stores/${store.id}/delete`, { confirm_name: store.name }),
                  )
                }
              >
                <MenuIcon name="trash" tone="red" />
                Supprimer le site
              </button>
            </div>
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
