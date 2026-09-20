import Link from "next/link";
import { SouqHeader } from "@/components/storefront/templates-v2/souq/souq-header";
import { SouqFooter } from "@/components/storefront/templates-v2/souq/souq-footer";
import { SouqProductCard } from "@/components/storefront/templates-v2/souq/souq-product-card";
import { SouqContainer, SouqIcon, SouqSectionHeading, SouqStars } from "@/components/storefront/templates-v2/souq/souq-ui";
import { StorefrontImage } from "@/components/storefront/image";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { souqCssVars, souqPalette } from "@/lib/storefront/souq/tokens";
import { SOUQ_PREVIEW_FIXTURE } from "@/lib/preview/souq-demo";
import type { SouqCategory, SouqProductSummary } from "@/lib/storefront/souq/catalog";
import type { SouqSearchItem } from "@/lib/storefront/souq/search";
import "@/components/storefront/templates-v2/souq/souq.css";

export const dynamic = "force-static";

const base = "/preview/souq";

function previewData() {
  const f = SOUQ_PREVIEW_FIXTURE;
  const categoryById = new Map(f.categories.map((c) => [c.id, c]));
  const imageByProduct = new Map<string, string>();
  for (const image of f.images) if (!imageByProduct.has(image.product_id)) imageByProduct.set(image.product_id, image.url);
  const variantCount = new Map<string, number>();
  for (const variant of f.variants) variantCount.set(variant.product_id, (variantCount.get(variant.product_id) ?? 0) + 1);
  const rating = new Map<string, { total: number; count: number }>();
  for (const review of f.reviews) {
    if (!review.product_id) continue;
    const r = rating.get(review.product_id) ?? { total: 0, count: 0 };
    r.total += review.rating; r.count += 1; rating.set(review.product_id, r);
  }
  const products: SouqProductSummary[] = f.products.map((p) => {
    const cat = p.category_id ? categoryById.get(p.category_id) : undefined;
    const rr = rating.get(p.id);
    return {
      id: p.id, slug: p.slug, name: p.name, priceCents: p.price_cents,
      compareAtPriceCents: p.compare_at_price_cents, categoryId: p.category_id,
      categoryName: cat?.name ?? null, categorySlug: cat?.slug ?? null,
      image: imageByProduct.get(p.id) ?? null, isFeatured: p.is_featured,
      stock: p.stock, lowStockThreshold: p.low_stock_threshold, sku: p.sku,
      ratingAverage: rr ? Math.round((rr.total / rr.count) * 10) / 10 : null,
      ratingCount: rr?.count ?? 0, hasVariants: (variantCount.get(p.id) ?? 0) > 0,
    };
  });
  const categories: SouqCategory[] = f.categories.map((c) => ({
    id: c.id, slug: c.slug, name: c.name, imageUrl: c.image_url,
    productCount: f.products.filter((p) => p.category_id === c.id).length,
  }));
  const searchIndex: SouqSearchItem[] = products.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, priceCents: p.priceCents,
    compareAtPriceCents: p.compareAtPriceCents, image: p.image,
    categoryName: p.categoryName, isFeatured: p.isFeatured,
  }));
  return { products, categories, searchIndex };
}

