/**
 * SOUQ — standalone COD checkout page (/commande) with the SOUQ skin.
 *
 * Uses the same shared engine as every other template: the same
 * `POST /api/checkout` route, the same `fn_place_cod_order`, the same RLS.
 * Only presentation and the dynamic option-group UI are SOUQ-specific.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnonSupabase } from "@/lib/supabase/anon";
import type { StorefrontData } from "@/lib/storefront/data";
import { souqCopy } from "@/lib/storefront/souq/copy";
import { loadSouqProductById, loadSouqZones, souqCheckoutSettingsFor } from "@/lib/storefront/souq/catalog";
import { SouqContainer, SouqIcon, SouqTrustStrip } from "./souq-ui";
import { SouqOrderForm } from "./souq-order-form";

export async function SouqCheckoutPage({
  data,
  productId,
  variantId,
  quantity,
}: {
  data: StorefrontData;
  productId: string | null;
  variantId: string | null;
  quantity: number;
}) {
  const copy = souqCopy(data.lang);
  const anon = getAnonSupabase();

  // Single-product stores: default to their only product.
  let resolvedProductId = productId;
  if (!resolvedProductId && data.website_type === "single_product") {
    const { data: single } = await anon
      .from("products")
      .select("id")
      .eq("store_id", data.id)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(1);
    resolvedProductId = single?.[0]?.id ?? null;
  }
  if (!resolvedProductId) notFound();

  const [bundle, zones] = await Promise.all([
    loadSouqProductById(data.id, resolvedProductId, data.settings),
    loadSouqZones(data.id),
  ]);
  if (!bundle) notFound();

  const { product } = bundle;

  return (
    <SouqContainer className="py-5 sm:py-8">
      <nav aria-label={copy.product.breadcrumbHome} className="mb-3 flex items-center gap-1.5 text-[12px] text-slate-500">
        <Link href={data.base} className="font-bold hover:text-[var(--souq-primary)]">
          {copy.product.breadcrumbHome}
        </Link>
        <SouqIcon name="chevron-left" className="h-3.5 w-3.5 text-slate-300 ltr:rotate-180" />
        <Link href={`${data.base}/produit/${product.slug}`} className="max-w-[50%] truncate font-bold hover:text-[var(--souq-primary)]">
          {product.name}
        </Link>
        <SouqIcon name="chevron-left" className="h-3.5 w-3.5 text-slate-300 ltr:rotate-180" />
        <span className="font-bold text-slate-700">{copy.checkout.formTitle}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        {/* Product recap */}
        <div className="lg:order-2">
          <div className="souq-card overflow-hidden">
            <div className="flex gap-3 p-3.5">
              <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[14px] bg-slate-50">
                {bundle.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- single recap thumbnail, no optimizer round-trip needed
                  <img src={bundle.images[0]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-300">
                    <SouqIcon name="image" className="h-6 w-6" />
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <h1 className="line-clamp-2 text-[15px] font-extrabold text-slate-800">{product.name}</h1>
                {bundle.ratingAverage !== null ? (
                  <p className="mt-1 text-[11px] font-bold text-amber-500">
                    ★ {bundle.ratingAverage.toFixed(1)} ({bundle.ratingCount})
                  </p>
                ) : null}
                <Link href={`${data.base}/produit/${product.slug}`} className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--souq-primary)] hover:underline">
                  {copy.sections.viewAll}
                  <SouqIcon name="chevron-left" className="h-3.5 w-3.5 ltr:rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          <SouqTrustStrip
            className="mt-3"
            items={[
              { icon: "cash", label: copy.product.codPayment },
              { icon: "truck", label: copy.product.deliveryTo58 },
              { icon: "shield", label: copy.product.secureOrder },
              { icon: "headset", label: copy.product.customerService },
            ]}
          />
        </div>

        {/* Form */}
        <div className="lg:order-1">
          <SouqOrderForm
            storeSlug={data.slug}
            base={data.base}
            copy={copy}
            lang={data.lang}
            currency={data.currency}
            settings={souqCheckoutSettingsFor(data.settings)}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.price_cents,
              compareAtPriceCents: product.compare_at_price_cents,
              imageUrl: bundle.images[0] ?? null,
              stock: product.stock,
              ratingAverage: bundle.ratingAverage,
              ratingCount: bundle.ratingCount,
            }}
            variants={bundle.variants}
            optionGroups={bundle.optionGroups}
            addOnProducts={bundle.addOnProducts}
            offers={bundle.offers}
            zones={zones}
            officeDeliveryEnabled={bundle.shipping.officeEnabled}
            whatsapp={data.settings?.contact?.whatsapp ?? null}
            initialQuantity={quantity}
            initialVariantId={variantId}
            anchorId="souq-order-form"
          />
        </div>
      </div>
    </SouqContainer>
  );
}
