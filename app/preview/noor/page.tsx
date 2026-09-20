import type { Metadata } from "next";
import Link from "next/link";
import { NoorHeader } from "@/components/storefront/templates-v2/noor/noor-header";
import { NoorFooter } from "@/components/storefront/templates-v2/noor/noor-footer";
import { NoorProductCard } from "@/components/storefront/templates-v2/noor/noor-product-card";
import { NoorContainer, NoorHeading, NoorIcon } from "@/components/storefront/templates-v2/noor/noor-ui";
import { NoorBenefits, NoorBeforeAfter, NoorReviewCards, NoorRoutine, NoorSocialGallery, NoorStats } from "@/components/storefront/templates-v2/noor/noor-home-blocks";
import { StorefrontImage } from "@/components/storefront/image";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { noorCssVars } from "@/lib/storefront/noor/tokens";
import { noorFontVariables } from "@/lib/storefront/noor/fonts";
import { NOOR_DEMO_BASE, noorDemoCategories, noorDemoFaq, noorDemoProducts, noorDemoReviews, noorDemoSearch } from "@/lib/preview/noor-demo";
import "@/components/storefront/templates-v2/noor/noor.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "NOOR — معاينة القالب",
  description: "معاينة ثابتة وآمنة لقالب NOOR العربي للعناية والتجميل.",
  robots: { index: false, follow: false },
};

const copy = noorCopy("ar");
const previewProducts = noorDemoProducts.map((product) => ({ ...product, slug: "produit" }));
const previewSearch = noorDemoSearch.map((product) => ({ ...product, slug: "produit" }));
const nav = [
  { href: NOOR_DEMO_BASE, label: copy.nav.home },
  { href: "#new", label: copy.nav.newArrivals },
  { href: "#categories", label: copy.nav.categories },
  { href: "#best", label: copy.nav.bestSellers },
  { href: "#offers", label: copy.nav.offers },
  { href: "#story", label: copy.nav.about },
  { href: "#footer", label: copy.nav.contact },
];

