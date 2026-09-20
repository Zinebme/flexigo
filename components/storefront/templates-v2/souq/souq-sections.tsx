/**
 * SOUQ — homepage / content section renderers (server components).
 *
 * Every section type of the structured content system gets a genuine SOUQ
 * interpretation (no other template's markup is reused). Data comes from the
 * store's real catalog (categories, products, quantity offers, approved
 * reviews, published FAQ) — never from invented numbers.
 *
 * Empty-safe: a section with nothing to show renders nothing instead of an
 * empty box, and a store with no products gets a single friendly empty state.
 */
import { cache } from "react";
import Link from "next/link";
import type { Section } from "@/lib/sections/definitions";
import type { StorefrontData } from "@/lib/storefront/data";
import { souqCopy, souqFormat } from "@/lib/storefront/souq/copy";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { discountPercent } from "@/lib/storefront/souq/order-model";
import { loadSouqHomeBundle } from "@/lib/storefront/souq/catalog";
import { StorefrontImage } from "../../image";
import { SouqProductCard, SouqRankedProductRow } from "./souq-product-card";
import { SouqBadge, SouqContainer, SouqEmptyState, SouqIcon, SouqSectionHeading, SouqStars, SouqTrustStrip } from "./souq-ui";

/** One home bundle per request, whatever the number of sections. */
const homeBundle = cache(loadSouqHomeBundle);

/** SOUQ-safe internal link resolution (prefixes the tenant base path). */
export function souqHref(link: string | null | undefined, base: string): string {
  if (!link) return base;
  const value = link.trim();
  if (value.length === 0) return base;
  if (/^(https?:|tel:|mailto:)/i.test(value)) return value;
  if (value.startsWith(base)) return value;
  if (value.startsWith("/")) return `${base}${value}`;
  return base;
}

