"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import { useNav } from "@/components/dashboard/nav-context";

/**
 * Admin top bar: drawer toggle + identity + logout. The violet accent
 * distinguishes the platform admin area from merchant dashboards (blue).
 */
export function AdminTopbar({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const { toggle } = useNav();
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the popover on outside click / Escape.
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

  async function logout() {
    setMenu(false);
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = userEmail.slice(0, 1).toUpperCase();

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-900 hover:text-white lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Icon name="menu" size={18} />
        </button>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white lg:hidden">Marqova Admin</div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
            <Icon name="shield" size={13} className="text-violet-400" />
            Accès plateforme — toutes les actions sont journalisées
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className="hidden items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white sm:inline-flex"
        >
          <Icon name="arrowLeft" size={13} />
          Espace marchand
        </Link>

        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full pe-2.5 ps-1 text-sm font-bold text-white transition",
              menu ? "bg-violet-500 ring-2 ring-violet-400/40" : "bg-violet-600 hover:bg-violet-500",
            )}
            aria-label="Menu administrateur"
            aria-expanded={menu}
            aria-haspopup="menu"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs">{initials}</span>
            <span className="hidden max-w-[9rem] truncate text-xs font-semibold sm:block">
              {userEmail.split("@")[0]}
            </span>
            <Icon name="chevronDown" size={13} className="opacity-80" />
          </button>

          {menu ? (
            <div
              role="menu"
              className="fx-anim-pop absolute end-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/60"
            >
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="truncate text-sm font-semibold text-white">{userEmail.split("@")[0]}</div>
                <div className="truncate text-xs text-slate-400">{userEmail}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-200 ring-1 ring-inset ring-violet-500/30">
                  <Icon name="shield" size={11} />
                  Administrateur plateforme
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  href="/admin/journal"
                  onClick={() => setMenu(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Icon name="history" size={15} className="text-slate-500" />
                  Journal d&apos;audit
                </Link>
                <Link
                  href="/admin/parametres"
                  onClick={() => setMenu(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Icon name="settings" size={15} className="text-slate-500" />
                  Paramètres
                </Link>
                <Link
                  href="/dashboard"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white sm:hidden"
                >
                  <Icon name="arrowLeft" size={15} className="text-slate-500" />
                  Espace marchand
                </Link>
              </div>
              <div className="border-t border-slate-800 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                >
                  <Icon name="logout" size={15} />
                  {loggingOut ? "Déconnexion…" : "Se déconnecter"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
