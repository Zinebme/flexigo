"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin top bar: identity + logout. The violet accent distinguishes the
 * platform admin area from merchant dashboards (blue).
 */
export function AdminTopbar({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setMenu(false);
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur sm:px-6">
      <div className="lg:hidden text-sm font-bold text-white">FlexiGo Admin</div>
      <div className="hidden text-xs text-slate-500 lg:block">
        Accès plateforme — toutes les actions sont journalisées
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-white">{userEmail.split("@")[0]}</div>
          <div className="text-xs text-slate-400">{userEmail}</div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white"
            aria-label="Menu administrateur"
          >
            {userEmail.slice(0, 1).toUpperCase()}
          </button>
          {menu ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-lg">
                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {loggingOut ? "Déconnexion…" : "Se déconnecter"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
