import type { SouqProductSummary } from "@/lib/storefront/souq/catalog";
import type { StoreLanguage } from "@/lib/types";
import { StorefrontImage } from "../../image";
import { DarPrice } from "./dar-ui";

export function DarProductCard({product,base,lang,currency="DZD"}:{product:SouqProductSummary;base:string;lang:StoreLanguage|string|null;currency?:string}){
 const href=`${base}/produit/${product.slug}`;
 return <article className="dar-product group flex h-full flex-col"><a href={href} className="relative block aspect-[4/3] overflow-hidden bg-[var(--dar-cream)]">{product.image?<StorefrontImage src={product.image} alt={product.name} fill sizes="(max-width:480px) 48vw,25vw" className="object-cover transition duration-500 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-5xl">⌂</div>}<span className="dar-chip absolute start-3 top-3">{product.isFeatured?"مفضّل":"DAR"}</span></a><div className="flex flex-1 flex-col p-4">{product.categoryName?<div className="text-[10px] font-bold text-[var(--dar-muted)]">{product.categoryName}</div>:null}<a href={href} className="mt-1 line-clamp-2 text-sm font-extrabold leading-6 hover:text-[var(--dar-olive)]">{product.name}</a><div className="mt-auto pt-3"><DarPrice cents={product.priceCents} compare={product.compareAtPriceCents} lang={lang} currency={currency}/></div><a href={href} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--dar-olive-dark)] px-4 text-xs font-extrabold text-white">عرض المنتج</a></div></article>
}
