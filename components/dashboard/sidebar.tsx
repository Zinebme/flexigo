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

interface NavGroup {
  label: Record<DashboardLang, string>;
  icon: string;
  items: NavItem[];
}

const HOME: NavItem[] = [
  { href: "/dashboard", key: "nav.dashboard", icon: "⌂" },
  { href: "/dashboard/commandes", key: "nav.orders", icon: "▢", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
  { href: "/dashboard/commandes-abandonnees", key: "nav.abandonedOrders", icon: "◫", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
];

const GROUPS: NavGroup[] = [
  {
    label: { fr: "Boutique", ar: "المتجر", en: "Store" },
    icon: "▣",
    items: [
      { href: "/dashboard/produits", key: "nav.products", icon: "◇", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "CONTENT_EDITOR", "VIEWER"] },
      { href: "/dashboard/categories", key: "nav.categories", icon: "≡", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/inventaire", key: "nav.inventory", icon: "□", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
      { href: "/dashboard/clients", key: "nav.customers", icon: "◎", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
    ],
  },
  {
    label: { fr: "Site & contenu", ar: "الموقع والمحتوى", en: "Site & content" },
    icon: "▤",
    items: [
      { href: "/dashboard/site", key: "nav.website", icon: "▤", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/bannieres", key: "nav.banners", icon: "▱", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/apparence", key: "nav.appearance", icon: "◐", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/avis", key: "nav.reviews", icon: "☆", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/faq", key: "nav.faq", icon: "?", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
    ],
  },
  {
    label: { fr: "Livraison", ar: "التوصيل", en: "Delivery" },
    icon: "⇢",
    items: [
      { href: "/dashboard/livraison", key: "nav.delivery", icon: "⇢", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
    ],
  },
  {
    label: { fr: "Marketing", ar: "التسويق", en: "Marketing" },
    icon: "↗",
    items: [
      { href: "/dashboard/marketing", key: "nav.marketing", icon: "↗", roles: ["OWNER", "MANAGER"] },
      { href: "/dashboard/statistiques", key: "nav.statistics", icon: "⌁" },
    ],
  },
];

const ADMIN: NavItem[] = [
  { href: "/dashboard/equipe", key: "nav.team", icon: "○", roles: ["OWNER"] },
  { href: "/dashboard/parametres", key: "nav.settings", icon: "⚙", roles: ["OWNER"] },
];

function visible(item: NavItem, role: string) {
  return !item.roles || item.roles.includes(role);
}

function NavLink({ item, pathname, dict }: { item: NavItem; pathname: string; dict: Record<string, string> }) {
  const active = item.href === "/dashboard" ? pathname === "/dashboard" : item.href === "/dashboard/commandes" ? pathname === item.href || pathname.startsWith(`${item.href}/`) : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
        active ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100" : "text-slate-600 hover:bg-rose-50/60 hover:text-slate-900",
      )}
    >
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-sm", active ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-500")}>{item.icon}</span>
      <span>{dict[item.key] ?? item.key}</span>
    </Link>
  );
}

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
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-sm font-black text-white">M</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">{storeName}</div>
            <div className="text-[11px] text-slate-400">{lang === "ar" ? "لوحة المتجر" : lang === "en" ? "Store dashboard" : "Tableau de bord"}</div>
          </div>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-white hover:shadow-sm"
        >
          ◉ {lang === "ar" ? "عرض المتجر" : lang === "en" ? "View store" : "Voir la boutique"}
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 fx-scroll">
        <div className="space-y-1">
          {HOME.filter((item) => visible(item, role)).map((item) => <NavLink key={item.href} item={item} pathname={pathname} dict={dict} />)}
        </div>

        <div className="mt-5 space-y-5">
          {GROUPS.map((group) => {
            const items = group.items.filter((item) => visible(item, role));
            if (!items.length) return null;
            return (
              <div key={group.label.fr}>
                <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label[lang]}</div>
                <div className="space-y-1">
                  {items.map((item) => <NavLink key={item.href} item={item} pathname={pathname} dict={dict} />)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {lang === "ar" ? "الإدارة" : lang === "en" ? "Administration" : "Administration"}
          </div>
          <div className="space-y-1">
            {ADMIN.filter((item) => visible(item, role)).map((item) => <NavLink key={item.href} item={item} pathname={pathname} dict={dict} />)}
          </div>
        </div>
      </nav>
    </aside>
  );
}
