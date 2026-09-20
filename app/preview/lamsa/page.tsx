import type { Metadata } from "next";
import Link from "next/link";
import { LamsaHeader } from "@/components/storefront/templates-v2/lamsa/lamsa-header";
import { LamsaFooter } from "@/components/storefront/templates-v2/lamsa/lamsa-footer";
import { LamsaProductCard } from "@/components/storefront/templates-v2/lamsa/lamsa-product-card";
import { LamsaContainer, LamsaHeading, LamsaIcon, LamsaStars } from "@/components/storefront/templates-v2/lamsa/lamsa-ui";
import { StorefrontImage } from "@/components/storefront/image";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { lamsaCssVars } from "@/lib/storefront/lamsa/tokens";
import { lamsaFontVariables } from "@/lib/storefront/lamsa/fonts";
import { LAMSA_DEMO_BASE, lamsaDemoCategories, lamsaDemoFaq, lamsaDemoProducts, lamsaDemoReviews, lamsaDemoSearch } from "@/lib/preview/lamsa-demo";
import "@/components/storefront/templates-v2/lamsa/lamsa.css";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "LAMSA — معاينة القالب", description: "معاينة ثابتة وآمنة لقالب LAMSA العربي للأزياء المحتشمة.", robots: { index: false, follow: false } };

const copy = lamsaCopy("ar");
const previewProducts = lamsaDemoProducts.map((product) => ({ ...product, slug: "produit" }));
const previewSearch = lamsaDemoSearch.map((product) => ({ ...product, slug: "produit" }));
const nav = [
  { href: LAMSA_DEMO_BASE, label: copy.nav.home }, { href: "#new", label: copy.nav.newArrivals },
  { href: "#collections", label: copy.nav.categories }, { href: "#best", label: copy.nav.bestSellers },
  { href: "#campaign", label: copy.nav.offers }, { href: "#story", label: copy.nav.about }, { href: "#footer", label: copy.nav.contact },
];

