import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnonSupabase } from "../../../../../lib/supabase/anon";
import { getStorefrontData } from "../../../../../lib/storefront/data";
import { priceLine, lookupShippingFee, computeTotals } from "../../../../../lib/orders/pricing";
import { formatDA } from "../../../../../lib/utils";
import { CheckoutForm, type CheckoutLineInput } from "../../../../../components/storefront/checkout-form";
import { SouqCheckoutPage } from "../../../../../components/storefront/templates-v2/souq/souq-checkout-page";
import { isSouqTemplate } from "../../../../../lib/templates/souq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Commande" };

export default async function CommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();

  const qs = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  // SOUQ storefront: same checkout engine, SOUQ skin + dynamic option groups.
  if (isSouqTemplate(data.template_key)) {
    const qty = Math.min(50, Math.max(1, parseInt(first(qs.qty) ?? "1", 10) || 1));
    return <SouqCheckoutPage data={data} productId={first(qs.product) ?? null} variantId={first(qs.variant) ?? null} quantity={qty} />;
  }

  const productParam = first(qs.product);
  const variantParam = first(qs.variant);
  const qty = Math.min(50, Math.max(1, parseInt(first(qs.qty) ?? "1", 10) || 1));

  const anon = getAnonSupabase();

  // Single-product stores: default to the one active product when not given.
  let productId = productParam ?? null;
  if (!productId && data.website_type === "single_product") {
    const { data: single } = await anon
      .from("products")
      .select("id")
      .eq("store_id", data.id)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(1);
    productId = single?.[0]?.id ?? null;
  }
  if (!productId) notFound();

  const { data: product } = await anon
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", data.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) notFound();

  let variant = null;
  if (variantParam) {
    const { data: v } = await anon
      .from("product_variants")
      .select("*")
      .eq("id", variantParam)
      .eq("product_id", product.id)
      .eq("is_active", true)
      .maybeSingle();
    variant = v;
  }

  const { data: offers } = await anon
    .from("quantity_offers")
    .select("*")
    .eq("store_id", data.id)
    .eq("is_active", true)
    .or(`product_id.is.null,product_id.eq.${product.id}`);
  const { data: zones } = await anon
    .from("shipping_zones")
    .select("wilaya_code, home_fee_cents, office_fee_cents, is_active")
    .eq("store_id", data.id);

  const line = priceLine(product, variant, qty, (offers ?? []) as never);
  const estFee = lookupShippingFee(
    (zones ?? []) as Array<{ wilaya_code: number; home_fee_cents: number | null; office_fee_cents: number | null; is_active: boolean }>,
    16,
    "home",
  );
  const totals = computeTotals([line], estFee ?? 0);

  const lineInput: CheckoutLineInput = {
    product_id: product.id,
    variant_id: variant?.id ?? null,
    quantity: qty,
    product_name: product.name,
    variant_name: variant ? `${variant.name} ${Object.values(variant.options ?? {}).join(" ")}`.trim() : null,
    unit_price_cents: line.unitPriceCents,
    line_total_cents: line.lineTotalCents,
    offer_label: line.offerLabel,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{data.dict.checkout.title}</h1>
      <p className="mt-2 text-slate-500">{data.dict.checkout.subtitle}</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900">{lineInput.product_name}</div>
            {lineInput.variant_name ? <div className="text-sm text-slate-500">{lineInput.variant_name}</div> : null}
            <div className="mt-1 text-sm text-slate-500">
              {formatDA(line.unitPriceCents)} × {qty}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-[var(--fx-primary)]">{formatDA(line.lineTotalCents)}</div>
            {lineInput.offer_label ? <div className="text-xs font-semibold text-amber-600">🎉 {lineInput.offer_label}</div> : null}
          </div>
        </div>
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{data.dict.checkout.subtotal}</span>
            <span className="font-semibold">{formatDA(totals.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{data.dict.checkout.shipping}</span>
            <span className="font-semibold">
              {estFee === null ? "—" : estFee === 0 ? data.dict.checkout.shippingFree : formatDA(estFee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-slate-900">
            <span>{data.dict.checkout.total}</span>
            <span className="text-[var(--fx-primary)]">{formatDA(totals.totalCents)}</span>
          </div>
          <p className="text-xs text-slate-400">
            {data.dict.checkout.secureNote} Le total final est recalculé par le serveur.
          </p>
        </div>
      </div>

      <CheckoutForm
        storeSlug={data.slug}
        line={lineInput}
        currency={data.currency}
        dict={data.dict}
        whatsapp={data.settings?.contact?.whatsapp ?? null}
      />

      <div className="mt-10 text-center">
        <Link href={`${data.base}/boutique`} className="text-sm font-medium text-slate-500 hover:text-[var(--fx-primary)]">
          ← {data.dict.actions.back}
        </Link>
      </div>
    </div>
  );
}
