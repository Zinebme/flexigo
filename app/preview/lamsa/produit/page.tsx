import type { Metadata } from "next";
import Link from "next/link";
import { LamsaHeader } from "@/components/storefront/templates-v2/lamsa/lamsa-header";
import { LamsaFooter } from "@/components/storefront/templates-v2/lamsa/lamsa-footer";
import { LamsaProductView } from "@/components/storefront/templates-v2/lamsa/lamsa-product-view";
import { LamsaContainer, LamsaIcon } from "@/components/storefront/templates-v2/lamsa/lamsa-ui";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { lamsaCssVars } from "@/lib/storefront/lamsa/tokens";
import { lamsaFontVariables } from "@/lib/storefront/lamsa/fonts";
import { LAMSA_DEMO_BASE, lamsaDemoCheckoutSettings, lamsaDemoOffers, lamsaDemoOptionGroups, lamsaDemoProducts, lamsaDemoSearch, lamsaDemoVariants, lamsaDemoZones } from "@/lib/preview/lamsa-demo";
import "@/components/storefront/templates-v2/lamsa/lamsa.css";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "عباية يومية أنيقة — معاينة LAMSA", robots: { index: false, follow: false } };
const copy = lamsaCopy("ar");
const product = lamsaDemoProducts[0]!;
const nav = [{ href: LAMSA_DEMO_BASE, label: copy.nav.home }, { href: `${LAMSA_DEMO_BASE}#new`, label: copy.nav.newArrivals }, { href: `${LAMSA_DEMO_BASE}#collections`, label: copy.nav.categories }, { href: `${LAMSA_DEMO_BASE}#best`, label: copy.nav.bestSellers }];

export default function LamsaProductPreview() {
  return (
    <div dir="rtl" className={`lamsa-root ${lamsaFontVariables} min-h-screen`} style={lamsaCssVars()} data-template="lamsa-v1" data-preview="true">
      <div className="bg-[var(--lamsa-gold)] px-3 py-2 text-center text-[11px] font-semibold text-[var(--lamsa-ink)]">وضع المعاينة — يمكنكِ تجربة الخيارات والنموذج، ولن يتم إرسال أو إنشاء طلب حقيقي</div>
      <LamsaHeader storeName="لمسة بوتيك" base={LAMSA_DEMO_BASE} logoUrl={null} announcement="توصيل إلى 58 ولاية • الدفع عند الاستلام" copy={copy} lang="ar" currency="DZD" searchIndex={lamsaDemoSearch.map((item) => ({ ...item, slug: "produit" }))} categories={[]} nav={nav} whatsapp={null} />
      <main>
        <LamsaContainer className="py-4 sm:py-7">
          <nav className="flex items-center gap-1.5 text-[11px] text-[var(--lamsa-muted)]"><Link href={LAMSA_DEMO_BASE}>{copy.nav.home}</Link><LamsaIcon name="chevron-left" className="h-3 w-3" /><span>{product.categoryName}</span><LamsaIcon name="chevron-left" className="h-3 w-3" /><span className="text-[var(--lamsa-ink)]">{product.name}</span></nav>
          <div className="mt-5"><LamsaProductView data={{
            storeSlug: "lamsa-demo-readonly", base: LAMSA_DEMO_BASE, copy, lang: "ar", currency: "DZD", settings: lamsaDemoCheckoutSettings,
            product: { id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents, compareAtPriceCents: product.compareAtPriceCents, imageUrl: product.image, stock: product.stock, ratingAverage: product.ratingAverage, ratingCount: product.ratingCount },
            variants: lamsaDemoVariants, optionGroups: lamsaDemoOptionGroups, addOnProducts: [], offers: lamsaDemoOffers, zones: lamsaDemoZones,
            officeDeliveryEnabled: true, whatsapp: null, anchorId: "lamsa-order-form", previewMode: true, previewOrderNumber: "DEMO-LAMSA",
            images: ["/images/lamsa/abaya.jpg", "/images/lamsa/editorial.jpg", "/images/lamsa/scarf.jpg"],
            description: "عباية يومية بقصّة واسعة وانسيابية هادئة. اختاري اللون، المقاس ونوع القماش من الخيارات المتوفرة فعلياً في المعاينة.",
            ratingAverage: product.ratingAverage, ratingCount: product.ratingCount,
            shipping: { hasZones: true, homeFromCents: 50000, officeFromCents: 35000, officeEnabled: true },
          }} /></div>
        </LamsaContainer>
        <section className="lamsa-section border-t border-[var(--lamsa-border)] bg-[var(--lamsa-white)]"><LamsaContainer className="max-w-3xl"><p className="lamsa-eyebrow">تفاصيل القطعة</p><h2 className="lamsa-display mt-2 text-2xl text-[var(--lamsa-chocolate)]">الوصف</h2><p className="mt-4 text-sm leading-8 text-[var(--lamsa-muted)]">هذا محتوى تجريبي للمعاينة البصرية فقط. في المتجر الحقيقي، تُعرض هنا معلومات الوصف والخامة والطول والعناية التي يضيفها التاجر، ولا ينشئ القالب صفات غير موجودة.</p></LamsaContainer></section>
      </main>
      <LamsaFooter storeName="لمسة بوتيك" base={LAMSA_DEMO_BASE} logoUrl={null} copy={copy} categories={[]} contact={{ phone: "0550 12 34 56", whatsapp: null, email: "contact@lamsa.demo", address: "الجزائر", instagram: "https://instagram.com/lamsa.demo", facebook: null, tiktok: null }} faqEnabled />
    </div>
  );
}
