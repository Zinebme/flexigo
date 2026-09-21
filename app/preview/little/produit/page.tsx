import type { Metadata } from "next";
import Link from "next/link";
import { littleCssVars } from "@/lib/storefront/little/tokens";
import { LittleContainer } from "@/components/storefront/templates-v2/little/little-ui";
import { LittleProductView } from "@/components/storefront/templates-v2/little/little-product-view";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { SOUQ_CHECKOUT_DEFAULTS } from "@/lib/storefront/souq/checkout-settings";
import { buildOptionGroups } from "@/lib/storefront/souq/variants";
import type { SouqVariantInput } from "@/lib/storefront/souq/variants";
import "@/components/storefront/templates-v2/little/little.css";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "LITTLE — صفحة المنتج",
  robots: { index: false, follow: false },
};
const variants: SouqVariantInput[] = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    name: "وردي / 2 سنوات",
    options: { اللون: "وردي", العمر: "2 سنوات" },
    price_cents: 390000,
    stock: 8,
    is_active: true,
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    name: "أزرق / 2 سنوات",
    options: { اللون: "أزرق", العمر: "2 سنوات" },
    price_cents: 390000,
    stock: 6,
    is_active: true,
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    name: "وردي / 3 سنوات",
    options: { اللون: "وردي", العمر: "3 سنوات" },
    price_cents: 420000,
    stock: 4,
    is_active: true,
  },
];
const groups = buildOptionGroups(variants, null, []);
export default function Page() {
  return (
    <div dir="rtl" className="little-root min-h-screen" style={littleCssVars()}>
      <div className="bg-[var(--little-pink)] px-3 py-2 text-center text-[11px] font-bold text-white">
        معاينة تفاعلية — لا توجد طلبات حقيقية
      </div>
      <LittleContainer className="py-6">
        <Link href="/preview/little" className="text-xs font-bold text-slate-500">
          ← العودة إلى LITTLE
        </Link>
        <div className="mt-5">
          <LittleProductView
            data={{
              storeSlug: "little-demo",
              base: "/preview/little",
              copy: souqCopy("ar"),
              lang: "ar",
              currency: "DZD",
              settings: SOUQ_CHECKOUT_DEFAULTS,
              product: {
                id: "b1000000-0000-4000-8000-000000000000",
                slug: "baby-set",
                name: "طقم أطفال ناعم LITTLE",
                priceCents: 390000,
                compareAtPriceCents: 450000,
                imageUrl: "/images/little/baby-premium.webp",
                stock: 20,
                ratingAverage: 4.9,
                ratingCount: 112,
              },
              variants,
              optionGroups: groups,
              addOnProducts: [],
              offers: [
                {
                  id: "b1000000-0000-4000-8000-000000000010",
                  store_id: "b1000000-0000-4000-8000-000000000099",
                  product_id: "b1000000-0000-4000-8000-000000000000",
                  min_quantity: 2,
                  total_price_cents: 740000,
                  label: "عرض قطعتين",
                  is_active: true,
                },
              ],
              zones: [
                {
                  wilaya_code: 0,
                  home_fee_cents: 60000,
                  office_fee_cents: 40000,
                  is_active: true,
                },
                {
                  wilaya_code: 16,
                  home_fee_cents: 50000,
                  office_fee_cents: 30000,
                  is_active: true,
                },
              ],
              officeDeliveryEnabled: true,
              whatsapp: null,
              previewMode: true,
              previewOrderNumber: "DEMO-LITTLE-001",
              anchorId: "little-order-form",
              images: [
                "/images/little/baby-premium.webp",
                "/images/little/hero-premium.webp",
              ],
              description:
                "طقم ناعم ومريح للأطفال مع خيارات اللون والعمر، مصمم لتجربة شراء سهلة وواضحة.",
              ratingAverage: 4.9,
              ratingCount: 112,
              shipping: {
                hasZones: true,
                homeFromCents: 50000,
                officeFromCents: 30000,
                officeEnabled: true,
              },
            }}
          />
        </div>
      </LittleContainer>
    </div>
  );
}
