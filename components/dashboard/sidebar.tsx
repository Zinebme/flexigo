"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDashboardDict, type DashboardLang } from "@/lib/i18n/dashboard";
import { Icon, type IconName } from "@/components/ui/icons";
import { useNav } from "@/components/dashboard/nav-context";

interface NavItem {
  href: string;
  key: string;
  icon: IconName;
  roles?: string[];
}

interface NavGroup {
  label: Record<DashboardLang, string>;
  icon: IconName;
  items: NavItem[];
}

const HOME: NavItem[] = [
  { href: "/dashboard", key: "nav.dashboard", icon: "dashboard" },
  { href: "/dashboard/commandes", key: "nav.orders", icon: "receipt", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
];

const GROUPS: NavGroup[] = [
  {
    label: { fr: "Boutique", ar: "المتجر", en: "Store" },
    icon: "store",
    items: [
      { href: "/dashboard/produits", key: "nav.products", icon: "package", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "CONTENT_EDITOR", "VIEWER"] },
      { href: "/dashboard/categories", key: "nav.categories", icon: "layers", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/inventaire", key: "nav.inventory", icon: "clipboard", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
      { href: "/dashboard/clients", key: "nav.customers", icon: "users", roles: ["OWNER", "MANAGER", "ORDER_MANAGER", "VIEWER"] },
    ],
  },
  {
    label: { fr: "Site & contenu", ar: "الموقع والمحتوى", en: "Site & content" },
    icon: "fileText",
    items: [
      { href: "/dashboard/site", key: "nav.website", icon: "fileText", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/bannieres", key: "nav.banners", icon: "image", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/apparence", key: "nav.appearance", icon: "palette", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/avis", key: "nav.reviews", icon: "star", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
      { href: "/dashboard/faq", key: "nav.faq", icon: "message", roles: ["OWNER", "MANAGER", "CONTENT_EDITOR"] },
    ],
  },
  {
    label: { fr: "Livraison", ar: "التوصيل", en: "Delivery" },
    icon: "truck",
    items: [
      { href: "/dashboard/livraison", key: "nav.delivery", icon: "truck", roles: ["OWNER", "MANAGER", "ORDER_MANAGER"] },
    ],
  },
  {
    label: { fr: "Marketing", ar: "التسويق", en: "Marketing" },
    icon: "trendingUp",
    items: [
      { href: "/dashboard/marketing", key: "nav.marketing", icon: "trendingUp", roles: ["OWNER", "MANAGER"] },
      { href: "/dashboard/statistiques", key: "nav.statistics", icon: "chart" },
    ],
  },
];

const ADMIN: NavItem[] = [
  { href: "/dashboard/equipe", key: "nav.team", icon: "shield", roles: ["OWNER"] },
  { href: "/dashboard/parametres", key: "nav.settings", icon: "settings", roles: ["OWNER"] },
];

function visible(item: NavItem, role: string) {
  return !item.roles || item.roles.includes(role);
}

function NavLink({
  item,
  pathname,
  dict,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  dict: Record<string, string>;
  onNavigate?: () => void;
}) {
  const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
        active
          ? "bg-blue-50 font-semibold text-blue-700"
          : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
      )}
    >
      {active ? <span className="absolute inset-y-2 -start-3 w-1 rounded-full bg-blue-600" /> : null}
      <Icon
        name={item.icon}
        size={18}
        className={cn("transition", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")}
      />
      <span className="truncate">{dict[item.key] ?? item.key}</span>
    </Link>
  );
}

function NavBody({
  role,
  pathname,
  dict,
  lang,
  onNavigate,
}: {
  role: string;
  pathname: string;
  dict: Record<string, string>;
  lang: DashboardLang;
  onNavigate?: () => void;
}) {
  return (
    <nav className="fx-scroll flex-1 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        {HOME.filter((item) => visible(item, role)).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} dict={dict} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="mt-5 space-y-1">
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => visible(item, role));
          if (!items.length) return null;
          const active = items.some((item) => pathname.startsWith(item.href));
          return (
            <details key={group.label.fr} open={active} className="group">
              <summary
                className={cn(
                  "flex min-h-10 cursor-pointer list-none items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                  active ? "text-slate-900" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900",
                )}
              >
                <Icon name={group.icon} size={18} className={cn(active ? "text-blue-600" : "text-slate-400")} />
                <span className="flex-1 truncate">{group.label[lang]}</span>
                <Icon
                  name="chevronDown"
                  size={15}
                  className="text-slate-400 transition group-open:rotate-180 rtl:-scale-x-100"
                />
              </summary>
              <div className="ms-4 mt-1 space-y-1 border-s border-slate-200 ps-3">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} dict={dict} onNavigate={onNavigate} />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          {lang === "ar" ? "الإدارة" : "Administration"}
        </div>
        <div className="space-y-1">
          {ADMIN.filter((item) => visible(item, role)).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} dict={dict} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function SidebarHeader({ storeName, previewUrl, lang }: { storeName: string; previewUrl: string; lang: DashboardLang }) {
  return (
    <div className="border-b border-slate-200 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm shadow-blue-600/25">
          M
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">{storeName}</div>
          <div className="truncate text-[11px] text-slate-400">
            {lang === "ar" ? "لوحة المتجر" : lang === "en" ? "Store dashboard" : "Tableau de bord"}
          </div>
        </div>
      </div>
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
      >
        <Icon name="external" size={15} />
        {lang === "ar" ? "عرض المتجر" : lang === "en" ? "View store" : "Voir la boutique"}
      </a>
    </div>
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
  const { open, setOpen } = useNav();

  // Navigating closes the mobile drawer.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <>
      {/* Desktop */}
      <aside className="fx-no-print fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-slate-200 bg-white lg:flex">
        <SidebarHeader storeName={storeName} previewUrl={previewUrl} lang={lang} />
        <NavBody role={role} pathname={pathname} dict={dict} lang={lang} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fx-anim-fade-in fx-no-print fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] lg:hidden",
          open ? "block" : "pointer-events-none hidden",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fx-no-print fixed inset-y-0 start-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-e border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
        )}
        aria-label="Navigation"
        aria-hidden={!open}
      >
        <div className="relative">
          <SidebarHeader storeName={storeName} previewUrl={previewUrl} lang={lang} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3.5 end-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer le menu"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <NavBody role={role} pathname={pathname} dict={dict} lang={lang} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
