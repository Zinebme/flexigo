import type { StorefrontData } from "@/lib/storefront/data";
import type { Section } from "@/lib/sections/definitions";
import { loadSouqFaq, loadSouqReviews, loadSouqShop } from "@/lib/storefront/souq/catalog";
import { StorefrontImage } from "../../image";
import { DarContainer, DarHeading, DarIcon } from "./dar-ui";
import { DarProductCard } from "./dar-product-card";

export async function DarSection({data,section}:{data:StorefrontData;section:Section;index?:number}){
 if(section.enabled===false) return null;
 const s=section as Section & Record<string,unknown>;
 if(section.type==="hero"){
  const desktop=(s.desktop_image||s.image) as string|undefined;
  return <section className="overflow-hidden border-b border-[var(--dar-border)] bg-[var(--dar-paper)]">
   <DarContainer className="grid min-h-[560px] items-center gap-8 py-10 lg:grid-cols-2 lg:py-14">
    <div className="order-2 lg:order-1">
      {s.badge?<span className="dar-chip">{String(s.badge)}</span>:null}
      <h1 className="dar-heading mt-5 text-4xl sm:text-5xl lg:text-6xl">{String(s.title||data.name)}</h1>
      {s.subtitle?<p className="mt-4 max-w-xl text-sm leading-8 text-[var(--dar-muted)] sm:text-base">{String(s.subtitle)}</p>:null}
      <div className="mt-7 flex flex-wrap gap-3"><a href={String(s.button_link||"/boutique")} className="dar-btn">{String(s.button_text||"تسوّق الآن")}</a><a href={`${data.base}/boutique?sort=featured`} className="dar-btn-light">الأكثر طلباً</a></div>
    </div>
    <div className="order-1 lg:order-2"><div className="dar-paper relative aspect-[4/3] overflow-hidden">{desktop?<StorefrontImage src={desktop} alt={String(s.title||data.name)} fill priority sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/>:<div className="flex h-full items-center justify-center text-8xl">⌂</div>}<div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-[var(--dar-paper)]/92 px-4 py-3 text-[11px] shadow"><span className="font-bold text-[var(--dar-olive-dark)]">HOME / DAILY</span><span className="text-[var(--dar-terracotta)]">● COD</span></div></div></div>
   </DarContainer>
  </section>
 }
 if(section.type==="collections"){
  const {categories}=await loadSouqShop(data.id); if(!categories.length) return null;
  return <section className="dar-section"><DarContainer><DarHeading eyebrow="SPACES" title={String(s.title||"الأقسام")} subtitle={s.subtitle?String(s.subtitle):null}/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.slice(0,Number(s.max_items||6)).map(c=><a key={c.id} href={`${data.base}/categorie/${c.slug}`} className="dar-paper group overflow-hidden p-2"><div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--dar-cream)]">{c.imageUrl?<StorefrontImage src={c.imageUrl} alt={c.name} fill sizes="180px" className="object-cover transition duration-500 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-3xl">⌂</div>}</div><div className="px-2 pb-2 pt-3 text-xs font-black">{c.name}</div></a>)}</div></DarContainer></section>
 }
 if(section.type==="products"){
  const {products}=await loadSouqShop(data.id); let list=products;
  if(s.source==="featured") list=list.filter(p=>p.isFeatured); if(s.source==="latest") list=[...list].reverse(); list=list.slice(0,Number(s.product_count||8)); if(!list.length) return null;
  return <section className="dar-section bg-[var(--dar-paper)]"><DarContainer><DarHeading eyebrow="SELECTED" title={String(s.title||"المنتجات")} subtitle={s.subtitle?String(s.subtitle):null} action={<a href={`${data.base}/boutique`} className="text-xs font-black text-[var(--dar-terracotta-dark)]">عرض الكل ←</a>}/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">{list.map(p=><DarProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div></DarContainer></section>
 }
 if(section.type==="banner"){
  const image=(s.desktop_image||s.mobile_image) as string|undefined;
  return <section className="dar-section"><DarContainer><div className="dar-paper overflow-hidden"><div className="grid items-center lg:grid-cols-2"><div className="p-7 sm:p-10"><div className="dar-eyebrow">HOME STORY</div><h2 className="dar-heading mt-3 text-3xl sm:text-4xl">{String(s.title||"بيت أدفأ")}</h2>{s.subtitle?<p className="mt-3 text-sm leading-8 text-[var(--dar-muted)]">{String(s.subtitle)}</p>:null}<a href={String(s.button_link||"/boutique")} className="dar-btn mt-6">{String(s.button_text||"اكتشف")}</a></div><div className="relative aspect-[4/3]">{image?<StorefrontImage src={image} alt={String(s.title||"")} fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/>:null}</div></div></div></DarContainer></section>
 }
 if(section.type==="features"){
  const items=(s.items as Array<{title?:string|null;text?:string|null}>|undefined)??[];
  return <section className="dar-section"><DarContainer><DarHeading eyebrow="WHY DAR" title={String(s.title||"المزايا")} subtitle={s.subtitle?String(s.subtitle):null}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((it,i)=><div key={i} className="dar-paper p-5"><span className="dar-chip">0{i+1}</span><h3 className="mt-4 text-sm font-black">{it.title}</h3><p className="mt-2 text-xs leading-6 text-[var(--dar-muted)]">{it.text}</p></div>)}</div></DarContainer></section>
 }
 if(section.type==="reviews"){
  const reviews=await loadSouqReviews(data.id,null,6); if(!reviews.length) return null;
  return <section className="dar-section bg-[var(--dar-paper)]"><DarContainer><DarHeading eyebrow="REVIEWS" title={String(s.title||"آراء الزبائن")} subtitle={s.subtitle?String(s.subtitle):null}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reviews.map(r=><figure key={r.id} className="dar-paper p-5"><div className="text-[var(--dar-terracotta)]">{"★".repeat(r.rating)}</div>{r.title?<div className="mt-3 text-sm font-black">{r.title}</div>:null}<blockquote className="mt-2 text-xs leading-7 text-[var(--dar-muted)]">{r.body}</blockquote><figcaption className="mt-4 text-[11px] font-bold text-stone-500">{r.customerName}</figcaption></figure>)}</div></DarContainer></section>
 }
 if(section.type==="faq"){
  const faq=await loadSouqFaq(data.id,Number(s.max_items||8)); if(!faq.length) return null;
  return <section className="dar-section"><DarContainer className="max-w-3xl"><DarHeading eyebrow="FAQ" title={String(s.title||"الأسئلة الشائعة")} subtitle={s.subtitle?String(s.subtitle):null}/><div>{faq.map(f=><details key={f.id} className="border-b border-[var(--dar-border)] py-4"><summary className="cursor-pointer text-sm font-extrabold">{f.question}</summary><p className="pt-3 text-sm leading-7 text-[var(--dar-muted)]">{f.answer}</p></details>)}</div></DarContainer></section>
 }
 if(section.type==="contact"){
  return <section className="dar-section bg-[var(--dar-paper)]"><DarContainer><div className="dar-paper flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center"><div><div className="dar-eyebrow">SUPPORT</div><h2 className="dar-heading mt-2 text-2xl">{String(s.title||"تواصل معنا")}</h2>{s.text?<p className="mt-2 text-sm text-[var(--dar-muted)]">{String(s.text)}</p>:null}</div>{data.settings?.contact?.whatsapp?<a href={`https://wa.me/${data.settings.contact.whatsapp.replace(/\D/g,"")}`} className="dar-btn"><DarIcon name="whatsapp" className="h-4 w-4"/>واتساب</a>:null}</div></DarContainer></section>
 }
 return null;
}