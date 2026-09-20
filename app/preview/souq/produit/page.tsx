import Link from "next/link";
import { SouqProductView } from "@/components/storefront/templates-v2/souq/souq-product-view";
import { SouqContainer } from "@/components/storefront/templates-v2/souq/souq-ui";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { buildOptionGroups, type SouqVariantInput } from "@/lib/storefront/souq/variants";
import { SOUQ_CHECKOUT_DEFAULTS } from "@/lib/storefront/souq/checkout-settings";
import { SOUQ_PREVIEW_FIXTURE } from "@/lib/preview/souq-demo";
import "@/components/storefront/templates-v2/souq/souq.css";

export const dynamic = "force-static";

export default function SouqPreviewProductPage() {
  const f = SOUQ_PREVIEW_FIXTURE;
  const p = f.products[0]!;
  const variants: SouqVariantInput[] = f.variants.filter((v) => v.product_id === p.id).map((v) => ({
    id:v.id,name:v.name,options:v.options,price_cents:v.price_cents,stock:v.stock,is_active:v.is_active,
  }));
  const groups = buildOptionGroups(variants, null, []);
  const images = f.images.filter((i) => i.product_id === p.id).sort((a,b)=>a.position-b.position).map((i)=>i.url);
  const reviews = f.reviews.filter((r)=>r.product_id===p.id);
  const ratingAverage = reviews.length ? reviews.reduce((s,r)=>s+r.rating,0)/reviews.length : null;

  return <div dir="rtl" className="souq-root min-h-screen bg-[var(--souq-bg,#f8fafc)]">
    <div className="border-b bg-white"><SouqContainer className="flex h-14 items-center justify-between"><Link href="/preview/souq" className="font-extrabold text-[#0f2a47]">سوق بلس</Link><Link href="/preview/souq" className="text-sm font-bold text-slate-500">العودة إلى المتجر</Link></SouqContainer></div>
    <SouqContainer className="py-5 sm:py-8">
      <SouqProductView data={{
        storeSlug:"souq-plus",
        base:"/preview/souq",
        copy:souqCopy("ar"),
        lang:"ar",
        currency:"DZD",
        settings:SOUQ_CHECKOUT_DEFAULTS,
        product:{id:p.id,slug:p.slug,name:p.name,priceCents:p.price_cents,compareAtPriceCents:p.compare_at_price_cents,imageUrl:images[0]??null,stock:p.stock,ratingAverage,ratingCount:reviews.length},
        variants,
        optionGroups:groups,
        addOnProducts:[],
        offers:f.offers.filter((o)=>o.product_id===p.id || o.product_id===null).map((o)=>({id:o.id,store_id:o.store_id,product_id:o.product_id,min_quantity:o.min_quantity,total_price_cents:o.total_price_cents,label:o.label,is_active:o.is_active})),
        zones:f.zones.map((z)=>({wilaya_code:z.wilaya_code,home_fee_cents:z.home_fee_cents,office_fee_cents:z.office_fee_cents,is_active:z.is_active})),
        officeDeliveryEnabled:true,
        whatsapp:f.store.settings.contact.whatsapp,
        images,
        description:p.description,
        ratingAverage,
        ratingCount:reviews.length,
        shipping:{homeFromCents:50000,officeFromCents:30000,officeEnabled:true},
        benefits:["بطارية تدوم حتى 7 أيام","مقاومة للماء والغبار","توصيل إلى 58 ولاية"],
        anchorId:"souq-preview-form",
      }} />
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">هذه معاينة بصرية فقط. نموذج الطلب تفاعلي، لكن إرسال طلب حقيقي غير مفعّل في وضع المعاينة.</div>
    </SouqContainer>
  </div>;
}
