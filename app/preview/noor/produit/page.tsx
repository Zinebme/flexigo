import type { Metadata } from "next";
import Link from "next/link";
import { NoorHeader } from "@/components/storefront/templates-v2/noor/noor-header";
import { NoorFooter } from "@/components/storefront/templates-v2/noor/noor-footer";
import { NoorProductView } from "@/components/storefront/templates-v2/noor/noor-product-view";
import { NoorContainer, NoorIcon } from "@/components/storefront/templates-v2/noor/noor-ui";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { noorCssVars } from "@/lib/storefront/noor/tokens";
import { noorFontVariables } from "@/lib/storefront/noor/fonts";
import { NOOR_DEMO_BASE, noorDemoCheckoutSettings, noorDemoOffers, noorDemoOptionGroups, noorDemoProducts, noorDemoSearch, noorDemoVariants, noorDemoZones } from "@/lib/preview/noor-demo";
import "@/components/storefront/templates-v2/noor/noor.css";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "سيروم ترطيب يومي — معاينة NOOR", robots: { index: false, follow: false } };
const copy = noorCopy("ar");
const product = noorDemoProducts[0]!;
const nav = [
  { href: NOOR_DEMO_BASE, label: copy.nav.home },
  { href: `${NOOR_DEMO_BASE}#new`, label: copy.nav.newArrivals },
  { href: `${NOOR_DEMO_BASE}#categories`, label: copy.nav.categories },
  { href: `${NOOR_DEMO_BASE}#best`, label: copy.nav.bestSellers },
];

export default function NoorProductPreview() {
  return (
    <div dir="rtl" className={`noor-root ${noorFontVariables} min-h-screen`} style={noorCssVars()} data-template="noor-v1" data-preview="true">
      <div className="bg-[var(--noor-plum)] px-3 py-2 text-center text-[11px] font-semibold text-[var(--noor-bg)]">وضع المعاينة — يمكنكِ تجربة الخيارات والنموذج، ولن يتم إرسال أو إنشاء طلب حقيقي</div>
      <NoorHeader storeName="نور بيوتي" base={NOOR_DEMO_BASE} logoUrl={null} announcement="توصيل إلى 58 ولاية • الدفع عند الاستلام" copy={copy} lang="ar" currency="DZD" searchIndex={noorDemoSearch.map((item) => ({ ...item, slug: "produit" }))} categories={[]} nav={nav} whatsapp={null} />
      <main>
        <NoorContainer className="py-4 sm:py-7">
          <nav className="flex items-center gap-1.5 text-[11px] text-[var(--noor-muted)]">
            <Link href={NOOR_DEMO_BASE}>{copy.nav.home}</Link>
            <NoorIcon name="chevron-left" className="h-3 w-3" />
            <span>{product.categoryName}</span>
            <NoorIcon name="chevron-left" className="h-3 w-3" />
            <span className="text-[var(--noor-ink)]">{product.name}</span>
          </nav>
          <div className="mt-5">
            <NoorProductView
              data={{
                storeSlug: "noor-demo-readonly",
                base: NOOR_DEMO_BASE,
                copy,
                lang: "ar",
                currency: "DZD",
                settings: noorDemoCheckoutSettings,
                product: { id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents, compareAtPriceCents: product.compareAtPriceCents, imageUrl: product.image, stock: product.stock, ratingAverage: product.ratingAverage, ratingCount: product.ratingCount },
                variants: noorDemoVariants,
                optionGroups: noorDemoOptionGroups,
                addOnProducts: [],
                offers: noorDemoOffers,
                zones: noorDemoZones,
                officeDeliveryEnabled: true,
                whatsapp: null,
                anchorId: "noor-order-form",
                previewMode: true,
                previewOrderNumber: "DEMO-NOOR",
                images: ["/images/noor/serum.jpg", "/images/noor/texture.jpg", "/images/noor/cream.jpg"],
                description: "سيروم ترطيب يومي خفيف يمتص بسرعة. اختاري الحجم والرائحة من الخيارات المتوفرة فعلياً في المعاينة.",
                ratingAverage: product.ratingAverage,
                ratingCount: product.ratingCount,
                shipping: { hasZones: true, homeFromCents: 50000, officeFromCents: 35000, officeEnabled: true },
              }}
            />
          </div>
        </NoorContainer>
        <section className="noor-section border-t border-[var(--noor-border)] bg-[var(--noor-white)]">
          <NoorContainer className="max-w-3xl">
            <p className="noor-eyebrow">تفاصيل المنتج</p>
            <h2 className="noor-display mt-2 text-2xl text-[var(--noor-plum)]">الوصف</h2>
            <p className="mt-4 text-sm leading-8 text-[var(--noor-muted)]">هذا محتوى تجريبي للمعاينة البصرية فقط. في المتجر الحقيقي، تُعرض هنا معلومات الوصف والمكونات وطريقة الاستخدام التي يضيفها التاجر، ولا ينشئ القالب فوائد أو وعوداً غير موجودة.</p>
          </NoorContainer>
        </section>
      </main>
      <NoorFooter storeName="نور بيوتي" base={NOOR_DEMO_BASE} logoUrl={null} copy={copy} categories={[]} contact={{ phone: "0550 12 34 56", whatsapp: null, email: "contact@noor.demo", address: "الجزائر", instagram: "https://instagram.com/noor.demo", facebook: null, tiktok: null }} faqEnabled />
    </div>
  );
}
