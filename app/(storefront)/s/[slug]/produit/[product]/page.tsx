import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnonSupabase } from "../../../../../../lib/supabase/anon";
import { getStorefrontData } from "../../../../../../lib/storefront/data";
import { loadCatalog } from "../../../../../../lib/storefront/catalog";
import { formatDA } from "../../../../../../lib/utils";
import { StorefrontImage } from "../../../../../../components/storefront/image";
import { ProductCard } from "../../../../../../components/storefront/sections";
import { SouqProductPage } from "../../../../../../components/storefront/templates-v2/souq/souq-product-page";
import { LamsaProductPage } from "../../../../../../components/storefront/templates-v2/lamsa/lamsa-product-page";
import { NoorProductPage } from "../../../../../../components/storefront/templates-v2/noor/noor-product-page";
import { VoltProductPage } from "../../../../../../components/storefront/templates-v2/volt/volt-product-page";
import { DarProductPage } from "../../../../../../components/storefront/templates-v2/dar/dar-product-page";
import { PulseProductPage } from "../../../../../../components/storefront/templates-v2/pulse/pulse-product-page";
import { LittleProductPage } from "../../../../../../components/storefront/templates-v2/little/little-product-page";
import { isSouqTemplate } from "../../../../../../lib/templates/souq";
import { isLamsaTemplate } from "../../../../../../lib/templates/lamsa";
import { isNoorTemplate } from "../../../../../../lib/templates/noor";
import { isVoltTemplate } from "../../../../../../lib/templates/volt";
import { isDarTemplate } from "../../../../../../lib/templates/dar";
import { isPulseTemplate } from "../../../../../../lib/templates/pulse";
import { isLittleTemplate } from "../../../../../../lib/templates/little";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; product: string }>;
}): Promise<Metadata> {
  const { slug, product } = await params;
  const data = await getStorefrontData(slug);
  if (!data) return { title: "Produit" };
  const anon = getAnonSupabase();
  const { data: p } = await anon
    .from("products")
    .select("name, description, seo_title, seo_description")
    .eq("store_id", data.id)
    .eq("slug", product)
    .eq("is_active", true)
    .maybeSingle();
  if (!p) return { title: "Produit introuvable" };
  const title = p.seo_title ?? p.name;
  const desc = p.seo_description ?? p.description?.slice(0, 160) ?? undefined;

  // V2 templates add the product's own real OG image.
  if (isLittleTemplate(data.template_key) || isPulseTemplate(data.template_key) || isDarTemplate(data.template_key) || isVoltTemplate(data.template_key) || isSouqTemplate(data.template_key) || isLamsaTemplate(data.template_key) || isNoorTemplate(data.template_key)) {
    const { data: productRow } = await anon
      .from("products")
      .select("id")
      .eq("store_id", data.id)
      .eq("slug", product)
      .maybeSingle();
    const { data: firstImage } = productRow
      ? await anon
          .from("product_images")
          .select("url")
          .eq("product_id", productRow.id)
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null };
    return {
      title: `${title} — ${data.name}`,
      description: desc,
      openGraph: {
        title: `${title} — ${data.name}`,
        description: desc,
        images: firstImage?.url ? [{ url: firstImage.url }] : undefined,
      },
    };
  }

  return { title: `${title} — ${data.name}`, description: desc };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; product: string }>;
}) {
  const { slug, product } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();

  if (isLittleTemplate(data.template_key)) return <LittleProductPage data={data} productSlug={product} />;
  if (isPulseTemplate(data.template_key)) return <PulseProductPage data={data} productSlug={product} />;
  if (isDarTemplate(data.template_key)) {
    return <DarProductPage data={data} productSlug={product} />;
  }
  if (isVoltTemplate(data.template_key)) {
    return <VoltProductPage data={data} productSlug={product} />;
  }
  if (isNoorTemplate(data.template_key)) {
    return <NoorProductPage data={data} productSlug={product} />;
  }
  if (isLamsaTemplate(data.template_key)) {
    return <LamsaProductPage data={data} productSlug={product} />;
  }
  if (isSouqTemplate(data.template_key)) {
    return <SouqProductPage data={data} productSlug={product} />;
  }

  const anon = getAnonSupabase();
  const [{ data: p }, { data: images }, { data: variants }] = await Promise.all([
    anon
      .from("products")
      .select("*")
      .eq("store_id", data.id)
      .eq("slug", product)
      .eq("is_active", true)
      .maybeSingle(),
    anon.from("product_images").select("*").eq("store_id", data.id).order("position", { ascending: true }),
    anon.from("product_variants").select("*").eq("is_active", true).order("position", { ascending: true }),
  ]);
  if (!p) notFound();

  const productImages = (images ?? []).filter((i) => i.product_id === p.id);
  const productVariants = (variants ?? []).filter((v) => v.product_id === p.id);

  const [{ data: offers }, { data: reviews }, { products: catalog }] = await Promise.all([
    anon
      .from("quantity_offers")
      .select("*")
      .eq("store_id", data.id)
      .eq("is_active", true)
      .or(`product_id.is.null,product_id.eq.${p.id}`)
      .order("min_quantity", { ascending: false }),
    anon
      .from("reviews")
      .select("customer_name, rating, title, body, created_at")
      .eq("store_id", data.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(4),
    loadCatalog(data.id),
  ]);
  const applicableOffers = (offers ?? []).filter(
    (o) => o.product_id === null || o.product_id === p.id,
  );

  const related = catalog.filter((c) => c.id !== p.id).slice(0, 4);
  const hasVariants = productVariants.length > 0;
  const inStock = hasVariants
    ? productVariants.some((v) => v.stock > 0)
    : p.stock > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? undefined,
    image: productImages[0]?.url,
    sku: p.sku ?? undefined,
    brand: { "@type": "Brand", name: data.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: data.currency,
      lowPrice: p.price_cents / 100,
      highPrice: p.price_cents / 100,
      offerCount: 1,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Link href={`${data.base}/boutique`} className="text-sm font-medium text-slate-500 hover:text-[var(--fx-primary)]">
          ← {data.dict.actions.back}
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {productImages[0] ? (
                <StorefrontImage src={productImages[0].url} alt={p.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl text-slate-300">🛍️</div>
              )}
            </div>
            {productImages.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {productImages.slice(1).map((img) => (
                  <div key={img.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <StorefrontImage src={img.url} alt={p.name} fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{p.name}</h1>

            {reviews && reviews.length > 0 ? (
              <div className="mt-2 text-amber-500">
                {"★".repeat(Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length))}
                <span className="ml-2 text-sm text-slate-400">({reviews.length})</span>
              </div>
            ) : null}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[var(--fx-primary)]">{formatDA(p.price_cents)}</span>
              {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? (
                <span className="text-lg text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span>
              ) : null}
            </div>

            <div className="mt-3 text-sm font-semibold">
              {inStock ? (
                <span className="text-emerald-600">
                  ✓ {p.stock > 0 && p.stock <= 5 && !hasVariants ? data.dict.product.lowStock.replace("{n}", String(p.stock)) : data.dict.product.inStock}
                </span>
              ) : (
                <span className="text-red-500">{data.dict.product.outOfStock}</span>
              )}
            </div>

            {/* Variants */}
            {hasVariants ? (
              <div className="mt-6">
                <div className="text-sm font-bold uppercase tracking-wide text-slate-700">{data.dict.product.quantity}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {productVariants.map((v) => (
                    <a
                      key={v.id}
                      href={`${data.base}/commande?product=${p.id}&variant=${v.id}`}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition ${
                        v.stock > 0
                          ? "border-slate-200 hover:border-[var(--fx-primary)]"
                          : "border-slate-100 text-slate-300 line-through"
                      }`}
                    >
                      <span>
                        {v.name}
                        {Object.entries(v.options ?? {}).map(([k, val]) => (
                          <span key={k} className="ml-1 text-xs text-slate-400">{String(val)}</span>
                        ))}
                      </span>
                      <span className="font-bold text-[var(--fx-primary)]">{formatDA(v.price_cents ?? p.price_cents)}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Offers */}
            {applicableOffers.length > 0 ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-bold text-amber-800">{data.dict.product.offers}</div>
                <ul className="mt-2 space-y-1 text-sm text-amber-900">
                  {applicableOffers.map((o) => (
                    <li key={o.id}>
                      {o.label ?? `${o.min_quantity} pièces`} : <span className="font-bold">{formatDA(o.total_price_cents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* CTA */}
            <div className="mt-8">
              {inStock ? (
                <Link
                  href={`${data.base}/commande?product=${p.id}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--fx-primary)] px-6 py-4 text-base font-bold text-white transition hover:opacity-90 sm:w-auto"
                >
                  {data.dict.actions.order} — {formatDA(p.price_cents)}
                </Link>
              ) : null}
              {data.settings?.contact?.phone ? (
                <a
                  href={`tel:${data.settings.contact.phone}`}
                  className="mt-3 inline-flex items-center justify-center text-sm font-semibold text-slate-600 underline"
                >
                  {data.dict.actions.call} : {data.settings.contact.phone}
                </a>
              ) : null}
            </div>

            {/* Description */}
            {p.description ? (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">{data.dict.product.description}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.description}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 ? (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-slate-900">{data.dict.product.reviews}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {reviews.map((r, i) => (
                <figure key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-amber-500">{"★".repeat(r.rating)}</div>
                  <blockquote className="mt-2 text-sm text-slate-700">« {r.body ?? r.title} »</blockquote>
                  <figcaption className="mt-2 text-xs font-semibold text-slate-500">{r.customer_name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        {/* Related */}
        {related.length > 0 ? (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-slate-900">{data.dict.product.related}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {related.map((rp) => (
                <ProductCard key={rp.id} p={rp} base={data.base} orderLabel={data.dict.actions.order} tpl={data.template_key} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
