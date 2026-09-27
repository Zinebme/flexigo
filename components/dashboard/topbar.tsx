"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDashboardDict, DASHBOARD_LANGS, type DashboardLang } from "@/lib/i18n/dashboard";
import { Icon, type IconName } from "@/components/ui/icons";
import { Avatar, Spinner } from "@/components/ui";
import { apiErrorMessage, useToast } from "@/components/ui/toast";
import { useNav } from "@/components/dashboard/nav-context";

export interface StoreOption {
  store_id: string;
  store_name: string;
  role: string;
}

/** Small popover used by the store / language / user menus (outside click + Escape). */
function Menu({
  open,
  onClose,
  children,
  width = "w-60",
  align = "end",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  align?: "start" | "end";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "fx-anim-pop absolute z-50 mt-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10",
          width,
          align === "end" ? "end-0" : "start-0",
        )}
      >
        {children}
      </div>
    </>
  );
}

function MenuRow({
  children,
  icon,
  onClick,
  active,
  tone = "default",
  disabled,
}: {
  children: React.ReactNode;
  icon?: IconName;
  onClick?: () => void;
  active?: boolean;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition disabled:opacity-50",
        tone === "danger" ? "text-red-600 hover:bg-red-50" : active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {icon ? <Icon name={icon} size={16} className={active ? "text-blue-600" : "text-slate-400"} /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {active ? <Icon name="check" size={15} className="shrink-0 text-blue-600" strokeWidth={2.4} /> : null}
    </button>
  );
}

export function DashboardTopbar({
  storeName,
  storeId,
  stores,
  userEmail,
  supportMode,
  supportStoreName,
  lang = "fr",
  roleLabel,
}: {
  storeName: string;
  storeId: string;
  stores: StoreOption[];
  userEmail: string;
  supportMode: boolean;
  supportStoreName: string;
  lang?: DashboardLang;
  roleLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { toggle } = useNav();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [langMenu, setLangMenu] = useState(false);
  const dict = getDashboardDict(lang);

  async function switchStore(id: string) {
    setOpen(false);
    if (id === storeId) return;
    setSwitching(true);
    const res = await fetch("/api/dashboard/switch-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSwitching(false);
      toast.error("Changement de site impossible", apiErrorMessage(data, "Impossible de changer de site."));
      return;
    }
    toast.success("Site actif mis à jour");
    router.refresh();
  }

  async function logout() {
    setMenu(false);
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function changeLang(newLang: DashboardLang) {
    setLangMenu(false);
    const res = await fetch("/api/dashboard/settings/language", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      toast.error("Langue non enregistrée");
    }
  }

  const currentLang = DASHBOARD_LANGS.find((l) => l.code === lang);

  return (
    <>
      {supportMode ? (
        <div className="fx-no-print sticky top-0 z-50 flex items-center justify-between gap-3 bg-violet-700 px-4 py-2 text-sm font-semibold text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon name="lifeBuoy" size={17} className="shrink-0" />
            <span className="truncate">
              {dict["topbar.support"]} — {supportStoreName}
            </span>
            <span className="hidden text-xs font-normal text-violet-200 md:block">
              Session d&apos;assistance tracée et journalisée par la plateforme
            </span>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/admin/support/quit", { method: "POST" });
              router.push("/admin/support");
              router.refresh();
            }}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-50"
          >
            {dict["topbar.quit"]}
          </button>
        </div>
      ) : null}

      <header className="fx-no-print sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" size={18} />
          </button>

          {/* Store switcher (desktop) */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setOpen(!open)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                open ? "border-slate-300 bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <Icon name="store" size={16} className="text-slate-400" />
              <span className="max-w-48 truncate">{storeName}</span>
              {switching ? <Spinner size={13} className="text-slate-400" /> : <Icon name="chevronDown" size={14} className="text-slate-400" />}
            </button>
            <Menu open={open} onClose={() => setOpen(false)} width="w-72" align="start">
              <div className="px-3 pt-1.5 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Mes sites</div>
              {stores.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500">Aucun autre site.</div>
              ) : (
                stores.map((s) => (
                  <MenuRow
                    key={s.store_id}
                    icon="store"
                    active={s.store_id === storeId}
                    onClick={() => void switchStore(s.store_id)}
                    disabled={switching}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{s.store_name}</span>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{s.role}</span>
                    </span>
                  </MenuRow>
                ))
              )}
            </Menu>
          </div>

          {/* Store name (mobile) */}
          <span className="truncate text-sm font-bold text-slate-900 lg:hidden">{storeName}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenu(!langMenu)}
              aria-haspopup="menu"
              aria-expanded={langMenu}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition",
                langMenu ? "border-slate-300 bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
              aria-label="Changer la langue du tableau de bord"
            >
              <span aria-hidden="true">{currentLang?.flag}</span>
              <span className="hidden sm:inline">{lang.toUpperCase()}</span>
              <Icon name="chevronDown" size={13} className="text-slate-400" />
            </button>
            <Menu open={langMenu} onClose={() => setLangMenu(false)} width="w-48">
              {DASHBOARD_LANGS.map((l) => (
                <MenuRow key={l.code} active={lang === l.code} onClick={() => void changeLang(l.code)}>
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{l.flag}</span>
                    {l.label}
                  </span>
                </MenuRow>
              ))}
            </Menu>
          </div>

          <div className="hidden text-end md:block">
            <div className="text-sm font-semibold text-slate-800">{userEmail.split("@")[0]}</div>
            <div className="max-w-48 truncate text-xs text-slate-400">{roleLabel ?? userEmail}</div>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenu(!menu)}
              className="flex items-center gap-2 rounded-full pe-2 transition hover:opacity-90"
              aria-label="Menu utilisateur"
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              <Avatar name={userEmail} size={34} className="bg-slate-800 ring-2 ring-white" />
              <Icon name="chevronDown" size={14} className="hidden text-slate-400 sm:block" />
            </button>
            <Menu open={menu} onClose={() => setMenu(false)} width="w-60">
              <div className="border-b border-slate-100 px-3 pt-2 pb-3">
                <div className="truncate text-sm font-bold text-slate-900">{userEmail.split("@")[0]}</div>
                <div className="truncate text-xs text-slate-500">{userEmail}</div>
                {roleLabel ? (
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {roleLabel}
                  </span>
                ) : null}
              </div>
              <div className="pt-1.5">
                <MenuRow icon="logout" tone="danger" onClick={() => void logout()} disabled={loggingOut}>
                  {loggingOut ? "Déconnexion…" : (dict["nav.logout"] ?? "Se déconnecter")}
                </MenuRow>
              </div>
            </Menu>
          </div>
        </div>
      </header>
    </>
  );
}
