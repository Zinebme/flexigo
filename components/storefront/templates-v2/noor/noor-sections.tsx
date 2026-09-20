import { cache } from "react";
import Link from "next/link";
import type { Section } from "@/lib/sections/definitions";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqHomeBundle } from "@/lib/storefront/souq/catalog";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { StorefrontImage } from "../../image";
import { NoorProductCard } from "./noor-product-card";
import { NoorContainer, NoorHeading, NoorIcon } from "./noor-ui";
import { NoorBenefits, NoorBeforeAfter, NoorReviewCards, NoorRoutine, NoorSocialGallery, NoorStats } from "./noor-home-blocks";

const homeBundle = cache(loadSouqHomeBundle);

export function noorHref(link: string | null | undefined, base: string): string {
  if (!link?.trim()) return base;
  const value = link.trim();
  if (/^(https:|tel:|mailto:)/i.test(value)) return value;
  if (value.startsWith(base)) return value;
  if (value.startsWith("/")) return `${base}${value}`;
  return base;
}

export async function NoorSection({ data, section, index = 0 }: { data: StorefrontData; section: Section; index?: number }) {
  const bundle = await homeBundle(data.id);
  const copy = noorCopy(data.lang);
  const base = data.base;
  const s = section;

  switch (s.type) {
    case "hero": {
      const desktop = s.desktop_image ?? s.image ?? null;
      const mobile = s.mobile_image ?? desktop;
      return (
        <section className="overflow-hidden border-b border-[var(--noor-border)] bg-[var(--noor-blush)]/40">
          <NoorContainer className="grid gap-0 px-0 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-8 xl:py-12">
            <div className="noor-reveal relative aspect-[4/5] overflow-hidden bg-[var(--noor-nude)] sm:aspect-[16/10] lg:order-2 lg:aspect-[4/5] lg:max-h-[660px]">
              {desktop || mobile ? (
                <>
                  {mobile ? <StorefrontImage src={mobile} alt={s.title ?? data.name} fill priority sizes="(max-width: 1023px) 100vw, 1px" className="object-cover lg:hidden" /> : null}
                  {desktop ? <StorefrontImage src={desktop} alt={s.title ?? data.name} fill priority sizes="(max-width: 1023px) 1px, 55vw" className="hidden object-cover lg:block" /> : null}
                </>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2b1d20]/30 via-transparent to-transparent lg:hidden" />
            </div>
            <div className="noor-fade-up relative mx-4 -mt-12 rounded-t-[var(--noor-radius-card)] bg-[var(--noor-bg)] px-5 py-7 sm:mx-10 sm:px-9 lg:order-1 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:pe-14 xl:pe-20">
              {s.badge ? <p className="noor-eyebrow">{s.badge}</p> : null}
              <h1 className="noor-display mt-3 max-w-xl text-[2rem] leading-[1.5] text-[var(--noor-plum)] sm:text-[2.7rem] lg:text-[3rem] xl:text-[3.4rem]">{s.title ?? data.name}</h1>
              {s.subtitle ? <p className="mt-4 max-w-lg text-sm leading-8 text-[var(--noor-muted)] sm:text-base">{s.subtitle}</p> : null}
              {s.button_text ? (
                <Link href={noorHref(s.button_link ?? "/boutique", base)} className="noor-primary-button mt-7">
                  {s.button_text}
                  <NoorIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" />
                </Link>
              ) : null}
              {s.promo_text ? <p className="mt-5 text-xs text-[var(--noor-muted)]">{s.promo_text}</p> : null}
            </div>
          </NoorContainer>
        </section>
      );
    }

    case "collections": {
      const categories = (s.category_id ? bundle.categories.filter((category) => category.id === s.category_id) : bundle.categories).slice(0, s.max_items ?? 6);
      if (!categories.length) return null;
      return (
        <section id={`noor-collections-${index}`} className="noor-section">
          <NoorContainer>
            <NoorHeading eyebrow="الفئات" title={s.title ?? copy.sections.categoriesTitle} subtitle={s.subtitle ?? copy.sections.categoriesSubtitle} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-4">
              {categories.map((category, categoryIndex) => (
                <li key={category.id} className={categoryIndex === 0 ? "lg:col-span-2" : ""}>
                  <Link href={`${base}/categorie/${category.slug}`} className="noor-collection group relative block aspect-[3/4] overflow-hidden rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-blush)]">
                    {category.imageUrl ? <StorefrontImage src={category.imageUrl} alt={category.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 18vw" className="noor-product-image object-cover" /> : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-[#2b1d20]/65 via-transparent to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                      <span className="noor-display block text-base sm:text-lg">{category.name}</span>
                      {category.productCount > 0 ? <span className="mt-1 block text-[10px] text-white/70">{category.productCount} منتجات</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </NoorContainer>
        </section>
      );
    }

    case "products": {
      const source = s.source === "featured" ? bundle.bestSellers : s.source === "latest" ? bundle.latest : bundle.trending;
      const products = source.slice(0, s.product_count ?? 8);
      if (!products.length) return null;
      return (
        <section id={`noor-products-${index}`} className="noor-section bg-[var(--noor-white)]">
          <NoorContainer>
            <NoorHeading
              eyebrow={s.source === "latest" ? "الجديد" : s.source === "featured" ? "مختاراتكنّ" : "نور"}
              title={s.title ?? copy.sections.productsTitle}
              subtitle={s.subtitle}
              action={<Link href={`${base}/boutique${s.source === "latest" ? "?sort=new" : s.source === "featured" ? "?sort=featured" : ""}`} className="noor-text-link">{copy.sections.viewAll}<NoorIcon name="arrow-left" className="h-3.5 w-3.5 ltr:rotate-180" /></Link>}
            />
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
              {products.map((product, productIndex) => (
                <li key={product.id}><NoorProductCard product={product} base={base} copy={copy} lang={data.lang} currency={data.currency} priority={index <= 1 && productIndex < 2} /></li>
              ))}
            </ul>
          </NoorContainer>
        </section>
      );
    }

    case "features": {
      return (
        <section className="noor-section">
          <NoorContainer>
            <NoorHeading title={s.title ?? copy.sections.whyTitle} subtitle={s.subtitle} align="center" />
            <NoorBenefits items={s.items} />
          </NoorContainer>
        </section>
      );
    }

    case "how_it_works": {
      return (
        <section className="noor-section bg-[var(--noor-blush)]/40">
          <NoorContainer>
            <NoorHeading eyebrow="روتين" title={s.title ?? "روتينك اليومي"} subtitle={s.subtitle} align="center" />
            <NoorRoutine steps={s.steps} />
          </NoorContainer>
        </section>
      );
    }

    case "before_after": {
      if (!s.before_image || !s.after_image) return null;
      return (
        <section className="noor-section">
          <NoorContainer className="max-w-4xl">
            <NoorHeading title={s.title ?? "قبل / بعد"} subtitle={s.subtitle} align="center" />
            <NoorBeforeAfter beforeImage={s.before_image} afterImage={s.after_image} beforeLabel={s.before_label} afterLabel={s.after_label} note={s.note} layout={s.layout ?? "split"} />
          </NoorContainer>
        </section>
      );
    }

    case "banner": {
      const desktop = s.desktop_image ?? null;
      const mobile = s.mobile_image ?? desktop;
      if (s.show_desktop === false && s.show_mobile === false) return null;
      return (
        <section className="noor-section">
          <NoorContainer>
            <div className="relative min-h-[430px] overflow-hidden rounded-[var(--noor-radius-card)] bg-[var(--noor-nude)] sm:min-h-[500px] lg:min-h-[540px]">
              {mobile ? <StorefrontImage src={mobile} alt={s.title ?? ""} fill sizes="(max-width:767px) 100vw, 1px" className="object-cover sm:hidden" /> : null}
              {desktop ? <StorefrontImage src={desktop} alt={s.title ?? ""} fill sizes="(max-width:767px) 1px, 1200px" className="hidden object-cover sm:block" /> : null}
              <div className="absolute inset-0 bg-gradient-to-l from-[#2b1d20]/55 via-[#2b1d20]/12 to-transparent" />
              <div className="absolute inset-0 flex items-end p-5 sm:items-center sm:p-10 lg:p-16">
                <div className="max-w-lg text-white">
                  <p className="noor-eyebrow !text-[var(--noor-blush)]">نور</p>
                  {s.title ? <h2 className="noor-display mt-3 text-2xl leading-[1.5] sm:text-4xl">{s.title}</h2> : null}
                  {s.subtitle ? <p className="mt-3 text-sm leading-7 text-white/82 sm:text-base">{s.subtitle}</p> : null}
                  {s.button_text ? (
                    <Link href={noorHref(s.button_link, base)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-white px-6 text-sm font-semibold transition hover:bg-white hover:text-[var(--noor-plum)]">
                      {s.button_text}
                      <NoorIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </NoorContainer>
        </section>
      );
    }

    case "offer": {
      if (!bundle.discounted.length && !s.title && !s.text) return null;
      return (
        <section className="border-y border-[var(--noor-border)] bg-[var(--noor-blush)]/50 py-10 sm:py-14">
          <NoorContainer className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="noor-eyebrow">{copy.sections.offerBadge}</p>
              <h2 className="noor-display mt-2 text-2xl text-[var(--noor-plum)] sm:text-3xl">{s.title ?? copy.sections.flashTitle}</h2>
              {s.subtitle ? <p className="mt-2 text-sm text-[var(--noor-muted)]">{s.subtitle}</p> : null}
              {s.text ? <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--noor-muted)]">{s.text}</p> : null}
            </div>
            <Link href={`${base}/boutique?filter=offers`} className="noor-outline-button">{copy.nav.offers}<NoorIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" /></Link>
          </NoorContainer>
        </section>
      );
    }

    case "social_proof": {
      return (
        <section className="noor-section">
          <NoorContainer>
            <NoorHeading title={s.title ?? "نتائج تتحدث عنا"} align="center" />
            <NoorStats items={s.items} />
          </NoorContainer>
        </section>
      );
    }

    case "reviews": {
      if (!bundle.reviews.length) return null;
      return (
        <section className="noor-section bg-[var(--noor-blush)]/42">
          <NoorContainer>
            <NoorHeading eyebrow="كلماتكنّ" title={s.title ?? `قالوا عن ${data.name}`} subtitle={s.subtitle} align="center" />
            <NoorReviewCards reviews={bundle.reviews} />
          </NoorContainer>
        </section>
      );
    }

    case "gallery": {
      const images = (s.images ?? []).filter((image): image is string => Boolean(image));
      if (!images.length) return null;
      return (
        <section className="noor-section">
          <NoorContainer>
            <NoorHeading eyebrow="إلهام" title={s.title ?? `اكتشفي عالم ${data.name}`} subtitle={s.subtitle} />
            <NoorSocialGallery images={images} altBase={s.title ?? data.name} />
          </NoorContainer>
        </section>
      );
    }

    case "faq": {
      const faqs = bundle.faq.slice(0, s.max_items ?? 6);
      if (!faqs.length) return null;
      return (
        <section className="noor-section bg-[var(--noor-white)]">
          <NoorContainer className="max-w-3xl">
            <NoorHeading eyebrow="قبل الطلب" title={s.title ?? copy.sections.faqTitle} subtitle={s.subtitle} />
            <div className="border-t border-[var(--noor-border)]">
              {faqs.map((faq) => (
                <details key={faq.id} className="noor-faq border-b border-[var(--noor-border)]">
                  <summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-[var(--noor-ink)]">
                    <span>{faq.question}</span>
                    <NoorIcon name="plus" className="noor-faq-icon h-4 w-4 shrink-0" />
                  </summary>
                  <p className="pb-5 text-sm leading-7 text-[var(--noor-muted)]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </NoorContainer>
        </section>
      );
    }

    case "contact": {
      const contact = data.settings?.contact;
      const phone = s.show_phone ? contact?.phone : null;
      const wa = s.show_whatsapp && contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : null;
      const email = s.show_email ? contact?.email : null;
      if (!phone && !wa && !email && !s.text) return null;
      return (
        <section className="py-12 sm:py-16">
          <NoorContainer className="rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-blush)]/40 p-6 text-center sm:p-10">
            <h2 className="noor-display text-2xl text-[var(--noor-plum)] sm:text-3xl">{s.title ?? copy.sections.contactTitle}</h2>
            {s.text ? <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--noor-muted)]">{s.text}</p> : null}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {wa ? <a href={wa} className="noor-primary-button"><NoorIcon name="whatsapp" className="h-4 w-4" />واتساب</a> : null}
              {phone ? <a href={`tel:${phone}`} className="noor-outline-button" dir="ltr"><NoorIcon name="phone" className="h-4 w-4" />{phone}</a> : null}
              {email ? <a href={`mailto:${email}`} className="noor-outline-button" dir="ltr">{email}</a> : null}
            </div>
          </NoorContainer>
        </section>
      );
    }

    case "cta":
      return s.title || s.text ? (
        <section className="bg-[var(--noor-plum)] py-12 text-[var(--noor-bg)]">
          <NoorContainer className="text-center">
            <h2 className="noor-display text-2xl sm:text-3xl">{s.title}</h2>
            {s.text ? <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">{s.text}</p> : null}
            {s.button_text ? <Link href={noorHref(s.button_link, base)} className="mt-6 inline-flex min-h-12 items-center rounded-full border border-white/50 px-6 text-sm font-semibold">{s.button_text}</Link> : null}
          </NoorContainer>
        </section>
      ) : null;

    default:
      return null;
  }
}
