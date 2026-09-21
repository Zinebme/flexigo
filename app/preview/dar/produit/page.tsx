import type { Metadata } from "next";
import Link from "next/link";
import { darCssVars } from "@/lib/storefront/dar/tokens";
import { DarContainer } from "@/components/storefront/templates-v2/dar/dar-ui";
import { DarProductView } from "@/components/storefront/templates-v2/dar/dar-product-view";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { SOUQ_CHECKOUT_DEFAULTS } from "@/lib/storefront/souq/checkout-settings";
import { buildOptionGroups } from "@/lib/storefront/souq/variants";
import type { SouqVariantInput } from "@/lib/storefront/souq/variants";
import "@/components/storefront/templates-v2/dar/dar.css";

export const dynamic="force-static";
export const metadata:Metadata={title:"DAR — صفحة المنتج",robots:{index:false,follow:false}};

const variants:SouqVariantInput[]=[
 {id:"d1000000-0000-4000-8000-000000000001",name:"بيج / متوسط",options:{"اللون":"بيج","الحجم":"متوسط"},price_cents:290000,stock:8,is_active:true},
 {id:"d1000000-0000-4000-8000-000000000002",name:"زيتوني / متوسط",options:{"اللون":"زيتوني","الحجم":"متوسط"},price_cents:290000,stock:6,is_active:true},
 {id:"d1000000-0000-4000-8000-000000000003",name:"بيج / كبير",options:{"اللون":"بيج","الحجم":"كبير"},price_cents:340000,stock:4,is_active:true},
];
const groups=buildOptionGroups(variants,null,[]);
export default function DarProductPreview(){
 return <div dir="rtl" className="dar-root min-h-screen" style={darCssVars()}>
  <div className="bg-[var(--dar-olive-dark)] px-3 py-2 text-center text-[11px] font-bold text-white">معاينة تفاعلية — الإرسال الحقيقي معطل</div>
  <DarContainer className="py-6"><Link href="/preview/dar" className="text-xs font-bold text-[var(--dar-muted)]">← العودة إلى DAR</Link><div className="mt-5"><DarProductView data={{
   storeSlug:"dar-demo",base:"/preview/dar",copy:souqCopy("ar"),lang:"ar",currency:"DZD",settings:SOUQ_CHECKOUT_DEFAULTS,
   product:{id:"d1000000-0000-4000-8000-000000000000",slug:"organizer",name:"منظم منزلي متعدد الاستعمال",priceCents:290000,compareAtPriceCents:340000,imageUrl:"/images/dar/storage-premium.webp",stock:20,ratingAverage:4.8,ratingCount:96},
   variants,optionGroups:groups,addOnProducts:[],offers:[{id:"d1000000-0000-4000-8000-000000000010",store_id:"d1000000-0000-4000-8000-000000000099",product_id:"d1000000-0000-4000-8000-000000000000",min_quantity:2,total_price_cents:540000,label:"عرض قطعتين",is_active:true}],
   zones:[{wilaya_code:0,home_fee_cents:60000,office_fee_cents:40000,is_active:true},{wilaya_code:16,home_fee_cents:50000,office_fee_cents:30000,is_active:true}],
   officeDeliveryEnabled:true,whatsapp:null,previewMode:true,previewOrderNumber:"DEMO-DAR-001",anchorId:"dar-order-form",
   images:["/images/dar/storage-premium.webp","/images/dar/hero-premium.webp"],description:"منظم عملي متعدد الاستعمال مناسب للمطبخ، الحمام أو غرفة التخزين. تصميم بسيط وألوان دافئة مع خيارات حجم ولون.",ratingAverage:4.8,ratingCount:96,
   shipping:{hasZones:true,homeFromCents:50000,officeFromCents:30000,officeEnabled:true}
  }}/></div></DarContainer>
 </div>
}
