import type { ReactNode } from "react";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { voltCssVars } from "@/lib/storefront/volt/tokens";
import { VoltContainer, VoltIcon } from "./volt-ui";
import "./volt.css";

export async function VoltShell({data,children}:{data:StorefrontData;children:ReactNode}){
 const shop=await loadSouqShop(data.id); const base=data.base; const contact=data.settings?.contact;
 const nav=[{href:base,label:"الرئيسية"},{href:`${base}/boutique`,label:"المتجر"},{href:`${base}/boutique?sort=featured`,label:"الأكثر طلباً"},{href:`${base}/a-propos`,label:"من نحن"},{href:`${base}/faq`,label:"الأسئلة الشائعة"},{href:`${base}/contact`,label:"تواصل"}];
 return <div dir="rtl" className="volt-root min-h-screen volt-grid-bg" style={voltCssVars()} data-template="volt-v1">
  <div className="border-b border-[var(--volt-border)] bg-[var(--volt-blue)] px-3 py-2 text-center text-[11px] font-bold text-white">{data.theme?.announcement?.trim()||"توصيل إلى 58 ولاية • الدفع عند الاستلام"}</div>
  <header className="sticky top-0 z-50 border-b border-[var(--volt-border)] bg-white/95 backdrop-blur-xl">
   <VoltContainer className="flex h-16 items-center justify-between gap-3">
    <a href={base} className="flex items-center gap-2 font-black tracking-tight text-[var(--volt-ink)]">{data.theme?.logo_url?<img src={data.theme.logo_url} alt={data.name} className="h-9 max-w-[150px] object-contain"/>:<><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--volt-cyan)] text-sm text-[#031014]">V</span><span>{data.name}</span></>}</a>
    <nav className="hidden items-center gap-5 lg:flex">{nav.map(n=><a key={n.href} href={n.href} className="text-xs font-bold text-slate-600 hover:text-[var(--volt-blue)]">{n.label}</a>)}</nav>
    <div className="flex items-center gap-2">
      {contact?.whatsapp?<a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,"")}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--volt-border)] text-slate-600"><VoltIcon name="whatsapp" className="h-4 w-4"/></a>:null}
      <a href={`${base}/boutique`} className="flex h-10 items-center gap-2 rounded-xl bg-[var(--volt-blue)] px-3 text-xs font-black text-white"><VoltIcon name="cart" className="h-4 w-4"/>تسوّق</a>
    </div>
   </VoltContainer>
   <div className="border-t border-[var(--volt-border)] lg:hidden"><VoltContainer className="flex gap-4 overflow-x-auto py-2 text-xs font-bold text-slate-500">{nav.slice(0,4).map(n=><a className="shrink-0" key={n.href} href={n.href}>{n.label}</a>)}</VoltContainer></div>
  </header>
  <main className="min-h-[60vh]">{children}</main>
  <footer className="mt-12 border-t border-[var(--volt-border)] bg-white py-10">
   <VoltContainer className="grid gap-8 sm:grid-cols-3">
    <div><div className="text-lg font-black">{data.name}</div><p className="mt-2 text-xs leading-6 text-slate-500">متجر تقني سريع وواضح مع الدفع عند الاستلام.</p></div>
    <div><div className="text-xs font-black text-[var(--volt-blue)]">الأقسام</div><div className="mt-3 flex flex-col gap-2 text-xs text-slate-500">{shop.categories.slice(0,5).map(c=><a key={c.id} href={`${base}/categorie/${c.slug}`}>{c.name}</a>)}</div></div>
    <div><div className="text-xs font-black text-[var(--volt-blue)]">تواصل</div><div className="mt-3 space-y-2 text-xs text-slate-500">{contact?.phone?<a className="block" href={`tel:${contact.phone}`}>{contact.phone}</a>:null}{contact?.email?<a className="block" href={`mailto:${contact.email}`}>{contact.email}</a>:null}</div></div>
   </VoltContainer>
  </footer>
 </div>
}
