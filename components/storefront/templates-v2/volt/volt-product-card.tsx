import type { SouqProductSummary } from "@/lib/storefront/souq/catalog";
import type { StoreLanguage } from "@/lib/types";
import { StorefrontImage } from "../../image";
import { VoltIcon, VoltPrice } from "./volt-ui";

export function VoltProductCard({product,base,lang,currency="DZD"}:{product:SouqProductSummary;base:string;lang:StoreLanguage|string|null;currency?:string}){
 const href=`${base}/produit/${product.slug}`; const out=!product.hasVariants&&product.stock<=0;
 return <article className="volt-product group flex h-full flex-col">
  <a href={href} className="relative block aspect-square overflow-hidden bg-[var(--volt-surface-2)]">
   {product.image?<StorefrontImage src={product.image} alt={product.name} fill sizes="(max-width:480px) 48vw,25vw" className="object-cover transition duration-500 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-5xl text-slate-300">⌁</div>}
   <span className="volt-badge absolute start-2 top-2">{product.isFeatured?"TOP":"VOLT"}</span>
   {out?<span className="absolute end-2 top-2 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">غير متوفر</span>:null}
  </a>
  <div className="flex flex-1 flex-col p-3 sm:p-4">
   {product.categoryName?<div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{product.categoryName}</div>:null}
   <a href={href} className="mt-1 line-clamp-2 text-sm font-extrabold leading-6 text-[var(--volt-ink)] hover:text-[var(--volt-blue)]">{product.name}</a>
   <div className="mt-auto pt-3"><VoltPrice cents={product.priceCents} compare={product.compareAtPriceCents} lang={lang} currency={currency}/></div>
   <a href={href} className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--volt-border)] bg-white px-3 text-xs font-extrabold text-[var(--volt-ink)] hover:border-[var(--volt-blue)] hover:text-[var(--volt-blue)]"><VoltIcon name="chevron-left" className="h-4 w-4"/>عرض التفاصيل</a>
  </div>
 </article>
}
