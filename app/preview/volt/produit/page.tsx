import type { Metadata } from "next";
import Link from "next/link";
import { voltCssVars } from "@/lib/storefront/volt/tokens";
import { VoltContainer } from "@/components/storefront/templates-v2/volt/volt-ui";
import { VoltProductView } from "@/components/storefront/templates-v2/volt/volt-product-view";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { SOUQ_CHECKOUT_DEFAULTS } from "@/lib/storefront/souq/checkout-settings";
import { buildOptionGroups } from "@/lib/storefront/souq/variants";
import type { SouqVariantInput } from "@/lib/storefront/souq/variants";
import "@/components/storefront/templates-v2/volt/volt.css";

export const dynamic="force-static";
export const metadata:Metadata={title:"ساعة ذكية AMOLED X2 — VOLT",robots:{index:false,follow:false}};

const variants:SouqVariantInput[]=[
 {id:"e1000000-0000-4000-8000-000000000001",name:"أسود / 128GB",options:{"اللون":"أسود","السعة":"128GB"},price_cents:890000,stock:8,is_active:true},
 {id:"e1000000-0000-4000-8000-000000000002",name:"أزرق / 128GB",options:{"اللون":"أزرق","السعة":"128GB"},price_cents:920000,stock:5,is_active:true},
 {id:"e1000000-0000-4000-8000-000000000003",name:"أسود / 256GB",options:{"اللون":"أسود","السعة":"256GB"},price_cents:1040000,stock:4,is_active:true},
];
const groups=buildOptionGroups(variants,null,[]);
export default function VoltProductPreview(){
 return <div dir="rtl" className="volt-root min-h-screen volt-grid-bg" style={voltCssVars()}>
  <div className="bg-[var(--volt-blue)] px-3 py-2 text-center text-[11px] font-bold text-white">توصيل إلى 58 ولاية • الدفع عند الاستلام</div>
  <VoltContainer className="py-6"><Link href="/preview/volt" className="text-xs font-bold text-slate-500">← العودة إلى VOLT</Link><div className="mt-5"><VoltProductView data={{
   storeSlug:"volt-demo",base:"/preview/volt",copy:souqCopy("ar"),lang:"ar",currency:"DZD",settings:SOUQ_CHECKOUT_DEFAULTS,
   product:{id:"e1000000-0000-4000-8000-000000000000",slug:"smart-watch",name:"ساعة ذكية AMOLED X2",priceCents:890000,compareAtPriceCents:1090000,imageUrl:"/images/volt/watch-premium.webp",stock:20,ratingAverage:4.8,ratingCount:128},
   variants,optionGroups:groups,addOnProducts:[],offers:[{id:"e1000000-0000-4000-8000-000000000010",store_id:"e1000000-0000-4000-8000-000000000099",product_id:"e1000000-0000-4000-8000-000000000000",min_quantity:2,total_price_cents:1690000,label:"عرض قطعتين",is_active:true}],
   zones:[{wilaya_code:0,home_fee_cents:60000,office_fee_cents:40000,is_active:true},{wilaya_code:16,home_fee_cents:50000,office_fee_cents:30000,is_active:true}],
   officeDeliveryEnabled:true,whatsapp:null,previewMode:true,previewOrderNumber:"DEMO-VOLT-001",anchorId:"volt-order-form",
   images:["/images/volt/watch-premium.webp","/images/volt/hero-premium.webp"],description:"شاشة AMOLED واضحة، بطارية تدوم طويلاً، إشعارات، تتبع نشاط، وخيارات سعة ولون ديناميكية.",ratingAverage:4.8,ratingCount:128,
   shipping:{hasZones:true,homeFromCents:50000,officeFromCents:30000,officeEnabled:true}
  }}/></div></VoltContainer>
 </div>
}
