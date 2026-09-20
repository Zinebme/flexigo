import type { Metadata } from "next";
import { darCssVars } from "@/lib/storefront/dar/tokens";
import { DarContainer, DarHeading } from "@/components/storefront/templates-v2/dar/dar-ui";
import { StorefrontImage } from "@/components/storefront/image";
import "@/components/storefront/templates-v2/dar/dar.css";

export const dynamic="force-static";
export const metadata:Metadata={title:"DAR — معاينة القالب",robots:{index:false,follow:false}};
const products=[
 {name:"منظم متعدد الاستعمال",price:"2 900 دج",img:"/images/dar/storage.svg"},
 {name:"طقم مطبخ عملي",price:"4 500 دج",img:"/images/dar/kitchen.svg"},
 {name:"ديكور منزلي بسيط",price:"3 200 دج",img:"/images/dar/decor.svg"},
 {name:"طقم مفارش مريح",price:"5 900 دج",img:"/images/dar/linen.svg"},
];
export default function DarPreview(){
 return <div dir="rtl" className="dar-root min-h-screen" style={darCssVars()}>
  <div className="bg-[var(--dar-olive-dark)] px-3 py-2 text-center text-[11px] font-bold text-white">معاينة DAR — لا يتم إنشاء طلبات حقيقية</div>
  <header className="border-b border-[var(--dar-border)] bg-[var(--dar-paper)]"><DarContainer className="flex h-16 items-center justify-between"><div className="flex items-center gap-2 font-black"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dar-terracotta)] text-white">د</span>DAR HOME</div><a href="#products" className="dar-btn min-h-10 px-4 text-xs">تسوّق الآن</a></DarContainer></header>
  <main>
   <section className="border-b border-[var(--dar-border)] bg-[var(--dar-paper)]"><DarContainer className="grid min-h-[560px] items-center gap-8 py-10 lg:grid-cols-2"><div className="order-2 lg:order-1"><span className="dar-chip">HOME / COD</span><h1 className="dar-heading mt-5 text-4xl sm:text-6xl">بيت أهدأ.<br/>تفاصيل أذكى.</h1><p className="mt-4 max-w-xl text-sm leading-8 text-[var(--dar-muted)]">منتجات للمطبخ، الترتيب والديكور تساعدك تستعمل مساحتك بشكل أفضل، مع الدفع عند الاستلام.</p><div className="mt-7 flex gap-3"><a href="#products" className="dar-btn">اكتشف المنتجات</a><a href="/preview/dar/produit" className="dar-btn-light">جرب صفحة المنتج</a></div></div><div className="order-1 lg:order-2 dar-paper relative aspect-[4/3] overflow-hidden"><StorefrontImage src="/images/dar/hero.svg" alt="DAR" fill priority sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/></div></DarContainer></section>
   <section className="dar-section" id="products"><DarContainer><DarHeading eyebrow="SELECTED" title="اختيارات للبيت" subtitle="تصميم دافئ، بسيط ومناسب للمتاجر المنزلية"/><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{products.map((p,i)=><a key={p.name} href="/preview/dar/produit" className="dar-product group"><div className="relative aspect-[4/3] overflow-hidden"><StorefrontImage src={p.img} alt={p.name} fill sizes="25vw" className="object-cover transition duration-500 group-hover:scale-105"/></div><div className="p-4"><span className="dar-chip">0{i+1}</span><h3 className="mt-3 text-sm font-black leading-6">{p.name}</h3><div className="mt-2 text-sm font-black text-[var(--dar-terracotta-dark)]">{p.price}</div></div></a>)}</div></DarContainer></section>
   <section className="dar-section bg-[var(--dar-paper)]"><DarContainer><div className="grid gap-3 sm:grid-cols-4">{["عملي يومياً","الدفع عند الاستلام","توصيل 58 ولاية","خيارات ديناميكية"].map((x,i)=><div key={x} className="dar-paper p-5"><span className="dar-chip">0{i+1}</span><div className="mt-3 text-sm font-black">{x}</div></div>)}</div></DarContainer></section>
  </main>
 </div>
}