"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface StoreOption {
  store_id: string;
  store_name: string;
  role: string;
}

/**
 * Dashboard top bar: store switcher (own memberships only), user menu,
 * logout, and the silent-support banner when a Super Admin is in "mode
 * assistance" (the merchant never sees anything — only the admin's session
 * carries this banner).
 */
export function DashboardTopbar({
  storeName,
  storeId,
  stores,
  userEmail,
  supportMode,
  supportStoreName,
}: {
  storeName: string;
  storeId: string;
  stores: StoreOption[];
  userEmail: string;
  supportMode: boolean;
  supportStoreName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function switchStore(id: string) {
    setOpen(false);
    if (id === storeId) return;
    const res = await fetch("/api/dashboard/switch-store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_id: id }) });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      window.alert(typeof data.error === "string" ? data.error : (data.error?.message ?? "Impossible de changer de site."));
      return;
    }
    router.refresh();
  }

  async function logout() {
    setMenu(false);
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {supportMode ? (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-violet-700 px-4 py-2 text-sm font-semibold text-white sm:px-6">
          <span>🛟 Mode assistance — {supportStoreName}</span>
          <span className="hidden text-xs font-normal text-violet-200 sm:block">
            Session d'assistance tracée et journalisée par la plateforme
          </span>
        </div>
      ) : null}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        {/* mobile: store name */}
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <span className="truncate text-sm font-bold text-slate-900">{storeName}</span>
        </div>
        {/* desktop: store switcher */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="max-w-48 truncate">{storeName}</span>
            <span className="text-xs text-slate-400">▾</span>
          </button>
          {open ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Mes sites</div>
                {stores.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">Aucun autre site.</div>
                ) : null}
                {stores.map((s) => (
                  <button
                    key={s.store_id}
                    onClick={() => switchStore(s.store_id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-50",
                      s.store_id === storeId ? "text-blue-700" : "text-slate-700",
                    )}
                  >
                    <span className="truncate">{s.store_name}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{s.role}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-800">{userEmail.split("@")[0]}</div>
            <div className="text-xs text-slate-400">{userEmail}</div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenu(!menu)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white"
              aria-label="Menu utilisateur"
            >
              {userEmail.slice(0, 1).toUpperCase()}
            </button>
            {menu ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {loggingOut ? "Déconnexion…" : "Se déconnecter"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