export default function NoorPreviewPage() {
  return (
    <div dir="rtl" className={`noor-root ${noorFontVariables} min-h-screen`} style={noorCssVars()} data-template="noor-v1" data-preview="true">
      <div className="bg-[var(--noor-plum)] px-3 py-2 text-center text-[11px] font-semibold text-[var(--noor-bg)]">معاينة NOOR للعرض فقط — البيانات ثابتة ولا يتم إنشاء أي طلب حقيقي</div>
      <NoorHeader storeName="نور بيوتي" base={NOOR_DEMO_BASE} logoUrl={null} announcement="توصيل إلى 58 ولاية • الدفع عند الاستلام" copy={copy} lang="ar" currency="DZD" searchIndex={previewSearch} categories={[]} nav={nav} whatsapp={null} />
      <main>
        {/* Hero */}
        <section className="overflow-hidden border-b border-[var(--noor-border)] bg-[var(--noor-blush)]/40">
          <NoorContainer className="grid gap-0 px-0 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-8 xl:py-12">
            <div className="noor-reveal relative aspect-[4/5] overflow-hidden bg-[var(--noor-nude)] sm:aspect-[16/10] lg:order-2 lg:aspect-[4/5] lg:max-h-[660px]">
              <StorefrontImage src="/images/noor/hero.jpg" alt="مجموعة نور للعناية" fill priority sizes="(max-width:1024px) 100vw,55vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2b1d20]/25 via-transparent lg:hidden" />
            </div>
            <div className="noor-fade-up relative mx-4 -mt-12 rounded-t-[var(--noor-radius-card)] bg-[var(--noor-bg)] px-5 py-7 sm:mx-10 sm:px-9 lg:order-1 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:pe-14">
              <p className="noor-eyebrow">عناية مختارة بعناية</p>
              <h1 className="noor-display mt-3 text-[2rem] leading-[1.5] text-[var(--noor-plum)] sm:text-[2.8rem] xl:text-[3.4rem]">إشراقتك تبدأ من عناية صحيحة</h1>
              <p className="mt-4 max-w-lg text-sm leading-8 text-[var(--noor-muted)] sm:text-base">اختيارات مختارة بعناية لبشرة أكثر نعومة ونضارة</p>
              <a href="#new" className="noor-primary-button mt-7">اكتشفي المجموعة<NoorIcon name="arrow-left" className="h-4 w-4" /></a>
            </div>
          </NoorContainer>
        </section>

        {/* Categories */}
        <section id="categories" className="noor-section">
          <NoorContainer>
            <NoorHeading eyebrow="الفئات" title={copy.sections.categoriesTitle} subtitle={copy.sections.categoriesSubtitle} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-4">
              {noorDemoCategories.map((category, index) => (
                <li key={category.id} className={index === 0 ? "lg:col-span-2" : ""}>
                  <a href="#new" className="noor-collection group relative block aspect-[3/4] overflow-hidden rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-blush)]">
                    <StorefrontImage src={category.imageUrl ?? ""} alt={category.name} fill sizes="(max-width:640px) 50vw,18vw" className="noor-product-image object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#2b1d20]/65 via-transparent to-transparent" />
                    <span className="noor-display absolute inset-x-0 bottom-0 p-3 text-base text-white sm:p-4 sm:text-lg">{category.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </NoorContainer>
        </section>

        {/* Best sellers */}
        <section id="best" className="noor-section bg-[var(--noor-white)]">
          <NoorContainer>
            <NoorHeading eyebrow="مختاراتكنّ" title={copy.sections.bestTitle} subtitle={copy.sections.bestSubtitle} />
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {previewProducts.slice(0, 4).map((product) => <li key={product.id}><NoorProductCard product={product} base={NOOR_DEMO_BASE} copy={copy} lang="ar" currency="DZD" /></li>)}
            </ul>
          </NoorContainer>
        </section>

        {/* Benefits */}
        <section className="noor-section">
          <NoorContainer>
            <NoorHeading title="عناية بكل ثقة" align="center" />
            <NoorBenefits items={[{ title: "الدفع عند الاستلام", text: "تظهر طريقة الدفع بوضوح داخل نموذج الطلب." }, { title: "توصيل إلى 58 ولاية", text: "خيارات المنزل أو المكتب حسب الولاية." }, { title: "طلب آمن", text: "راجعي التفاصيل قبل التأكيد." }, { title: "خدمة الزبائن", text: "قنوات تواصل يضيفها المتجر." }]} />
          </NoorContainer>
        </section>

        {/* Routine */}
        <section className="noor-section bg-[var(--noor-blush)]/40">
          <NoorContainer>
            <NoorHeading eyebrow="روتين" title="روتينك اليومي" subtitle="ثلاث خطوات بسيطة لعناية متوازنة" align="center" />
            <NoorRoutine steps={[{ title: "التنظيف", text: "ابدئي بغسل البشرة بلطف لإزالة الشوائب." }, { title: "الترطيب", text: "وزّعي السيروم أو الكريم على البشرة." }, { title: "الحماية", text: "أكملي روتينك بما يناسب بشرتكِ." }]} />
          </NoorContainer>
        </section>

        {/* Before / after (merchant-provided demo imagery, honest note) */}
        <section className="noor-section">
          <NoorContainer className="max-w-4xl">
            <NoorHeading title="قبل / بعد" subtitle="مثال توضيحي بمحتوى يوفّره المتجر" align="center" />
            <NoorBeforeAfter beforeImage="/images/noor/texture.jpg" afterImage="/images/noor/cream.jpg" beforeLabel="قبل" afterLabel="بعد" note="صور توضيحية لأغراض المعاينة فقط؛ النتائج تختلف من بشرة لأخرى." layout="slider" />
          </NoorContainer>
        </section>

        {/* Stats */}
        <section className="noor-section bg-[var(--noor-white)]">
          <NoorContainer>
            <NoorHeading title="نتائج تتحدث عنا" align="center" />
            <NoorStats items={[{ value: "95%", label: "من العميلات أحببن ملمس المنتج" }, { value: "4.9", label: "متوسط تقييم المنتجات" }, { value: "58", label: "ولاية نوصل إليها" }]} />
          </NoorContainer>
        </section>

        {/* New arrivals */}
        <section id="new" className="noor-section">
          <NoorContainer>
            <NoorHeading eyebrow="الجديد" title={copy.sections.newTitle} subtitle={copy.sections.newSubtitle} action={<Link href={`${NOOR_DEMO_BASE}/produit`} className="noor-text-link">جرّبي المنتج<NoorIcon name="arrow-left" className="h-3.5 w-3.5" /></Link>} />
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {previewProducts.slice(2, 6).map((product) => <li key={product.id}><NoorProductCard product={product} base={NOOR_DEMO_BASE} copy={copy} lang="ar" currency="DZD" /></li>)}
            </ul>
          </NoorContainer>
        </section>

        {/* Reviews */}
        <section className="noor-section bg-[var(--noor-blush)]/42">
          <NoorContainer>
            <NoorHeading eyebrow="كلماتكنّ" title="قالوا عن نور" subtitle="محتوى تجريبي يوضح معالجة بطاقات الآراء" align="center" />
            <NoorReviewCards reviews={noorDemoReviews} />
          </NoorContainer>
        </section>

        {/* Social gallery */}
        <section className="noor-section">
          <NoorContainer>
            <NoorHeading eyebrow="إلهام" title="اكتشفي عالم نور" subtitle="لمسات بصرية من روح المجموعة" />
            <NoorSocialGallery images={["/images/noor/serum.jpg", "/images/noor/cream.jpg", "/images/noor/perfume.jpg", "/images/noor/hair-mask.jpg", "/images/noor/oil.jpg"]} altBase="نور" />
          </NoorContainer>
        </section>

        {/* FAQ */}
        <section className="noor-section bg-[var(--noor-white)]">
          <NoorContainer className="max-w-3xl">
            <NoorHeading eyebrow="قبل الطلب" title={copy.sections.faqTitle} />
            <div className="border-t border-[var(--noor-border)]">
              {noorDemoFaq.map((faq) => (
                <details key={faq.id} className="noor-faq border-b border-[var(--noor-border)]">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold"><span>{faq.question}</span><NoorIcon name="plus" className="noor-faq-icon h-4 w-4" /></summary>
                  <p className="pb-5 text-sm leading-7 text-[var(--noor-muted)]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </NoorContainer>
        </section>
      </main>
      <NoorFooter storeName="نور بيوتي" base={NOOR_DEMO_BASE} logoUrl={null} copy={copy} categories={[]} contact={{ phone: "0550 12 34 56", whatsapp: null, email: "contact@noor.demo", address: "الجزائر", instagram: "https://instagram.com/noor.demo", facebook: null, tiktok: null }} faqEnabled />
    </div>
  );
}
