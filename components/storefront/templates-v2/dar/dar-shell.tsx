import type { ReactNode } from "react";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { darCssVars } from "@/lib/storefront/dar/tokens";
import { DarContainer, DarIcon } from "./dar-ui";
import "./dar.css";

export async function DarShell({data,children}:{data:StorefrontData;children:ReactNode}){
 const shop=await loadSouqShop(data.id); const base=data.base; const contact=data.settings?.contact;
 const nav=[{href:base,label:"الرئيسية"},{href:`${base}/boutique`,label:"المتجر"},{href:`${base}/boutique?sort=featured`,label:"الأكثر طلباً"},{href:`${base}/a-propos`,label:"من نحن"},{href:`${base}/faq`,label:"الأسئلة الشائعة"},{href:`${base}/contact`,label:"تواصل"}];
 return <div dir="rtl" className="dar-root min-h-screen" style={darCssVars()} data-template="dar-v1">
  <div className="bg-[var(--dar-olive-dark)] px-3 py-2 text-center text-[11px] font-bold text-white">{data.theme?.announcement?.trim()||"توصيل إلى 58 ولاية • الدفع عند الاستلام"}</div>
  <header className="sticky top-0 z-50 border-b border-[var(--dar-border)] bg-[var(--dar-paper)]/95 backdrop-blur">
   <DarContainer className="flex h-16 items-center justify-between gap-3">
    <a href={base} className="flex items-center gap-2 font-black">{data.theme?.logo_url?<img src={data.theme.logo_url} alt={data.name} className="h-9 max-w-[150px] object-contain"/>:<><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dar-terracotta)] text-white">د</span><span>{data.name}</span></>}</a>
    <nav className="hidden items-center gap-5 lg:flex">{nav.map(n=><a key={n.href} href={n.href} className="text-xs font-bold text-[var(--dar-muted)] hover:text-[var(--dar-olive-dark)]">{n.label}</a>)}</nav>
    <div className="flex items-center gap-2">{contact?.whatsapp?<a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,"")}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dar-border)]"><DarIcon name="whatsapp" className="h-4 w-4"/></a>:null}<a href={`${base}/boutique`} className="dar-btn min-h-10 px-4 text-xs">تسوّق</a></div>
   </DarContainer>
   <div className="border-t border-[var(--dar-border)] lg:hidden"><DarContainer className="flex gap-4 overflow-x-auto py-2 text-xs font-bold text-[var(--dar-muted)]">{nav.slice(0,4).map(n=><a className="shrink-0" key={n.href} href={n.href}>{n.label}</a>)}</DarContainer></div>
  </header>
  <main className="min-h-[60vh]">{children}</main>
  <footer className="mt-12 border-t border-[var(--dar-border)] bg-[var(--dar-paper)] py-10"><DarContainer className="grid gap-8 sm:grid-cols-3"><div><div className="text-lg font-black">{data.name}</div><p className="mt-2 text-xs leading-6 text-[var(--dar-muted)]">اختيارات عملية ودافئة للبيت مع الدفع عند الاستلام.</p></div><div><div className="text-xs font-black text-[var(--dar-terracotta-dark)]">الأقسام</div><div className="mt-3 flex flex-col gap-2 text-xs text-[var(--dar-muted)]">{shop.categories.slice(0,5).map(c=><a key={c.id} href={`${base}/categorie/${c.slug}`}>{c.name}</a>)}</div></div><div><div className="text-xs font-black text-[var(--dar-terracotta-dark)]">تواصل</div><div className="mt-3 space-y-2 text-xs text-[var(--dar-muted)]">{contact?.phone?<a className="block" href={`tel:${contact.phone}`}>{contact.phone}</a>:null}{contact?.email?<a className="block" href={`mailto:${contact.email}`}>{contact.email}</a>:null}</div></div></DarContainer></footer>
 </div>
}
