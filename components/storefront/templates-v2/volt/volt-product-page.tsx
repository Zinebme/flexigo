import { notFound } from "next/navigation";
import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqProductBySlug, loadSouqZones, souqCheckoutSettingsFor } from "@/lib/storefront/souq/catalog";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { VoltContainer, VoltHeading } from "./volt-ui";
import { VoltProductView } from "./volt-product-view";
import { VoltProductCard } from "./volt-product-card";

export async function VoltProductPage({data,productSlug}:{data:StorefrontData;productSlug:string}){
 const [bundle,zones]=await Promise.all([loadSouqProductBySlug(data.id,productSlug,data.settings),loadSouqZones(data.id)]); if(!bundle) notFound();
 const {product}=bundle; const copy=souqCopy(data.lang); const settings=souqCheckoutSettingsFor(data.settings);
 return <>
  <VoltContainer className="py-5 sm:py-8">
   <nav className="mb-5 flex items-center gap-2 overflow-x-auto text-[11px] font-bold text-slate-500"><Link href={data.base}>الرئيسية</Link><span>/</span><Link href={`${data.base}/boutique`}>المتجر</Link><span>/</span><span className="truncate text-slate-700">{product.name}</span></nav>
   <VoltProductView data={{storeSlug:data.slug,base:data.base,copy,lang:data.lang,currency:data.currency,settings,product:{id:product.id,slug:product.slug,name:product.name,priceCents:product.price_cents,compareAtPriceCents:product.compare_at_price_cents,imageUrl:bundle.images[0]??null,stock:product.stock,ratingAverage:bundle.ratingAverage,ratingCount:bundle.ratingCount},variants:bundle.variants,optionGroups:bundle.optionGroups,addOnProducts:bundle.addOnProducts,offers:bundle.offers,zones,officeDeliveryEnabled:bundle.shipping.officeEnabled,whatsapp:data.settings?.contact?.whatsapp??null,anchorId:"volt-order-form",images:bundle.images,description:product.description??null,ratingAverage:bundle.ratingAverage,ratingCount:bundle.ratingCount,shipping:bundle.shipping}}/>
  </VoltContainer>
  {product.description?<section className="volt-section border-y border-[var(--volt-border)] bg-white"><VoltContainer className="max-w-3xl"><VoltHeading eyebrow="SPEC / DETAILS" title="تفاصيل المنتج"/><p className="whitespace-pre-line text-sm leading-8 text-slate-600">{product.description}</p></VoltContainer></section>:null}
  {bundle.faq.length?<section className="volt-section"><VoltContainer className="max-w-3xl"><VoltHeading eyebrow="FAQ" title="أسئلة شائعة"/><div>{bundle.faq.map(f=><details key={f.id} className="border-b border-[var(--volt-border)] py-4"><summary className="cursor-pointer text-sm font-extrabold">{f.question}</summary><p className="pt-3 text-sm leading-7 text-slate-600">{f.answer}</p></details>)}</div></VoltContainer></section>:null}
  {bundle.related.length?<section className="volt-section bg-white"><VoltContainer><VoltHeading eyebrow="MORE TECH" title="منتجات قد تعجبك"/><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{bundle.related.slice(0,4).map(p=><VoltProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div></VoltContainer></section>:null}
 </>
}
