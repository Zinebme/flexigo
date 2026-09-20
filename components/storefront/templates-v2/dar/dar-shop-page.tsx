import Link from "next/link";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqShop } from "@/lib/storefront/souq/catalog";
import { DarContainer, DarHeading } from "./dar-ui";
import { DarProductCard } from "./dar-product-card";

export async function DarShopPage({data,filter}:{data:StorefrontData;filter?:string|null;sort?:string|null}){
 const {products,categories}=await loadSouqShop(data.id);
 const list=filter==="offers"?products.filter(p=>p.compareAtPriceCents&&p.compareAtPriceCents>p.priceCents):products;
 return <DarContainer className="py-7 sm:py-10"><DarHeading eyebrow="DAR STORE" title={filter==="offers"?"العروض":"المتجر"} subtitle="اختيارات للبيت والمطبخ والتنظيم والديكور."/>
  {categories.length?<div className="mb-6 flex gap-2 overflow-x-auto pb-1">{categories.map(c=><Link key={c.id} href={`${data.base}/categorie/${c.slug}`} className="shrink-0 rounded-full border border-[var(--dar-border)] bg-[var(--dar-paper)] px-4 py-2 text-xs font-bold text-[var(--dar-muted)] hover:border-[var(--dar-olive)]">{c.name}</Link>)}</div>:null}
  {list.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">{list.map(p=><DarProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div>:<div className="dar-paper py-16 text-center text-sm text-[var(--dar-muted)]">لا توجد منتجات حالياً.</div>}
 </DarContainer>
}
export async function DarCategoryPage({data,category}:{data:StorefrontData;category:{id:string;name:string;slug:string;description:string|null}}){
 const {products}=await loadSouqShop(data.id); const list=products.filter(p=>p.categoryId===category.id);
 return <DarContainer className="py-7 sm:py-10"><DarHeading eyebrow="CATEGORY" title={category.name} subtitle={category.description}/>
  {list.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">{list.map(p=><DarProductCard key={p.id} product={p} base={data.base} lang={data.lang} currency={data.currency}/>)}</div>:<div className="dar-paper py-16 text-center text-sm text-[var(--dar-muted)]">لا توجد منتجات في هذا القسم.</div>}
 </DarContainer>
}
