import { cache } from "react";
import Link from "next/link";
import type { Section } from "@/lib/sections/definitions";
import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqHomeBundle } from "@/lib/storefront/souq/catalog";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { StorefrontImage } from "../../image";
import { LamsaProductCard } from "./lamsa-product-card";
import { LamsaContainer, LamsaHeading, LamsaIcon, LamsaStars } from "./lamsa-ui";

const homeBundle = cache(loadSouqHomeBundle);

export function lamsaHref(link: string | null | undefined, base: string): string {
  if (!link?.trim()) return base;
  const value = link.trim();
  if (/^(https:|tel:|mailto:)/i.test(value)) return value;
  if (value.startsWith(base)) return value;
  if (value.startsWith("/")) return `${base}${value}`;
  return base;
}

export async function LamsaSection({ data, section, index = 0 }: { data: StorefrontData; section: Section; index?: number }) {
  const bundle = await homeBundle(data.id);
  const copy = lamsaCopy(data.lang);
  const base = data.base;
  const s = section;

  switch (s.type) {
    case "hero": {
      const desktop = s.desktop_image ?? s.image ?? null;
      const mobile = s.mobile_image ?? desktop;
      return (
        <section className="overflow-hidden border-b border-[var(--lamsa-border)] bg-[var(--lamsa-ivory)]">
          <LamsaContainer className="grid gap-0 px-0 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-8 xl:py-12">
            <div className="lamsa-reveal relative aspect-[4/5] overflow-hidden bg-[var(--lamsa-beige)] sm:aspect-[16/10] lg:order-2 lg:aspect-[4/5] lg:max-h-[680px]">
              {desktop || mobile ? (
                <>
                  {mobile ? <StorefrontImage src={mobile} alt={s.title ?? data.name} fill priority sizes="(max-width: 1023px) 100vw, 1px" className="object-cover lg:hidden" /> : null}
                  {desktop ? <StorefrontImage src={desktop} alt={s.title ?? data.name} fill priority sizes="(max-width: 1023px) 1px, 55vw" className="hidden object-cover lg:block" /> : null}
                </>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/30 via-transparent to-transparent lg:hidden" />
            </div>
            <div className="lamsa-fade-up relative mx-4 -mt-12 bg-[var(--lamsa-ivory)] px-5 py-7 sm:mx-10 sm:px-9 lg:order-1 lg:mx-0 lg:mt-0 lg:bg-transparent lg:pe-14 xl:pe-20">
              {s.badge ? <p className="lamsa-eyebrow">{s.badge}</p> : null}
              <h1 className="lamsa-display mt-3 max-w-xl text-[2rem] leading-[1.55] text-[var(--lamsa-chocolate)] sm:text-[2.7rem] lg:text-[3rem] xl:text-[3.45rem]">{s.title ?? data.name}</h1>
              {s.subtitle ? <p className="mt-4 max-w-lg text-sm leading-8 text-[var(--lamsa-muted)] sm:text-base">{s.subtitle}</p> : null}
              {s.button_text ? <Link href={lamsaHref(s.button_link ?? "/boutique", base)} className="lamsa-primary-button mt-7">{s.button_text}<LamsaIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" /></Link> : null}
              {s.promo_text ? <p className="mt-5 text-xs text-[var(--lamsa-taupe)]">{s.promo_text}</p> : null}
            </div>
          </LamsaContainer>
        </section>
      );
    }

    case "collections": {
      const categories = (s.category_id ? bundle.categories.filter((category) => category.id === s.category_id) : bundle.categories).slice(0, s.max_items ?? 6);
      if (!categories.length) return null;
      return (
        <section id={`lamsa-collections-${index}`} className="lamsa-section">
          <LamsaContainer>
            <LamsaHeading eyebrow="المجموعات" title={s.title ?? copy.sections.categoriesTitle} subtitle={s.subtitle ?? copy.sections.categoriesSubtitle} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-4">
              {categories.map((category, categoryIndex) => (
                <li key={category.id} className={categoryIndex === 0 ? "lg:col-span-2" : ""}>
                  <Link href={`${base}/categorie/${category.slug}`} className="lamsa-collection group relative block aspect-[3/4] overflow-hidden bg-[var(--lamsa-beige)]">
                    {category.imageUrl ? <StorefrontImage src={category.imageUrl} alt={category.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 18vw" className="lamsa-product-image object-cover" /> : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-[#211b17]/70 via-transparent to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                      <span className="lamsa-display block text-base sm:text-lg">{category.name}</span>
                      {category.productCount > 0 ? <span className="mt-1 block text-[10px] text-white/70">{category.productCount} {copy.sections.productsTitle}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </LamsaContainer>
        </section>
      );
    }

    case "products": {
      const source = s.source === "featured" ? bundle.bestSellers : s.source === "latest" ? bundle.latest : bundle.trending;
      const products = source.slice(0, s.product_count ?? 8);
      if (!products.length) return null;
      return (
        <section id={`lamsa-products-${index}`} className="lamsa-section bg-[var(--lamsa-white)]">
          <LamsaContainer>
            <LamsaHeading
              eyebrow={s.source === "latest" ? "الجديد" : s.source === "featured" ? "مختاراتكنّ" : "لمسة"}
              title={s.title ?? copy.sections.productsTitle}
              subtitle={s.subtitle}
              action={<Link href={`${base}/boutique${s.source === "latest" ? "?sort=new" : s.source === "featured" ? "?sort=featured" : ""}`} className="lamsa-text-link">{copy.sections.viewAll}<LamsaIcon name="arrow-left" className="h-3.5 w-3.5 ltr:rotate-180" /></Link>}
            />
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
              {products.map((product, productIndex) => <li key={product.id}><LamsaProductCard product={product} base={base} copy={copy} lang={data.lang} currency={data.currency} priority={index <= 1 && productIndex < 2} /></li>)}
            </ul>
          </LamsaContainer>
        </section>
      );
    }

    case "banner": {
      const desktop = s.desktop_image ?? null;
      const mobile = s.mobile_image ?? desktop;
      if (s.show_desktop === false && s.show_mobile === false) return null;
      return (
        <section className="lamsa-section">
          <LamsaContainer>
            <div className="relative min-h-[430px] overflow-hidden bg-[var(--lamsa-beige)] sm:min-h-[500px] lg:min-h-[540px]">
              {mobile ? <StorefrontImage src={mobile} alt={s.title ?? ""} fill sizes="(max-width:767px) 100vw, 1px" className="object-cover sm:hidden" /> : null}
              {desktop ? <StorefrontImage src={desktop} alt={s.title ?? ""} fill sizes="(max-width:767px) 1px, 1200px" className="hidden object-cover sm:block" /> : null}
              <div className="absolute inset-0 bg-gradient-to-l from-[#211b17]/55 via-[#211b17]/12 to-transparent" />
              <div className="absolute inset-0 flex items-end p-5 sm:items-center sm:p-10 lg:p-16">
                <div className="max-w-lg text-white">
                  <p className="lamsa-eyebrow !text-[var(--lamsa-beige)]">حكاية قماش</p>
                  {s.title ? <h2 className="lamsa-display mt-3 text-2xl leading-[1.6] sm:text-4xl">{s.title}</h2> : null}
                  {s.subtitle ? <p className="mt-3 text-sm leading-7 text-white/82 sm:text-base">{s.subtitle}</p> : null}
                  {s.button_text ? <Link href={lamsaHref(s.button_link, base)} className="mt-6 inline-flex min-h-12 items-center gap-2 border border-white px-6 text-sm font-semibold transition hover:bg-white hover:text-[var(--lamsa-chocolate)]">{s.button_text}<LamsaIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" /></Link> : null}
                </div>
              </div>
            </div>
          </LamsaContainer>
        </section>
      );
    }

    case "offer": {
      if (!bundle.discounted.length && !s.title && !s.text) return null;
      return (
        <section className="border-y border-[var(--lamsa-border)] bg-[var(--lamsa-beige)]/50 py-10 sm:py-14">
          <LamsaContainer className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="lamsa-eyebrow">{copy.sections.offerBadge}</p><h2 className="lamsa-display mt-2 text-2xl text-[var(--lamsa-chocolate)] sm:text-3xl">{s.title ?? copy.sections.flashTitle}</h2>{s.subtitle ? <p className="mt-2 text-sm text-[var(--lamsa-muted)]">{s.subtitle}</p> : null}{s.text ? <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--lamsa-taupe)]">{s.text}</p> : null}</div>
            <Link href={`${base}/boutique?filter=offers`} className="lamsa-outline-button">{copy.nav.offers}<LamsaIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" /></Link>
          </LamsaContainer>
        </section>
      );
    }

    case "features": {
      const items = s.items.filter((item) => item.title || item.text);
      if (!items.length) return null;
      const icons = ["cash", "truck", "shield", "headset"] as const;
      return (
        <section className="lamsa-section">
          <LamsaContainer>
            <LamsaHeading title={s.title ?? copy.sections.whyTitle} subtitle={s.subtitle} align="center" />
            <ul className="grid grid-cols-2 border border-[var(--lamsa-border)] sm:grid-cols-4">
              {items.slice(0, 4).map((item, itemIndex) => <li key={itemIndex} className="border-b border-s border-[var(--lamsa-border)] p-4 text-center last:border-b-0 sm:border-b-0 sm:p-6"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lamsa-beige)] text-[var(--lamsa-chocolate)]"><LamsaIcon name={icons[itemIndex] ?? "check"} className="h-5 w-5" /></span>{item.title ? <h3 className="mt-3 text-sm font-semibold text-[var(--lamsa-ink)]">{item.title}</h3> : null}{item.text ? <p className="mt-1 text-xs leading-6 text-[var(--lamsa-muted)]">{item.text}</p> : null}</li>)}
            </ul>
          </LamsaContainer>
        </section>
      );
    }

    case "reviews": {
      if (!bundle.reviews.length) return null;
      return (
        <section className="lamsa-section bg-[var(--lamsa-beige)]/42">
          <LamsaContainer>
            <LamsaHeading eyebrow="كلماتكنّ" title={s.title ?? `قالوا عن ${data.name}`} subtitle={s.subtitle} align="center" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.reviews.slice(0, 6).map((review) => <li key={review.id}><figure className="h-full bg-[var(--lamsa-white)] p-6 sm:p-7"><span className="lamsa-display text-4xl leading-none text-[var(--lamsa-gold)]">“</span><LamsaStars value={review.rating} /><blockquote className="mt-4 text-sm leading-7 text-[var(--lamsa-muted)]">{review.body ?? review.title}</blockquote><figcaption className="mt-5 border-t border-[var(--lamsa-border)] pt-3 text-xs font-semibold text-[var(--lamsa-ink)]">{review.customerName}</figcaption></figure></li>)}
            </ul>
          </LamsaContainer>
        </section>
      );
    }

    case "gallery": {
      const images = (s.images ?? []).filter((image): image is string => Boolean(image));
      if (!images.length) return null;
      return (
        <section className="lamsa-section">
          <LamsaContainer>
            <LamsaHeading eyebrow="إلهام" title={s.title ?? "إطلالات من المجموعة"} subtitle={s.subtitle} />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {images.slice(0, 8).map((image, imageIndex) => <li key={`${image}-${imageIndex}`} className={imageIndex === 0 ? "sm:col-span-2 sm:row-span-2" : ""}><div className="relative aspect-square overflow-hidden bg-[var(--lamsa-beige)]"><StorefrontImage src={image} alt={`${s.title ?? data.name} ${imageIndex + 1}`} fill sizes="(max-width:640px) 50vw, 25vw" className="lamsa-product-image object-cover" /></div></li>)}
            </ul>
          </LamsaContainer>
        </section>
      );
    }

    case "faq": {
      const faqs = bundle.faq.slice(0, s.max_items ?? 6);
      if (!faqs.length) return null;
      return (
        <section className="lamsa-section bg-[var(--lamsa-white)]">
          <LamsaContainer className="max-w-3xl">
            <LamsaHeading eyebrow="قبل الطلب" title={s.title ?? copy.sections.faqTitle} subtitle={s.subtitle} />
            <div className="border-t border-[var(--lamsa-border)]">
              {faqs.map((faq) => <details key={faq.id} className="lamsa-faq border-b border-[var(--lamsa-border)]"><summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-[var(--lamsa-ink)]"><span>{faq.question}</span><LamsaIcon name="plus" className="lamsa-faq-icon h-4 w-4 shrink-0" /></summary><p className="pb-5 text-sm leading-7 text-[var(--lamsa-muted)]">{faq.answer}</p></details>)}
            </div>
          </LamsaContainer>
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
          <LamsaContainer className="border border-[var(--lamsa-border)] bg-[var(--lamsa-ivory)] p-6 text-center sm:p-10">
            <h2 className="lamsa-display text-2xl text-[var(--lamsa-chocolate)] sm:text-3xl">{s.title ?? copy.sections.contactTitle}</h2>
            {s.text ? <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--lamsa-muted)]">{s.text}</p> : null}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {wa ? <a href={wa} className="lamsa-primary-button"><LamsaIcon name="whatsapp" className="h-4 w-4" />واتساب</a> : null}
              {phone ? <a href={`tel:${phone}`} className="lamsa-outline-button" dir="ltr"><LamsaIcon name="phone" className="h-4 w-4" />{phone}</a> : null}
              {email ? <a href={`mailto:${email}`} className="lamsa-outline-button" dir="ltr">{email}</a> : null}
            </div>
          </LamsaContainer>
        </section>
      );
    }

    case "cta":
      return s.title || s.text ? <section className="bg-[var(--lamsa-chocolate)] py-12 text-[var(--lamsa-ivory)]"><LamsaContainer className="text-center"><h2 className="lamsa-display text-2xl sm:text-3xl">{s.title}</h2>{s.text ? <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">{s.text}</p> : null}{s.button_text ? <Link href={lamsaHref(s.button_link, base)} className="mt-6 inline-flex min-h-12 items-center border border-white/50 px-6 text-sm font-semibold">{s.button_text}</Link> : null}</LamsaContainer></section> : null;

    default:
      return null;
  }
}