export default function SouqPreviewPage() {
  const f = SOUQ_PREVIEW_FIXTURE;
  const copy = souqCopy("ar");
  const { products, categories, searchIndex } = previewData();
  const palette = souqPalette({
    primary_color: f.theme.primary_color,
    secondary_color: f.theme.secondary_color,
    background_color: f.theme.background_color,
  });
  const nav = [
    { href: base, label: copy.nav.home, exact: true },
    { href: "#products", label: copy.nav.shop },
    { href: "#categories", label: copy.nav.categories },
    { href: "#reviews", label: copy.nav.bestSellers },
  ];

  return (
    <div dir="rtl" className="souq-root min-h-screen" style={souqCssVars(palette)} data-template="souq-v1">
      <SouqHeader storeName={f.store.name} base={base} logoUrl={null} announcement={f.theme.announcement} lang="ar" copy={copy} searchIndex={searchIndex} categories={categories} nav={nav} phone={f.store.settings.contact.phone} whatsapp={f.store.settings.contact.whatsapp} orderHref={`${base}/produit`} />

      <main>
        <section className="relative overflow-hidden border-b border-[var(--souq-border)] bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--souq-primary-soft),transparent_55%)]" />
          <SouqContainer className="relative grid gap-6 py-6 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-14">
            <div className="souq-anim-up">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--souq-accent)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--souq-accent-text)]">
                <SouqIcon name="spark" className="h-3.5 w-3.5" /> عروض هذا الأسبوع
              </span>
              <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[var(--souq-primary)] sm:text-4xl lg:text-[44px]">كل ما تحتاجه في مكان واحد</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">منتجات مختارة بعناية، أسعار مناسبة والدفع عند الاستلام في 58 ولاية.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <a href="#products" className="souq-press inline-flex items-center gap-2 rounded-[16px] bg-[var(--souq-accent)] px-5 py-3.5 text-sm font-extrabold text-[var(--souq-accent-text)]"><SouqIcon name="cart" className="h-5 w-5" /> تسوق الآن</a>
                <a href="#categories" className="souq-press inline-flex items-center gap-2 rounded-[16px] border border-[var(--souq-border)] bg-white px-5 py-3.5 text-sm font-bold text-[var(--souq-primary)]"><SouqIcon name="grid" className="h-5 w-5" /> الأقسام</a>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold text-slate-600">
                <li className="flex items-center gap-1.5"><SouqIcon name="truck" className="h-4 w-4 text-[var(--souq-accent)]" /> توصيل إلى 58 ولاية</li>
                <li className="flex items-center gap-1.5"><SouqIcon name="cash" className="h-4 w-4 text-[var(--souq-accent)]" /> الدفع عند الاستلام</li>
                <li className="flex items-center gap-1.5"><SouqIcon name="shield" className="h-4 w-4 text-[var(--souq-accent)]" /> طلب آمن وسريع</li>
              </ul>
            </div>
            <div className="souq-anim-up souq-delay-1 relative aspect-[4/3] overflow-hidden rounded-[26px] bg-slate-100 shadow-xl">
              <StorefrontImage src="https://picsum.photos/seed/souq-hero/1400/1050" alt="سوق بلس" fill priority sizes="(max-width:1024px) 100vw,50vw" className="object-cover" />
              <div className="absolute inset-x-4 bottom-4 rounded-[18px] bg-white/92 p-3 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between"><span className="font-extrabold text-[var(--souq-primary)]">عروض يومية جديدة</span><span className="rounded-full bg-[var(--souq-accent)] px-3 py-1 text-xs font-extrabold">COD</span></div>
              </div>
            </div>
          </SouqContainer>
        </section>

        <section id="categories" className="py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title="تسوق حسب القسم" subtitle="اختر القسم الذي يناسبك وابدأ التسوق." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((cat) => <a key={cat.id} href="#products" className="souq-card souq-hover-lift overflow-hidden">
                <div className="relative aspect-[4/3] bg-slate-100"><StorefrontImage src={cat.imageUrl ?? ""} alt={cat.name} fill sizes="200px" className="object-cover" /></div>
                <div className="p-3"><div className="font-extrabold text-slate-800">{cat.name}</div><div className="mt-1 text-xs text-slate-400">{cat.productCount} منتجات</div></div>
              </a>)}
            </div>
          </SouqContainer>
        </section>

        <section id="products" className="bg-white py-8 sm:py-12">
          <SouqContainer>
            <div className="flex items-end justify-between gap-3"><SouqSectionHeading title="الأكثر رواجاً" subtitle="منتجات يطلبها زبائننا كل يوم." /><Link href={`${base}/produit`} className="mb-6 text-sm font-extrabold text-[var(--souq-primary)]">شاهد المنتج ←</Link></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 6).map((p, i) => <SouqProductCard key={p.id} product={{...p, slug: "produit"}} base={base} copy={copy} lang="ar" priority={i < 2} />)}
            </div>
          </SouqContainer>
        </section>

        <section className="py-8 sm:py-12">
          <SouqContainer>
            <div className="overflow-hidden rounded-[26px] bg-[var(--souq-primary)] p-6 text-white sm:p-10">
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="text-xs font-extrabold text-[var(--souq-accent)]">عرض محدود</div><h2 className="mt-2 text-2xl font-extrabold">وفر أكثر مع عروض الكمية</h2><p className="mt-2 text-sm text-white/75">قطعتان أو ثلاث قطع بسعر أفضل، والمجموع يتحدث مباشرة.</p></div>
                <Link href={`${base}/produit`} className="souq-press rounded-[16px] bg-[var(--souq-accent)] px-6 py-3.5 text-center font-extrabold text-[var(--souq-accent-text)]">جرب نموذج الطلب</Link>
              </div>
            </div>
          </SouqContainer>
        </section>

        <section id="reviews" className="bg-white py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title="آراء الزبائن" subtitle="أمثلة على شكل عرض التقييمات داخل القالب." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {f.reviews.slice(0, 3).map((r) => <figure key={r.id} className="souq-card p-4"><SouqStars value={r.rating} /><blockquote className="mt-3 text-sm leading-relaxed text-slate-600">{r.body}</blockquote><figcaption className="mt-3 text-xs font-bold text-slate-500">{r.customer_name}</figcaption></figure>)}
            </div>
          </SouqContainer>
        </section>
      </main>

      <SouqFooter storeName={f.store.name} base={base} copy={copy} logoUrl={null} description="متجر جزائري عام بتجربة شراء بسيطة وسريعة." contact={{phone:f.store.settings.contact.phone,whatsapp:f.store.settings.contact.whatsapp,email:f.store.settings.contact.email,address:f.store.settings.contact.address,instagram:f.store.settings.contact.instagram,facebook:f.store.settings.contact.facebook,tiktok:null}} categories={categories} faqEnabled year={new Date().getFullYear()} />
    </div>
  );
}