export async function SouqSection({
  data,
  section,
  index = 0,
}: {
  data: StorefrontData;
  section: Section;
  index?: number;
}) {
  const copy = souqCopy(data.lang);
  const base = data.base;
  const lang = data.lang;
  const currency = data.currency;
  const bundle = await homeBundle(data.id);
  const s = section;

  switch (s.type) {
    // ---------------------------------------------------------------------
    // Hero — fully dynamic (title/subtitle/desktop+mobile image/CTA/badge)
    // ---------------------------------------------------------------------
    case "hero": {
      const desktop = s.desktop_image ?? s.image ?? null;
      const mobile = s.mobile_image ?? desktop;
      const title = s.title ?? data.name;
      const subtitle = s.subtitle ?? null;
      const badge = s.badge ?? copy.hero.badge;
      const ctaLabel = s.button_text?.trim() ? s.button_text : copy.hero.ctaFallback;
      const ctaHref = souqHref(s.button_link ?? "/boutique", base);

      return (
        <section className="relative overflow-hidden border-b border-[var(--souq-border)] bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--souq-primary-soft),transparent_55%)]" />
          <SouqContainer className="relative grid gap-6 py-6 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-14">
            <div className="souq-anim-up">
              {badge ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--souq-accent)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--souq-accent-text)]">
                  <SouqIcon name="spark" className="h-3.5 w-3.5" />
                  {badge}
                </span>
              ) : null}

              <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[var(--souq-primary)] sm:text-4xl lg:text-[42px]">
                {title}
              </h1>
              {subtitle ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p> : null}

              <div className="souq-anim-up souq-delay-1 mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                  href={ctaHref}
                  className="souq-press inline-flex items-center gap-2 rounded-[16px] bg-[var(--souq-accent)] px-5 py-3.5 text-sm font-extrabold text-[var(--souq-accent-text)] shadow-[0_16px_30px_-18px_rgb(245_158_11_/_0.95)] hover:bg-[var(--souq-accent-hover)] sm:text-base"
                >
                  <SouqIcon name="cart" className="h-5 w-5" />
                  {ctaLabel}
                </Link>
                {bundle.categories.length > 0 ? (
                  <Link
                    href={`${base}/boutique`}
                    className="souq-press inline-flex items-center gap-2 rounded-[16px] border border-[var(--souq-border)] bg-white px-5 py-3.5 text-sm font-bold text-[var(--souq-primary)] hover:border-[var(--souq-primary)]"
                  >
                    <SouqIcon name="grid" className="h-5 w-5" />
                    {copy.hero.browseCategories}
                  </Link>
                ) : null}
              </div>

              {s.promo_text ? (
                <p className="mt-3 text-[12px] font-bold text-[var(--souq-primary)]/80">{s.promo_text}</p>
              ) : null}

              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold text-slate-600">
                <li className="flex items-center gap-1.5">
                  <SouqIcon name="truck" className="h-4 w-4 text-[var(--souq-accent)]" />
                  {copy.hero.trustDelivery}
                </li>
                <li className="flex items-center gap-1.5">
                  <SouqIcon name="cash" className="h-4 w-4 text-[var(--souq-accent)]" />
                  {copy.hero.trustCod}
                </li>
                <li className="flex items-center gap-1.5">
                  <SouqIcon name="shield" className="h-4 w-4 text-[var(--souq-accent)]" />
                  {copy.hero.trustSpeed}
                </li>
              </ul>
            </div>

            <div className="souq-anim-scale relative">
              {desktop || mobile ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-[var(--souq-border)] bg-slate-50 shadow-[0_30px_60px_-40px_rgb(15_42_71_/_0.55)] sm:aspect-[16/10]">
                  {mobile ? (
                    <picture>
                      <source media="(max-width: 640px)" srcSet={mobile} />
                      <StorefrontImage
                        src={desktop ?? mobile}
                        alt={title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </picture>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((slot) => (
                    <div key={slot} className="souq-skeleton aspect-square rounded-[20px] border border-[var(--souq-border)]" />
                  ))}
                </div>
              )}
            </div>
          </SouqContainer>

          {!bundle.hasProducts ? (
            <SouqContainer className="pb-8">
              <SouqEmptyState title={copy.sections.noProducts} hint={copy.sections.noProductsHint} />
            </SouqContainer>
          ) : null}
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Categories
    // ---------------------------------------------------------------------
    case "collections": {
      const max = s.max_items ?? 8;
      const categories = (s.category_id ? bundle.categories.filter((c) => c.id === s.category_id) : bundle.categories).slice(0, max);
      if (categories.length === 0) return null;

      return (
        <section id={`souq-categories-${index}`} className="py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading
              title={s.title ?? copy.sections.categoriesTitle}
              subtitle={s.subtitle ?? copy.sections.categoriesSubtitle}
              action={
                <Link
                  href={`${base}/boutique`}
                  className="souq-press hidden items-center gap-1 text-[13px] font-bold text-[var(--souq-primary)] hover:underline sm:flex"
                >
                  {copy.sections.viewAll}
                  <SouqIcon name="chevron-left" className="h-4 w-4 ltr:rotate-180" />
                </Link>
              }
            />

            {/* Mobile: horizontal snap scroll · Desktop: grid */}
            <ul className="souq-scroll-x sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible lg:grid-cols-6">
              {categories.map((category) => (
                <li key={category.id} className="w-[132px] sm:w-auto">
                  <Link
                    href={`${base}/categorie/${category.slug}`}
                    className="souq-card souq-hover-lift group flex h-full flex-col overflow-hidden"
                  >
                    <span className="souq-zoom-parent relative block aspect-square overflow-hidden bg-slate-50">
                      {category.imageUrl ? (
                        <StorefrontImage
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          sizes="(max-width: 640px) 132px, 16vw"
                          className="souq-zoom object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]">
                          <SouqIcon name="grid" className="h-7 w-7" />
                        </span>
                      )}
                    </span>
                    <span className="flex flex-col items-center gap-0.5 px-2 py-2.5 text-center">
                      <span className="line-clamp-1 text-[13px] font-bold text-slate-800">{category.name}</span>
                      {category.productCount > 0 ? (
                        <span className="text-[10px] text-slate-400">
                          {category.productCount} {copy.sections.productsTitle}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Products (trending / best sellers / new arrivals / general)
    // ---------------------------------------------------------------------
    case "products": {
      const source = s.source ?? "featured";
      const count = s.product_count ?? 8;
      const list =
        source === "featured"
          ? (bundle.bestSellers.length > 0 ? bundle.bestSellers : bundle.trending)
          : source === "latest"
            ? bundle.latest
            : bundle.trending;
      const products = list.slice(0, count);
      if (products.length === 0) return null;

      const isBestSellers = source === "featured";
      const isNew = source === "latest";
      const title = s.title ?? (isBestSellers ? copy.sections.bestTitle : isNew ? copy.sections.newTitle : copy.sections.trendingTitle);
      const subtitle = s.subtitle ?? (isBestSellers ? copy.sections.bestSubtitle : isNew ? copy.sections.newSubtitle : copy.sections.trendingSubtitle);

      return (
        <section id={`souq-products-${index}`} className={isBestSellers ? "bg-white py-8 sm:py-12" : "py-8 sm:py-12"}>
          <SouqContainer>
            <SouqSectionHeading
              title={title}
              subtitle={subtitle}
              action={
                <Link
                  href={`${base}/boutique`}
                  className="souq-press flex items-center gap-1 text-[13px] font-bold text-[var(--souq-primary)] hover:underline"
                >
                  {copy.sections.viewAll}
                  <SouqIcon name="chevron-left" className="h-4 w-4 ltr:rotate-180" />
                </Link>
              }
            />

            {isNew ? (
              /* New arrivals: horizontal strip on mobile, grid on desktop */
              <ul className="souq-scroll-x sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
                {products.map((product) => (
                  <li key={product.id}>
                    <SouqProductCard product={product} base={base} copy={copy} lang={lang} currency={currency} />
                  </li>
                ))}
              </ul>
            ) : isBestSellers ? (
              /* Best sellers: ranked rows double-column — distinct rhythm */
              <ul className="grid gap-3 sm:grid-cols-2">
                {products.map((product, rank) => (
                  <li key={product.id}>
                    <SouqRankedProductRow product={product} base={base} copy={copy} lang={lang} rank={rank + 1} currency={currency} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {products.map((product, i) => (
                  <li key={product.id}>
                    <SouqProductCard product={product} base={base} copy={copy} lang={lang} currency={currency} priority={i < 2} />
                  </li>
                ))}
              </ul>
            )}
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Flash offers (offer section) — amber identity, real discounts only
    // ---------------------------------------------------------------------
    case "offer": {
      const discounted = bundle.discounted.slice(0, 6);
      return (
        <section id={`souq-offer-${index}`} className="py-8 sm:py-12">
          <SouqContainer>
            <div className="overflow-hidden rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-extrabold text-[var(--souq-primary)] sm:text-2xl">
                    <SouqIcon name="spark" className="h-5 w-5 text-[var(--souq-accent)]" />
                    {s.title ?? copy.sections.flashTitle}
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-600">{s.subtitle ?? copy.sections.flashSubtitle}</p>
                </div>
                <SouqBadge tone="accent">{copy.sections.offerBadge}</SouqBadge>
              </div>

              {discounted.length > 0 ? (
                <ul className="souq-scroll-x p-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:p-6 lg:grid-cols-4">
                  {discounted.map((product) => (
                    <li key={product.id} className="w-[168px] sm:w-auto">
                      <SouqProductCard product={product} base={base} copy={copy} lang={lang} currency={currency} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 sm:p-6">
                  <SouqEmptyState title={copy.sections.noProducts} hint={copy.sections.offerNote} icon="spark" />
                </div>
              )}

              {s.text ? <p className="px-4 pb-5 text-[12px] text-slate-500 sm:px-6">{s.text}</p> : null}
            </div>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Promotional banner (desktop + mobile images)
    // ---------------------------------------------------------------------
    case "banner": {
      const desktop = s.desktop_image ?? null;
      const mobile = s.mobile_image ?? desktop;
      if (!desktop && !mobile) return null;
      const href = souqHref(s.button_link, base);

      return (
        <section className="py-8 sm:py-12">
          <SouqContainer>
            <div className="relative overflow-hidden rounded-[24px] bg-[var(--souq-primary)]">
              {mobile ? (
                <picture>
                  <source media="(max-width: 640px)" srcSet={mobile} />
                  {desktop ? (
                    <StorefrontImage src={desktop} alt={s.title ?? ""} fill sizes="100vw" className="object-cover opacity-70" />
                  ) : null}
                </picture>
              ) : null}
              <div className="relative flex min-h-[220px] flex-col justify-center gap-3 bg-gradient-to-l from-[var(--souq-primary)]/95 via-[var(--souq-primary)]/75 to-transparent px-5 py-8 sm:min-h-[260px] sm:px-10">
                {s.title ? <h2 className="max-w-lg text-xl font-extrabold text-white sm:text-3xl">{s.title}</h2> : null}
                {s.subtitle ? <p className="max-w-lg text-[13px] text-white/85 sm:text-sm">{s.subtitle}</p> : null}
                {s.button_text ? (
                  <Link
                    href={href}
                    className="souq-press mt-1 inline-flex w-fit items-center gap-2 rounded-[16px] bg-[var(--souq-accent)] px-5 py-3 text-sm font-extrabold text-[var(--souq-accent-text)]"
                  >
                    <SouqIcon name="cart" className="h-4 w-4" />
                    {s.button_text}
                  </Link>
                ) : null}
              </div>
            </div>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Why choose us / benefits
    // ---------------------------------------------------------------------
    case "features": {
      const items = (s.items ?? []).filter((item) => item.title);
      const fallback = [
        { icon: "cash" as const, title: copy.product.codPayment, text: copy.checkout.formSubtitle },
        { icon: "truck" as const, title: copy.promo.delivery, text: copy.hero.trustSpeed },
        { icon: "shield" as const, title: copy.promo.secure, text: copy.checkout.trustNote },
        { icon: "headset" as const, title: copy.product.customerService, text: copy.footer.aboutFallback },
      ];

      return (
        <section className="bg-white py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title={s.title ?? copy.sections.whyTitle} subtitle={s.subtitle ?? copy.sections.whySubtitle} />
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {items.length > 0
                ? items.slice(0, 4).map((item, i) => (
                    <li key={`${item.title}-${i}`} className="souq-card flex flex-col gap-2 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]">
                        <SouqIcon name={(["cash", "truck", "shield", "headset"] as const)[i % 4] ?? "cash"} className="h-5 w-5" />
                      </span>
                      <p className="text-[13px] font-extrabold text-slate-800">{item.title}</p>
                      {item.text ? <p className="text-[12px] leading-relaxed text-slate-500">{item.text}</p> : null}
                    </li>
                  ))
                : fallback.map((item) => (
                    <li key={item.title} className="souq-card flex flex-col gap-2 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]">
                        <SouqIcon name={item.icon} className="h-5 w-5" />
                      </span>
                      <p className="text-[13px] font-extrabold text-slate-800">{item.title}</p>
                      <p className="text-[12px] leading-relaxed text-slate-500">{item.text}</p>
                    </li>
                  ))}
            </ul>
            <SouqTrustStrip
              className="mt-4 hidden lg:grid"
              items={[
                { icon: "cash", label: copy.promo.cod },
                { icon: "truck", label: copy.promo.delivery },
                { icon: "shield", label: copy.promo.secure },
                { icon: "office", label: copy.product.deliveryOffice },
              ]}
            />
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // How it works
    // ---------------------------------------------------------------------
    case "how_it_works": {
      const steps = (s.steps ?? []).filter((step) => step.title);
      if (steps.length === 0) return null;
      return (
        <section className="py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title={s.title ?? copy.sections.whyTitle} subtitle={s.subtitle} />
            <ol className="grid gap-3 sm:grid-cols-3">
              {steps.slice(0, 4).map((step, i) => (
                <li key={`${step.title}-${i}`} className="souq-card flex gap-3 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--souq-accent)] text-sm font-extrabold text-[var(--souq-accent-text)]">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[13px] font-extrabold text-slate-800">{step.title}</span>
                    {step.text ? <span className="mt-1 block text-[12px] text-slate-500">{step.text}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Social proof / stats
    // ---------------------------------------------------------------------
    case "social_proof":
    case "stats": {
      const items = (s.items ?? []).filter((item) => item.value);
      if (items.length === 0) return null;
      return (
        <section className="py-8 sm:py-10">
          <SouqContainer>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {items.slice(0, 4).map((item, i) => (
                <li key={`${item.value}-${i}`} className="souq-card px-4 py-5 text-center">
                  <p className="text-2xl font-extrabold text-[var(--souq-primary)]">{item.value}</p>
                  {item.label ? <p className="mt-1 text-[12px] text-slate-500">{item.label}</p> : null}
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Reviews (real approved reviews only)
    // ---------------------------------------------------------------------
    case "reviews": {
      const reviews = bundle.reviews;
      if (reviews.length === 0) return null;
      return (
        <section className="bg-white py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title={s.title ?? copy.sections.reviewsTitle} subtitle={s.subtitle ?? copy.sections.reviewsSubtitle} />
            <ul className="souq-scroll-x sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-4">
              {reviews.map((review) => (
                <li key={review.id} className="w-[240px] sm:w-auto">
                  <figure className="souq-card flex h-full flex-col gap-2 p-4">
                    <SouqStars value={review.rating} />
                    {review.title ? <p className="text-[13px] font-extrabold text-slate-800">{review.title}</p> : null}
                    <blockquote className="line-clamp-4 text-[12.5px] leading-relaxed text-slate-600">{review.body}</blockquote>
                    <figcaption className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                      <span className="font-bold text-slate-600">{review.customerName}</span>
                      {review.verifiedOrder ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                          <SouqIcon name="check" className="h-3 w-3" />
                          {copy.product.reviews}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // FAQ (from store data — accodion without JS)
    // ---------------------------------------------------------------------
    case "faq": {
      const max = s.max_items ?? 8;
      const items = bundle.faq.slice(0, max);
      if (items.length === 0) return null;
      return (
        <section id={`souq-faq-${index}`} className="py-8 sm:py-12">
          <SouqContainer className="max-w-3xl">
            <SouqSectionHeading title={s.title ?? copy.sections.faqTitle} subtitle={s.subtitle ?? copy.sections.faqSubtitle} />
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item.id}>
                  <details className="souq-faq-item souq-card overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <span className="text-[13.5px] font-bold text-slate-800">{item.question}</span>
                      <SouqIcon name="chevron" className="souq-faq-chevron h-4 w-4 shrink-0 text-[var(--souq-primary)]" />
                    </summary>
                    <div className="souq-faq-answer border-t border-[var(--souq-border)] px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">
                      {item.answer}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Contact / social
    // ---------------------------------------------------------------------
    case "contact": {
      const contact = data.settings?.contact;
      const wa = contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : null;
      const cards: Array<{ key: string; href: string; icon: "phone" | "whatsapp" | "instagram" | "facebook" | "tiktok"; label: string; value: string }> = [];
      if (s.show_phone !== false && contact?.phone) {
        cards.push({ key: "phone", href: `tel:${contact.phone}`, icon: "phone", label: copy.product.callAsk, value: contact.phone });
      }
      if (s.show_whatsapp !== false && wa) {
        cards.push({ key: "wa", href: wa, icon: "whatsapp", label: copy.product.whatsappAsk, value: copy.footer.contact });
      }
      if (contact?.instagram) {
        cards.push({ key: "ig", href: contact.instagram, icon: "instagram", label: "Instagram", value: contact.instagram.replace(/^https?:\/\/(www\.)?/, "") });
      }
      if (contact?.facebook) {
        cards.push({ key: "fb", href: contact.facebook, icon: "facebook", label: "Facebook", value: contact.facebook.replace(/^https?:\/\/(www\.)?/, "") });
      }
      if (contact?.tiktok) {
        cards.push({ key: "tt", href: contact.tiktok, icon: "tiktok", label: "TikTok", value: contact.tiktok.replace(/^https?:\/\/(www\.)?/, "") });
      }
      if (cards.length === 0) return null;

      return (
        <section id={`souq-contact-${index}`} className="py-8 sm:py-12">
          <SouqContainer className="max-w-3xl">
            <SouqSectionHeading title={s.title ?? copy.sections.contactTitle} subtitle={copy.sections.contactSubtitle} />
            {s.text ? <p className="mb-4 text-[13px] text-slate-600">{s.text}</p> : null}
            <ul className="grid gap-3 sm:grid-cols-2">
              {cards.map((card) => (
                <li key={card.key}>
                  <a
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="souq-card souq-hover-lift flex items-center gap-3 p-4"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]">
                      <SouqIcon name={card.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{card.label}</span>
                      <span className="block truncate text-[13px] font-extrabold text-slate-800" dir="ltr">
                        {card.value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // CTA band
    // ---------------------------------------------------------------------
    case "cta": {
      return (
        <section className="py-8 sm:py-12">
          <SouqContainer>
            <div className="relative overflow-hidden rounded-[24px] bg-[var(--souq-primary)] px-5 py-8 text-center sm:px-10 sm:py-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgb(245_158_11_/_0.35),transparent_60%)]" />
              <div className="relative">
                {s.title ? <h2 className="text-xl font-extrabold text-white sm:text-3xl">{s.title}</h2> : null}
                {s.text ? <p className="mx-auto mt-2 max-w-xl text-[13px] text-white/80 sm:text-sm">{s.text}</p> : null}
                {s.button_text ? (
                  <Link
                    href={souqHref(s.button_link ?? "/boutique", base)}
                    className="souq-press mt-5 inline-flex items-center gap-2 rounded-[16px] bg-[var(--souq-accent)] px-6 py-3.5 text-sm font-extrabold text-[var(--souq-accent-text)]"
                  >
                    <SouqIcon name="cart" className="h-5 w-5" />
                    {s.button_text}
                  </Link>
                ) : null}
              </div>
            </div>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // COD form block — links straight into a real product order flow
    // ---------------------------------------------------------------------
    case "cod_form": {
      const target = bundle.trending[0] ?? null;
      const href = target ? `${base}/commande?product=${target.id}` : `${base}/boutique`;
      return (
        <section id={`souq-cod-${index}`} className="py-8 sm:py-12">
          <SouqContainer className="max-w-3xl">
            <div className="souq-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-[var(--souq-primary)] px-4 py-4 text-white sm:px-6">
                <div>
                  <h2 className="text-lg font-extrabold sm:text-xl">{s.title ?? copy.checkout.formTitle}</h2>
                  <p className="mt-1 text-[12px] text-white/75">{s.subtitle ?? copy.checkout.formSubtitle}</p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[var(--souq-accent)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--souq-accent-text)] sm:flex">
                  <SouqIcon name="cash" className="h-4 w-4" />
                  {copy.checkout.codNote}
                </span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <Link
                  href={href}
                  className="souq-press flex items-center justify-center gap-2 rounded-[16px] bg-[var(--souq-accent)] px-5 py-4 text-sm font-extrabold text-[var(--souq-accent-text)]"
                >
                  <SouqIcon name="cart" className="h-5 w-5" />
                  {copy.product.orderNow}
                </Link>
                <Link
                  href={`${base}/boutique`}
                  className="souq-press flex items-center justify-center gap-2 rounded-[16px] border border-[var(--souq-border)] px-5 py-4 text-sm font-extrabold text-[var(--souq-primary)]"
                >
                  <SouqIcon name="grid" className="h-5 w-5" />
                  {copy.nav.shop}
                </Link>
              </div>
              <p className="px-4 pb-4 text-center text-[11px] text-slate-400 sm:px-5">{copy.checkout.trustNote}</p>
            </div>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Gallery
    // ---------------------------------------------------------------------
    case "gallery": {
      const images = (s.images ?? []).filter((image): image is string => Boolean(image));
      if (images.length === 0) return null;
      return (
        <section className="py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title={s.title ?? copy.sections.productsTitle} subtitle={s.subtitle} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.slice(0, 8).map((image, i) => (
                <li key={`${image}-${i}`} className="souq-zoom-parent relative aspect-square overflow-hidden rounded-[18px] border border-[var(--souq-border)] bg-slate-50">
                  <StorefrontImage src={image} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="souq-zoom object-cover" />
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Services / testimonials / hours / map — same identity, other content
    // ---------------------------------------------------------------------
    case "services": {
      const items = (s.items ?? []).filter((item) => item.title);
      if (items.length === 0) return null;
      return (
        <section className="py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title={s.title ?? copy.sections.productsTitle} subtitle={s.subtitle} />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.slice(0, 6).map((item, i) => (
                <li key={`${item.title}-${i}`} className="souq-card overflow-hidden">
                  {item.image ? (
                    <div className="relative aspect-[16/10] bg-slate-50">
                      <StorefrontImage src={item.image} alt={item.title ?? ""} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                    </div>
                  ) : null}
                  <div className="p-4">
                    <p className="text-[13px] font-extrabold text-slate-800">{item.title}</p>
                    {item.text ? <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{item.text}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    case "testimonials": {
      const items = (s.items ?? []).filter((item) => item.text);
      if (items.length === 0) return null;
      return (
        <section className="bg-white py-8 sm:py-12">
          <SouqContainer>
            <SouqSectionHeading title={s.title ?? copy.sections.reviewsTitle} subtitle={null} />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.slice(0, 6).map((item, i) => (
                <li key={`${item.name}-${i}`}>
                  <figure className="souq-card h-full p-4">
                    <SouqStars value={5} />
                    <blockquote className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{item.text}</blockquote>
                    <figcaption className="mt-3 text-[11px] font-bold text-slate-500">
                      {item.name}
                      {item.role ? <span className="font-normal text-slate-400"> — {item.role}</span> : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    case "hours": {
      const days = (s.days ?? []).filter((day) => day.day);
      if (days.length === 0) return null;
      return (
        <section className="py-8 sm:py-12">
          <SouqContainer className="max-w-xl">
            <SouqSectionHeading title={s.title ?? copy.sections.contactTitle} subtitle={null} />
            <ul className="souq-card divide-y divide-[var(--souq-border)] overflow-hidden">
              {days.map((day, i) => (
                <li key={`${day.day}-${i}`} className="flex items-center justify-between px-4 py-3 text-[13px]">
                  <span className="font-bold text-slate-800">{day.day}</span>
                  <span className="text-slate-500">{day.value}</span>
                </li>
              ))}
            </ul>
          </SouqContainer>
        </section>
      );
    }

    case "map": {
      if (!s.address && !s.note) return null;
      return (
        <section className="py-8 sm:py-12">
          <SouqContainer className="max-w-xl">
            <SouqSectionHeading title={s.title ?? copy.sections.contactTitle} subtitle={null} />
            <div className="souq-card flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]">
                <SouqIcon name="office" className="h-5 w-5" />
              </span>
              <div>
                {s.address ? <p className="text-[13px] font-bold text-slate-800">{s.address}</p> : null}
                {s.note ? <p className="mt-1 text-[12px] text-slate-500">{s.note}</p> : null}
              </div>
            </div>
          </SouqContainer>
        </section>
      );
    }

    // ---------------------------------------------------------------------
    // Sticky mobile CTA (content-driven, product pages have their own)
    // ---------------------------------------------------------------------
    case "sticky_cta": {
      const target = bundle.trending[0] ?? null;
      const href = target ? `${base}/commande?product=${target.id}` : `${base}/boutique`;
      return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--souq-border)] bg-white/97 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[12px] font-bold text-slate-600">
              {s.text ?? souqFormat(copy.promo.defaultBar, {})}
            </span>
            <Link
              href={href}
              className="souq-press shrink-0 rounded-[14px] bg-[var(--souq-accent)] px-4 py-3 text-[13px] font-extrabold text-[var(--souq-accent-text)]"
            >
              {s.button_text ?? copy.product.orderNow}
            </Link>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

/** Small shared helper reused by the shop/category pages. */
export function SouqDiscountBadge({ priceCents, compareAtCents, copy }: { priceCents: number; compareAtCents: number | null; copy: ReturnType<typeof souqCopy> }) {
  const percent = discountPercent(priceCents, compareAtCents);
  if (percent <= 0) return null;
  return <SouqBadge tone="danger">{`${copy.product.discount} ${percent}%`}</SouqBadge>;
}

/** Price used inside grids that already render a card layout. */
export function SouqCompactPrice({ cents, lang, currency }: { cents: number; lang: string | null; currency: string }) {
  return <span className="souq-price font-extrabold text-[var(--souq-primary)]">{formatSouqPrice(cents, lang, currency)}</span>;
}
