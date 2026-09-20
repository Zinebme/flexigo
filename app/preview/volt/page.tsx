import type { Metadata } from "next";
import { voltCssVars } from "@/lib/storefront/volt/tokens";
import { VoltContainer, VoltHeading, VoltIcon } from "@/components/storefront/templates-v2/volt/volt-ui";
import { StorefrontImage } from "@/components/storefront/image";
import "@/components/storefront/templates-v2/volt/volt.css";

export const dynamic="force-static";
export const metadata:Metadata={title:"VOLT — معاينة القالب",robots:{index:false,follow:false}};
const products=[
 {name:"ساعة ذكية AMOLED",price:"8 900 دج",img:"/images/volt/watch.svg"},
 {name:"سماعات لاسلكية ANC",price:"5 400 دج",img:"/images/volt/earbuds.svg"},
 {name:"بطارية محمولة 20000mAh",price:"4 900 دج",img:"/images/volt/power.svg"},
 {name:"مكبر صوت لاسلكي",price:"3 900 دج",img:"/images/volt/speaker.svg"},
];
export default function VoltPreview(){
 return <div dir="rtl" className="volt-root min-h-screen volt-grid-bg" style={voltCssVars()}>
  <div className="bg-[var(--volt-blue)] px-3 py-2 text-center text-[11px] font-bold text-white">معاينة VOLT — لا يتم إنشاء طلبات حقيقية</div>
  <header className="border-b border-[var(--volt-border)] bg-white/95"><VoltContainer className="flex h-16 items-center justify-between"><div className="flex items-center gap-2 font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--volt-cyan)] text-[#031014]">V</span>VOLT STORE</div><a href="#products" className="volt-btn">تسوّق الآن</a></VoltContainer></header>
  <main>
   <section className="border-b border-[var(--volt-border)]"><VoltContainer className="grid min-h-[560px] items-center gap-8 py-10 lg:grid-cols-2"><div className="order-2 lg:order-1"><span className="volt-badge">ARABIC TECH / COD</span><h1 className="volt-title mt-5 text-4xl sm:text-6xl">تقنية أقوى.<br/>تجربة أسرع.</h1><p className="mt-4 max-w-xl text-sm leading-8 text-slate-600">أجهزة وإكسسوارات مختارة بعناية، مواصفات واضحة، والدفع عند الاستلام في جميع أنحاء الجزائر.</p><div className="mt-7 flex gap-3"><a href="#products" className="volt-btn">اكتشف المنتجات<VoltIcon name="arrow-left" className="h-4 w-4"/></a><a href="/preview/volt/produit" className="volt-btn-outline">جرب صفحة المنتج</a></div></div><div className="order-1 lg:order-2 volt-panel relative aspect-square overflow-hidden"><StorefrontImage src="/images/volt/hero.svg" alt="VOLT" fill priority sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/></div></VoltContainer></section>
   <section className="volt-section" id="products"><VoltContainer><VoltHeading eyebrow="TRENDING" title="الأكثر طلباً" subtitle="واجهة تقنية مصممة للموبايل أولاً"/><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{products.map((p,i)=><a key={p.name} href="/preview/volt/produit" className="volt-product group"><div className="relative aspect-square overflow-hidden"><StorefrontImage src={p.img} alt={p.name} fill sizes="25vw" className="object-cover transition duration-500 group-hover:scale-105"/></div><div className="p-3"><span className="volt-badge">0{i+1}</span><h3 className="mt-3 text-sm font-black leading-6">{p.name}</h3><div className="mt-2 text-sm font-black text-[var(--volt-blue)]">{p.price}</div></div></a>)}</div></VoltContainer></section>
   <section className="volt-section bg-[var(--volt-surface-2)]"><VoltContainer><div className="grid gap-3 sm:grid-cols-4">{["مواصفات واضحة","الدفع عند الاستلام","توصيل 58 ولاية","خيارات ديناميكية"].map((x,i)=><div key={x} className="volt-panel p-5"><div className="text-2xl font-black text-[var(--volt-blue)]">0{i+1}</div><div className="mt-3 text-sm font-black">{x}</div></div>)}</div></VoltContainer></section>
  </main>
 </div>
}
