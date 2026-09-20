"use client";
import { useRef, useState } from "react";
import { StorefrontImage } from "../../image";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { SouqOptionPickers, SouqOrderFormView, SouqQuantityOffers, useSouqOrderState, type SouqOrderFormData } from "../souq/souq-order-form";
import { VoltIcon } from "./volt-ui";

export interface VoltProductViewData extends SouqOrderFormData{
 images:string[]; description:string|null; ratingAverage:number|null; ratingCount:number;
 shipping:{hasZones:boolean;homeFromCents:number|null;officeFromCents:number|null;officeEnabled:boolean};
}
export function VoltProductView({data}:{data:VoltProductViewData}){
 const formRef=useRef<HTMLFormElement|null>(null); const form=useSouqOrderState(data,formRef); const [active,setActive]=useState(0);
 const images=data.images.length?data.images:(data.product.imageUrl?[data.product.imageUrl]:[]); const current=images[active]??null;
 const displayPrice=form.variant?.price_cents??data.product.priceCents;
 return <div className="grid gap-7 lg:grid-cols-2 lg:gap-10">
  <div>
   <div className="volt-panel relative aspect-square overflow-hidden">
    {current?<StorefrontImage src={current} alt={data.product.name} fill priority sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/>:<div className="flex h-full items-center justify-center text-7xl text-slate-700">⌁</div>}
    <div className="absolute start-3 top-3 volt-badge">VOLT / PRODUCT</div>
   </div>
   {images.length>1?<div className="mt-3 flex gap-2 overflow-x-auto">{images.map((img,i)=><button key={img+i} type="button" onClick={()=>setActive(i)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${active===i?"border-[var(--volt-cyan)]":"border-[var(--volt-border)]"}`}><StorefrontImage src={img} alt="" fill sizes="64px" className="object-cover"/></button>)}</div>:null}
  </div>
  <div>
   <div className="volt-kicker">TECH / READY</div>
   <h1 className="volt-title mt-2 text-2xl sm:text-3xl">{data.product.name}</h1>
   {data.ratingAverage!==null?<div className="mt-2 text-xs font-bold text-[var(--volt-amber)]">★ {data.ratingAverage.toFixed(1)} <span className="text-slate-500">({data.ratingCount})</span></div>:null}
   <div className="mt-4 flex items-baseline gap-3"><strong className="text-2xl font-black text-[var(--volt-cyan)]">{formatSouqPrice(displayPrice,data.lang,data.currency)}</strong>{data.product.compareAtPriceCents&&data.product.compareAtPriceCents>displayPrice?<span className="text-sm text-slate-500 line-through">{formatSouqPrice(data.product.compareAtPriceCents,data.lang,data.currency)}</span>:null}</div>
   {data.description?<p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-400">{data.description}</p>:null}
   <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400">
    <div className="volt-panel flex min-h-16 flex-col items-center justify-center gap-1 p-2"><VoltIcon name="cash" className="h-4 w-4 text-[var(--volt-cyan)]"/>الدفع عند الاستلام</div>
    <div className="volt-panel flex min-h-16 flex-col items-center justify-center gap-1 p-2"><VoltIcon name="truck" className="h-4 w-4 text-[var(--volt-cyan)]"/>58 ولاية</div>
    <div className="volt-panel flex min-h-16 flex-col items-center justify-center gap-1 p-2"><VoltIcon name="shield" className="h-4 w-4 text-[var(--volt-cyan)]"/>طلب آمن</div>
   </div>
   {data.optionGroups.length?<section className="mt-6 border-t border-[var(--volt-border)] pt-5"><h2 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-300">اختر المواصفات</h2><SouqOptionPickers groups={data.optionGroups} state={form} copy={data.copy} lang={data.lang}/></section>:null}
   {data.settings.showQuantityOffers?<section className="mt-5"><SouqQuantityOffers baseUnitCents={displayPrice} offers={data.offers} productId={data.product.id} quantity={form.quantity} onChange={form.setQuantity} copy={data.copy} lang={data.lang} currency={data.currency}/></section>:null}
   <div className="volt-order-form mt-6"><SouqOrderFormView data={{...data,showOptionPickers:false,showQuantityOffers:false}} form={form} formRef={formRef}/></div>
  </div>
 </div>
}
