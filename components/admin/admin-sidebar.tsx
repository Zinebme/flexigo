"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";
import { useNav } from "@/components/dashboard/nav-context";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const PRIMARY: NavItem[] = [
  { href: "/admin", label: "Accueil", icon: "home" },
  { href: "/admin/sites", label: "Sites", icon: "store" },
  { href: "/admin/clients", label: "Clients", icon: "users" },
  { href: "/admin/templates", label: "Templates", icon: "palette" },
];

const ADVANCED: NavItem[] = [
  { href: "/admin/commandes", label: "Commandes plateforme", icon: "receipt" },
  { href: "/admin/domaines", label: "Domaines", icon: "globe" },
  { href: "/admin/integrations", label: "Intégrations", icon: "plug" },
  { href: "/admin/support", label: "Support", icon: "lifeBuoy" },
  { href: "/admin/sante", label: "Santé système", icon: "heart" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "user" },
  { href: "/admin/journal", label: "Journal / Audit", icon: "history" },
  { href: "/admin/parametres", label: "Paramètres", icon: "settings" },
];

function AdminNavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
        active
          ? "bg-violet-500/15 text-violet-100 ring-1 ring-inset ring-violet-500/30"
          : "text-slate-400 hover:bg-slate-900 hover:text-white",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition",
          active ? "bg-violet-500/25 text-violet-200" : "bg-slate-900 text-slate-400 group-hover:text-slate-200",
        )}
      >
        <Icon name={item.icon} size={15} />
      </span>
      <span className="truncate">{item.label}</span>
      {active ? <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-violet-400" /> : null}
    </Link>
  );
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const advancedActive = ADVANCED.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <div className="border-b border-slate-800/80 px-4 py-4">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-900/40">
            M
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">Marqova</span>
            <span className="block text-[11px] text-slate-500">Espace plateforme</span>
          </span>
        </Link>
        <Link
          href="/admin/sites/nouveau"
          onClick={onNavigate}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-900/40 transition hover:bg-violet-500 active:translate-y-px"
        >
          <Icon name="plus" size={16} />
          Créer un site
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {PRIMARY.map((item) => (
            <AdminNavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>

        <details className="group mt-5 border-t border-slate-800/80 pt-4" open={advancedActive}>
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition hover:bg-slate-900 hover:text-slate-300 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Icon name="sliders" size={13} />
              Outils avancés
            </span>
            <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-1">
            {ADVANCED.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </details>
      </nav>

      <div className="space-y-1 border-t border-slate-800/80 p-3">
        <Link
          href="/preview"
          target="_blank"
          onClick={onNavigate}
          className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <Icon name="eye" size={15} />
          </span>
          <span className="truncate">Prévisualiser les templates</span>
          <Icon name="external" size={12} className="ms-auto shrink-0 opacity-60" />
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-900 hover:text-white"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <Icon name="arrowLeft" size={15} />
          </span>
          <span className="truncate">Espace marchand</span>
        </Link>
      </div>
    </>
  );
}

/**
 * Platform admin sidebar (dark, violet accent).
 * Desktop: fixed rail. Mobile: drawer driven by the shared nav context
 * (the hamburger lives in `AdminTopbar`).
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useNav();

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-slate-800 bg-slate-950 lg:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      {open ? (
        <div
          className="fx-anim-fade-in fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-e border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 end-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
          aria-label="Fermer le menu"
        >
          <Icon name="x" size={16} />
        </button>
        <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