export default function LamsaPreviewPage() {
  return (
    <div dir="rtl" className={`lamsa-root ${lamsaFontVariables} min-h-screen`} style={lamsaCssVars()} data-template="lamsa-v1" data-preview="true">
      <div className="bg-[var(--lamsa-gold)] px-3 py-2 text-center text-[11px] font-semibold text-[var(--lamsa-ink)]">معاينة LAMSA للعرض فقط — البيانات ثابتة ولا يتم إنشاء أي طلب حقيقي</div>
      <LamsaHeader storeName="لمسة بوتيك" base={LAMSA_DEMO_BASE} logoUrl={null} announcement="توصيل إلى 58 ولاية • الدفع عند الاستلام" copy={copy} lang="ar" currency="DZD" searchIndex={previewSearch} categories={[]} nav={nav} whatsapp={null} />
      <main>
        <section className="overflow-hidden border-b border-[var(--lamsa-border)]">
          <LamsaContainer className="grid px-0 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-8 xl:py-12">
            <div className="lamsa-reveal relative aspect-[4/5] overflow-hidden bg-[var(--lamsa-beige)] sm:aspect-[16/10] lg:order-2 lg:aspect-[4/5] lg:max-h-[680px]"><StorefrontImage src="/images/lamsa/hero.jpg" alt="مجموعة لمسة للأزياء المحتشمة" fill priority sizes="(max-width:1024px) 100vw,55vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/25 via-transparent lg:hidden" /></div>
            <div className="lamsa-fade-up relative mx-4 -mt-12 bg-[var(--lamsa-ivory)] px-5 py-7 sm:mx-10 sm:px-9 lg:order-1 lg:mx-0 lg:mt-0 lg:bg-transparent lg:pe-16">
              <p className="lamsa-eyebrow">مجموعة الموسم</p><h1 className="lamsa-display mt-3 text-[2rem] leading-[1.55] text-[var(--lamsa-chocolate)] sm:text-[2.8rem] xl:text-[3.5rem]">أناقتك تبدأ من التفاصيل</h1><p className="mt-4 max-w-lg text-sm leading-8 text-[var(--lamsa-muted)] sm:text-base">تصاميم مختارة تجمع بين الأناقة، الراحة والاحتشام</p><a href="#new" className="lamsa-primary-button mt-7">اكتشفي المجموعة<LamsaIcon name="arrow-left" className="h-4 w-4" /></a>
            </div>
          </LamsaContainer>
        </section>

        <section id="new" className="lamsa-section bg-[var(--lamsa-white)]"><LamsaContainer><LamsaHeading eyebrow="الجديد" title="وصل حديثاً" subtitle="قطع جديدة اختيرت لترافقكِ بأناقة كل يوم" action={<Link href={`${LAMSA_DEMO_BASE}/produit`} className="lamsa-text-link">شاهدي المنتج<LamsaIcon name="arrow-left" className="h-3.5 w-3.5" /></Link>} /><ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{previewProducts.slice(0,4).map((product, index) => <li key={product.id}><LamsaProductCard product={product} base={LAMSA_DEMO_BASE} copy={copy} lang="ar" currency="DZD" priority={index < 2} /></li>)}</ul></LamsaContainer></section>

        <section id="collections" className="lamsa-section"><LamsaContainer><LamsaHeading eyebrow="المجموعات" title="اكتشفي المجموعات" subtitle="قصّات وخامات تناسب أسلوبكِ" /><ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-4">{lamsaDemoCategories.map((category, index) => <li key={category.id} className={index === 0 ? "lg:col-span-2" : ""}><a href="#new" className="lamsa-collection group relative block aspect-[3/4] overflow-hidden bg-[var(--lamsa-beige)]"><StorefrontImage src={category.imageUrl ?? ""} alt={category.name} fill sizes="(max-width:640px) 50vw,18vw" className="lamsa-product-image object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-[#211b17]/70 via-transparent" /><span className="lamsa-display absolute inset-x-0 bottom-0 p-3 text-base text-white sm:p-4 sm:text-lg">{category.name}</span></a></li>)}</ul></LamsaContainer></section>

        <section id="best" className="lamsa-section bg-[var(--lamsa-white)]"><LamsaContainer><LamsaHeading eyebrow="مختاراتكنّ" title="الأكثر طلباً" subtitle="قطع محبوبة بتفاصيل هادئة" /><ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{previewProducts.slice(2,6).map((product) => <li key={product.id}><LamsaProductCard product={product} base={LAMSA_DEMO_BASE} copy={copy} lang="ar" /></li>)}</ul></LamsaContainer></section>

        <section id="story" className="lamsa-section"><LamsaContainer><div className="relative min-h-[440px] overflow-hidden sm:min-h-[560px]"><StorefrontImage src="/images/lamsa/editorial.jpg" alt="إطلالة لمسة" fill sizes="1200px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-l from-[#211b17]/58 via-[#211b17]/10" /><div className="absolute inset-0 flex items-end p-6 sm:items-center sm:p-12 lg:p-16"><div className="max-w-lg text-white"><p className="lamsa-eyebrow !text-[var(--lamsa-beige)]">حكاية قماش</p><h2 className="lamsa-display mt-3 text-3xl leading-[1.6] sm:text-4xl">بساطة تعكس حضوركِ</h2><p className="mt-3 text-sm leading-7 text-white/80">ألوان هادئة، خامات مريحة وتفاصيل تُصنع لتدوم</p><a href="#new" className="mt-6 inline-flex min-h-12 items-center border border-white px-6 text-sm font-semibold">تسوّقي الإطلالة</a></div></div></div></LamsaContainer></section>

        <section id="campaign" className="border-y border-[var(--lamsa-border)] bg-[var(--lamsa-beige)]/55 py-12"><LamsaContainer className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="lamsa-eyebrow">عرض خاص</p><h2 className="lamsa-display mt-2 text-2xl text-[var(--lamsa-chocolate)] sm:text-3xl">اختاري أكثر، وفّري أكثر</h2><p className="mt-2 text-sm text-[var(--lamsa-muted)]">شاهدي عروض الكمية وتحديث المجموع مباشرة داخل صفحة المنتج.</p></div><Link href={`${LAMSA_DEMO_BASE}/produit`} className="lamsa-outline-button">جرّبي الطلب<LamsaIcon name="arrow-left" className="h-4 w-4" /></Link></LamsaContainer></section>

        <section className="lamsa-section"><LamsaContainer><LamsaHeading title="تجربة تسوّق بكل طمأنينة" align="center" /><ul className="grid grid-cols-2 border border-[var(--lamsa-border)] sm:grid-cols-4">{[{i:"cash" as const,t:"الدفع عند الاستلام"},{i:"truck" as const,t:"توصيل إلى 58 ولاية"},{i:"phone" as const,t:"تأكيد الطلب"},{i:"headset" as const,t:"خدمة الزبائن"}].map((item) => <li key={item.t} className="border border-[var(--lamsa-border)] p-5 text-center"><LamsaIcon name={item.i} className="mx-auto h-5 w-5 text-[var(--lamsa-gold)]" /><p className="mt-3 text-xs font-semibold">{item.t}</p></li>)}</ul></LamsaContainer></section>

        <section className="lamsa-section bg-[var(--lamsa-beige)]/42"><LamsaContainer><LamsaHeading eyebrow="كلماتكنّ" title="قالوا عن لمسة" subtitle="محتوى تجريبي يوضح معالجة بطاقات الآراء" align="center" /><ul className="grid gap-4 sm:grid-cols-3">{lamsaDemoReviews.map((review) => <li key={review.id}><figure className="h-full bg-[var(--lamsa-white)] p-6"><span className="lamsa-display text-4xl text-[var(--lamsa-gold)]">“</span><LamsaStars value={review.rating} /><blockquote className="mt-4 text-sm leading-7 text-[var(--lamsa-muted)]">{review.body}</blockquote><figcaption className="mt-5 border-t border-[var(--lamsa-border)] pt-3 text-xs font-semibold">{review.customerName}</figcaption></figure></li>)}</ul></LamsaContainer></section>

        <section className="lamsa-section"><LamsaContainer><LamsaHeading eyebrow="إلهام" title="تابعينا على إنستغرام" subtitle="تنسيقات هادئة لأيامكِ" /><ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">{["/images/lamsa/abaya.jpg","/images/lamsa/khimar.jpg","/images/lamsa/hijab.jpg","/images/lamsa/dress.jpg","/images/lamsa/isdal.jpg"].map((image,index) => <li key={image} className={index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}><div className="relative aspect-square overflow-hidden"><StorefrontImage src={image} alt="إطلالة محتشمة" fill sizes="(max-width:640px) 50vw,25vw" className="lamsa-product-image object-cover" /></div></li>)}</ul></LamsaContainer></section>

        <section className="lamsa-section bg-[var(--lamsa-white)]"><LamsaContainer className="max-w-3xl"><LamsaHeading eyebrow="قبل الطلب" title="أسئلة تتكرر" /><div className="border-t border-[var(--lamsa-border)]">{lamsaDemoFaq.map((faq) => <details key={faq.id} className="lamsa-faq border-b border-[var(--lamsa-border)]"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold"><span>{faq.question}</span><LamsaIcon name="plus" className="lamsa-faq-icon h-4 w-4" /></summary><p className="pb-5 text-sm leading-7 text-[var(--lamsa-muted)]">{faq.answer}</p></details>)}</div></LamsaContainer></section>
      </main>
      <div id="footer"><LamsaFooter storeName="لمسة بوتيك" base={LAMSA_DEMO_BASE} logoUrl={null} copy={copy} categories={[]} contact={{ phone: "0550 12 34 56", whatsapp: null, email: "contact@lamsa.demo", address: "الجزائر", instagram: "https://instagram.com/lamsa.demo", facebook: null, tiktok: null }} faqEnabled /></div>
    </div>
  );
}
