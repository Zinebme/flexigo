"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const PRIMARY: NavItem[] = [
  { href: "/admin", label: "Accueil", icon: "⌂" },
  { href: "/admin/sites", label: "Sites", icon: "▣" },
  { href: "/admin/clients", label: "Clients", icon: "◎" },
  { href: "/admin/templates", label: "Templates", icon: "◇" },
];

const ADVANCED: NavItem[] = [
  { href: "/admin/commandes", label: "Commandes plateforme", icon: "□" },
  { href: "/admin/domaines", label: "Domaines", icon: "↗" },
  { href: "/admin/integrations", label: "Intégrations", icon: "⌁" },
  { href: "/admin/support", label: "Support", icon: "?" },
  { href: "/admin/sante", label: "Santé système", icon: "♡" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "○" },
  { href: "/admin/journal", label: "Journal / Audit", icon: "≡" },
  { href: "/admin/parametres", label: "Paramètres", icon: "⚙" },
];

function AdminNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
        active ? "bg-violet-500/15 text-violet-200 ring-1 ring-inset ring-violet-500/20" : "text-slate-300 hover:bg-slate-900 hover:text-white",
      )}
    >
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-sm", active ? "bg-violet-500/20" : "bg-slate-900")}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const advancedActive = ADVANCED.some((item) => pathname.startsWith(item.href));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white">M</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">Marqova</div>
            <div className="text-[11px] text-slate-500">Mon espace de production</div>
          </div>
        </div>
        <Link
          href="/admin/sites/nouveau"
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-500"
        >
          + Créer un site
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {PRIMARY.map((item) => <AdminNavLink key={item.href} item={item} pathname={pathname} />)}
        </div>

        <details className="mt-5 border-t border-slate-800 pt-4" open={advancedActive}>
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-900 hover:text-slate-300">
            <span>Outils avancés</span>
            <span className="text-sm">⌄</span>
          </summary>
          <div className="mt-2 space-y-1">
            {ADVANCED.map((item) => <AdminNavLink key={item.href} item={item} pathname={pathname} />)}
          </div>
        </details>
      </nav>

      <div className="space-y-1 border-t border-slate-800 p-3">
        <Link href="/preview" target="_blank" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">◫</span>
          Prévisualiser les templates
        </Link>
        <Link href="/dashboard" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-900 hover:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">↩</span>
          Espace marchand
        </Link>
      </div>
    </aside>
  );
}
