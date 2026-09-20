import type { StorefrontData } from "@/lib/storefront/data";
import type { Section } from "@/lib/sections/definitions";
import { loadSouqFaq, loadSouqReviews, loadSouqShop } from "@/lib/storefront/souq/catalog";
import { StorefrontImage } from "../../image";
import { VoltContainer, VoltHeading, VoltIcon } from "./volt-ui";
import { VoltProductCard } from "./volt-product-card";

export async function VoltSection({data,section}:{data:StorefrontData;section:Section;index?:number}){
 if(section.enabled===false) return null;
 const s=section as Section & Record<string,unknown>;
 if(section.type==="hero"){
  const image=(s.desktop_image||s.image) as string|undefined;
  return <section className="relative overflow-hidden border-b border-[var(--volt-border)] bg-[#05070b]">
   <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,211,238,.16),transparent_36%)]"/>
   <VoltContainer className="relative grid min-h-[540px] items-center gap-8 py-10 lg:grid-cols-2 lg:py-14">
    <div className="order-2 lg:order-1">
     {s.badge?<div className="volt-badge">{String(s.badge)}</div>:null}
     <h1 className="volt-title mt-4 text-4xl sm:text-5xl lg:text-6xl">{String(s.title||data.name)}</h1>
     {s.subtitle?<p className="mt-4 max-w-xl text-sm leading-8 text-slate-400 sm:text-base">{String(s.subtitle)}</p>:null}
     <div className="mt-7 flex flex-wrap gap-3"><a href={String(s.button_link||"/boutique")} className="volt-btn">{String(s.button_text||"تسوّق الآن")}<VoltIcon name="arrow-left" className="h-4 w-4"/></a><a href={`${data.base}/boutique?sort=featured`} className="volt-btn-outline">الأكثر طلباً</a></div>
    </div>
    <div className="order-1 lg:order-2"><div className="volt-panel relative aspect-square overflow-hidden">{image?<StorefrontImage src={image} alt={String(s.title||data.name)} fill priority sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/>:<div className="flex h-full items-center justify-center text-8xl text-slate-700">⌁</div>}<div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-[11px] backdrop-blur"><span className="font-bold text-slate-200">PERFORMANCE / READY</span><span className="text-[var(--volt-cyan)]">● ONLINE</span></div></div></div>
   </VoltContainer>
  </section>
 }
 if(section.type==="collections"){
  const {categories}=await loadSouqShop(data.id);
  if(!categories.length) return null;
  return <section className="volt-section"><VoltContainer><VoltHeading eyebrow="CATEGORIES" title={String(s.title||"الأقسام")} subtitle={s.subtitle?String(s.subtitle):null}/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.slice(0,Number(s.max_items||6)).map(c=><a key={c.id} href={`${data.base}/categorie/${c.slug}`} className="volt-panel group overflow-hidden p-3"><div className="relative aspect-square overflow-hidden rounded-xl bg-[#070b11]">{c.imageUrl?<StorefrontImage src={c.imageUrl} alt={c.name} fill sizes="180px" className="object-cover transition duration-500 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-3xl text-slate-700">⌁</div>}</div><div className="mt-3 text-xs font-black text-slate-200">{c.name}</div></a>)}</div></VoltContainer></section>
 }
 if(section.type==="products"){
  const {products}=await loadSouqShop(data.id); let list=products;
  if(s.source==="featured") list=list.filter(p=>p.isFeatured);
  if(s.source==="latest") list=[...list].reverse();
  list=list.slice(0,Number(s.product_count||8));
  if(!list.length) return null;
  return <section className="volt-section bg-[#070b11]"><VoltContainer><VoltHeading eyebrow="GEAR" title={String(s.title||"المنتجات")} subtitle={s.subtitle?String(s.subtitle):null} action={<a href={`${data.base}/boutique`} className="text-xs font-black text-[var(--volt-cyan)]">عرض الكل ←</a>}/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">{list.map(p=><VoltProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div></VoltContainer></section>
 }
 if(section.type==="features"){
  const items=(s.items as Array<{title?:string|null;text?:string|null}>|undefined)??[];
  return <section className="volt-section"><VoltContainer><VoltHeading eyebrow="WHY VOLT" title={String(s.title||"المزايا")} subtitle={s.subtitle?String(s.subtitle):null}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((it,i)=><div key={i} className="volt-panel p-5"><div className="text-2xl font-black text-[var(--volt-cyan)]">0{i+1}</div><h3 className="mt-4 text-sm font-black">{it.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{it.text}</p></div>)}</div></VoltContainer></section>
 }
 if(section.type==="banner"){
  const image=(s.desktop_image||s.mobile_image) as string|undefined;
  return <section className="volt-section"><VoltContainer><div className="volt-panel relative overflow-hidden"><div className="grid items-center lg:grid-cols-2"><div className="p-7 sm:p-10"><div className="volt-kicker">UPGRADE MODE</div><h2 className="volt-title mt-3 text-3xl">{String(s.title||"ترقية ذكية")}</h2>{s.subtitle?<p className="mt-3 text-sm leading-7 text-slate-400">{String(s.subtitle)}</p>:null}<a href={String(s.button_link||"/boutique")} className="volt-btn mt-6">{String(s.button_text||"اكتشف")}</a></div><div className="relative aspect-[16/10] lg:aspect-square">{image?<StorefrontImage src={image} alt={String(s.title||"")} fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/>:null}</div></div></div></VoltContainer></section>
 }
 if(section.type==="reviews"){
  const reviews=await loadSouqReviews(data.id,null,6); if(!reviews.length) return null;
  return <section className="volt-section bg-[#070b11]"><VoltContainer><VoltHeading eyebrow="REVIEWS" title={String(s.title||"آراء الزبائن")} subtitle={s.subtitle?String(s.subtitle):null}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reviews.map(r=><figure key={r.id} className="volt-panel p-5"><div className="text-[var(--volt-amber)]">{"★".repeat(r.rating)}</div>{r.title?<div className="mt-3 text-sm font-black">{r.title}</div>:null}<blockquote className="mt-2 text-xs leading-6 text-slate-400">{r.body}</blockquote><figcaption className="mt-4 text-[11px] font-bold text-slate-500">{r.customerName}</figcaption></figure>)}</div></VoltContainer></section>
 }
 if(section.type==="faq"){
  const faq=await loadSouqFaq(data.id,Number(s.max_items||8)); if(!faq.length) return null;
  return <section className="volt-section"><VoltContainer className="max-w-3xl"><VoltHeading eyebrow="FAQ" title={String(s.title||"الأسئلة الشائعة")} subtitle={s.subtitle?String(s.subtitle):null}/><div>{faq.map(f=><details key={f.id} className="border-b border-[var(--volt-border)] py-4"><summary className="cursor-pointer text-sm font-extrabold">{f.question}</summary><p className="pt-3 text-sm leading-7 text-slate-400">{f.answer}</p></details>)}</div></VoltContainer></section>
 }
 if(section.type==="contact"){
  return <section className="volt-section bg-[#070b11]"><VoltContainer><div className="volt-panel flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center"><div><div className="volt-kicker">SUPPORT</div><h2 className="volt-title mt-2 text-2xl">{String(s.title||"تواصل معنا")}</h2>{s.text?<p className="mt-2 text-sm text-slate-500">{String(s.text)}</p>:null}</div>{data.settings?.contact?.whatsapp?<a href={`https://wa.me/${data.settings.contact.whatsapp.replace(/\D/g,"")}`} className="volt-btn"><VoltIcon name="whatsapp" className="h-4 w-4"/>واتساب</a>:null}</div></VoltContainer></section>
 }
 return null;
}
