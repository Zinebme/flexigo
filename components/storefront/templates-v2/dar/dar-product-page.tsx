import { notFound } from "next/navigation";
import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqProductBySlug, loadSouqZones, souqCheckoutSettingsFor } from "@/lib/storefront/souq/catalog";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { DarContainer, DarHeading } from "./dar-ui";
import { DarProductView } from "./dar-product-view";
import { DarProductCard } from "./dar-product-card";

export async function DarProductPage({data,productSlug}:{data:StorefrontData;productSlug:string}){
 const [bundle,zones]=await Promise.all([loadSouqProductBySlug(data.id,productSlug,data.settings),loadSouqZones(data.id)]); if(!bundle) notFound();
 const {product}=bundle; const copy=souqCopy(data.lang); const settings=souqCheckoutSettingsFor(data.settings);
 return <>
  <DarContainer className="py-5 sm:py-8"><nav className="mb-5 flex items-center gap-2 overflow-x-auto text-[11px] font-bold text-[var(--dar-muted)]"><Link href={data.base}>الرئيسية</Link><span>/</span><Link href={`${data.base}/boutique`}>المتجر</Link><span>/</span><span className="truncate text-[var(--dar-ink)]">{product.name}</span></nav>
   <DarProductView data={{storeSlug:data.slug,base:data.base,copy,lang:data.lang,currency:data.currency,settings,product:{id:product.id,slug:product.slug,name:product.name,priceCents:product.price_cents,compareAtPriceCents:product.compare_at_price_cents,imageUrl:bundle.images[0]??null,stock:product.stock,ratingAverage:bundle.ratingAverage,ratingCount:bundle.ratingCount},variants:bundle.variants,optionGroups:bundle.optionGroups,addOnProducts:bundle.addOnProducts,offers:bundle.offers,zones,officeDeliveryEnabled:bundle.shipping.officeEnabled,whatsapp:data.settings?.contact?.whatsapp??null,anchorId:"dar-order-form",images:bundle.images,description:product.description??null,ratingAverage:bundle.ratingAverage,ratingCount:bundle.ratingCount,shipping:bundle.shipping}}/>
  </DarContainer>
  {product.description?<section className="dar-section border-y border-[var(--dar-border)] bg-[var(--dar-paper)]"><DarContainer className="max-w-3xl"><DarHeading eyebrow="DETAILS" title="تفاصيل المنتج"/><p className="whitespace-pre-line text-sm leading-8 text-[var(--dar-muted)]">{product.description}</p></DarContainer></section>:null}
  {bundle.faq.length?<section className="dar-section"><DarContainer className="max-w-3xl"><DarHeading eyebrow="FAQ" title="أسئلة شائعة"/><div>{bundle.faq.map(f=><details key={f.id} className="border-b border-[var(--dar-border)] py-4"><summary className="cursor-pointer text-sm font-extrabold">{f.question}</summary><p className="pt-3 text-sm leading-7 text-[var(--dar-muted)]">{f.answer}</p></details>)}</div></DarContainer></section>:null}
  {bundle.related.length?<section className="dar-section bg-[var(--dar-paper)]"><DarContainer><DarHeading eyebrow="MORE FOR HOME" title="منتجات قد تعجبك"/><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{bundle.related.slice(0,4).map(p=><DarProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div></DarContainer></section>:null}
 </>
}
