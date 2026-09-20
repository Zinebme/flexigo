import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { VoltContainer, VoltHeading } from "./volt-ui";
import { VoltProductCard } from "./volt-product-card";

export async function VoltShopPage({data,filter}:{data:StorefrontData;filter?:string|null;sort?:string|null}){
 const {products,categories}=await loadSouqShop(data.id);
 const list=filter==="offers"?products.filter(p=>p.compareAtPriceCents&&p.compareAtPriceCents>p.priceCents):products;
 return <VoltContainer className="py-7 sm:py-10"><VoltHeading eyebrow="CATALOG" title={filter==="offers"?"العروض":"المتجر"} subtitle="اختر المنتج المناسب وشاهد المواصفات والخيارات قبل الطلب."/>
  {categories.length?<div className="mb-6 flex gap-2 overflow-x-auto pb-1">{categories.map(c=><Link key={c.id} href={`${data.base}/categorie/${c.slug}`} className="shrink-0 rounded-full border border-[var(--volt-border)] bg-[var(--volt-surface)] px-4 py-2 text-xs font-bold text-slate-300 hover:border-[var(--volt-cyan)]">{c.name}</Link>)}</div>:null}
  {list.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">{list.map(p=><VoltProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div>:<div className="volt-panel py-16 text-center text-sm text-slate-500">لا توجد منتجات حالياً.</div>}
 </VoltContainer>
}
export async function VoltCategoryPage({data,category}:{data:StorefrontData;category:{id:string;name:string;slug:string;description:string|null}}){
 const {products}=await loadSouqShop(data.id); const list=products.filter(p=>p.categoryId===category.id);
 return <VoltContainer className="py-7 sm:py-10"><VoltHeading eyebrow="CATEGORY" title={category.name} subtitle={category.description}/>
  {list.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">{list.map(p=><VoltProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div>:<div className="volt-panel py-16 text-center text-sm text-slate-500">لا توجد منتجات في هذا القسم.</div>}
 </VoltContainer>
}
