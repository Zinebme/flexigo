"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Général",
    items: [
      { href: "/admin", label: "Vue d'ensemble", icon: "📊" },
      { href: "/admin/clients", label: "Clients", icon: "🏢" },
      { href: "/admin/sites", label: "Sites", icon: "🌐" },
      { href: "/admin/commandes", label: "Commandes plateforme", icon: "📦" },
    ],
  },
  {
    section: "Plateforme",
    items: [
      { href: "/admin/templates", label: "Templates", icon: "🎨" },
      { href: "/admin/domaines", label: "Domaines", icon: "🔗" },
      { href: "/admin/integrations", label: "Intégrations", icon: "🔌" },
      { href: "/admin/sante", label: "Santé système", icon: "🩺" },
      { href: "/admin/support", label: "Support", icon: "🛟" },
    ],
  },
  {
    section: "Administration",
    items: [
      { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "👤" },
      { href: "/admin/journal", label: "Journal / Audit", icon: "📜" },
      { href: "/admin/parametres", label: "Paramètres", icon: "⚙️" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-black text-white">F</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">FlexiGo</div>
          <div className="text-[11px] text-slate-400">Administration plateforme</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.section}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-violet-600/20 text-violet-300" : "text-slate-300 hover:bg-slate-900 hover:text-white",
                    )}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white">
          <span className="text-base leading-none">↩️</span>
          Retour espace marchand
        </Link>
      </div>
    </aside>
  );
}
