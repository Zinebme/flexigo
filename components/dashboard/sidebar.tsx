"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: string[]; // restrict to these merchant roles
}

const NAV: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Général",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
      { href: "/dashboard/commandes", label: "Commandes", icon: "📦", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
      { href: "/dashboard/produits", label: "Produits", icon: "🛍️", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "CONTENT_EDITOR", "VIEWER"] },
      { href: "/dashboard/categories", label: "Catégories", icon: "🗂️", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/clients", label: "Clients", icon: "👥", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
      { href: "/dashboard/statistiques", label: "Statistiques", icon: "📈" },
    ],
  },
  {
    section: "Mon site",
    items: [
      { href: "/dashboard/site", label: "Pages & sections", icon: "📄", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/apparence", label: "Apparence", icon: "🎨", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/livraison", label: "Livraison", icon: "🚚", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
      { href: "/dashboard/marketing", label: "Marketing", icon: "📣", roles: ["OWNER", "MANAGER"] },
    ],
  },
  {
    section: "Administration",
    items: [
      { href: "/dashboard/equipe", label: "Équipe", icon: "🧑‍💼", roles: ["OWNER"] },
      { href: "/dashboard/parametres", label: "Paramètres", icon: "⚙️", roles: ["OWNER"] },
    ],
  },
];

export function DashboardSidebar({
  storeName,
  role,
  previewUrl,
}: {
  storeName: string;
  role: string;
  previewUrl: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">F</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">{storeName}</div>
          <div className="text-[11px] text-slate-400">Espace marchand</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 fx-scroll">
        {NAV.map((group) => {
          const visible = group.items.filter((i) => !i.roles || i.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={group.section} className="mb-5">
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.section}</div>
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <span className="text-base leading-none">🌐</span>
          Voir mon site
        </a>
      </div>
    </aside>
  );
}
