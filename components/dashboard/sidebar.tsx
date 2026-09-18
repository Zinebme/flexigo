"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDashboardDict, type DashboardLang } from "@/lib/i18n/dashboard";

interface NavItem {
  href: string;
  key: string;
  icon: string;
  roles?: string[];
}

const NAV: Array<{ sectionKey: string; items: NavItem[] }> = [
  {
    sectionKey: "general",
    items: [
      { href: "/dashboard", key: "nav.dashboard", icon: "📊" },
      { href: "/dashboard/commandes", key: "nav.orders", icon: "📦", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
      { href: "/dashboard/produits", key: "nav.products", icon: "🛍️", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "CONTENT_EDITOR", "VIEWER"] },
      { href: "/dashboard/categories", key: "nav.categories", icon: "🗂️", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/clients", key: "nav.customers", icon: "👥", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
      { href: "/dashboard/inventaire", key: "nav.inventory", icon: "📦", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
      { href: "/dashboard/statistiques", key: "nav.statistics", icon: "📈" },
    ],
  },
  {
    sectionKey: "site",
    items: [
      { href: "/dashboard/site", key: "nav.website", icon: "📄", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/bannieres", key: "nav.banners", icon: "🖼️", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/avis", key: "nav.reviews", icon: "⭐", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/faq", key: "nav.faq", icon: "❓", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/apparence", key: "nav.appearance", icon: "🎨", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/livraison", key: "nav.delivery", icon: "🚚", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
      { href: "/dashboard/marketing", key: "nav.marketing", icon: "📣", roles: ["OWNER", "MANAGER"] },
    ],
  },
  {
    sectionKey: "admin",
    items: [
      { href: "/dashboard/equipe", key: "nav.team", icon: "🧑‍💼", roles: ["OWNER"] },
      { href: "/dashboard/parametres", key: "nav.settings", icon: "⚙️", roles: ["OWNER"] },
    ],
  },
];

const SECTION_LABELS: Record<string, Record<DashboardLang, string>> = {
  general: { fr: "Général", ar: "عام", en: "General" },
  site: { fr: "Mon site", ar: "موقعي", en: "My site" },
  admin: { fr: "Administration", ar: "الإدارة", en: "Administration" },
};

export function DashboardSidebar({
  storeName,
  role,
  previewUrl,
  lang = "fr",
}: {
  storeName: string;
  role: string;
  previewUrl: string;
  lang?: DashboardLang;
}) {
  const pathname = usePathname();
  const dict = getDashboardDict(lang);
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex rtl:right-0 rtl:left-auto rtl:border-l rtl:border-r-0">
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
            <div key={group.sectionKey} className="mb-5">
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{SECTION_LABELS[group.sectionKey]?.[lang] ?? group.sectionKey}</div>
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
                      {dict[item.key] ?? item.key}
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
          {dict["nav.website"] ?? "Voir mon site"}
        </a>
      </div>
    </aside>
  );
}
