/**
 * Server-side price computation (pure functions — unit-tested).
 *
 * The browser NEVER submits prices or totals. The checkout endpoint and the
 * database function fn_place_cod_order compute everything from stored data:
 *   - base price: variant price override ?? product price
 *   - quantity offers: merchant-defined bundle totals (e.g. "2 pièces = 3900 DA")
 *   - shipping fee: store's configured zone (per wilaya + delivery type)
 * The functions here mirror fn_place_cod_order for display estimates; the
 * database function is the authoritative one.
 */
import type {
  ProductRow,
  ProductVariantRow,
  QuantityOfferRow,
} from "../supabase/database.types";

export interface PricedLine {
  unitPriceCents: number;
  lineTotalCents: number;
  offer: Pick<QuantityOfferRow, "id" | "store_id" | "product_id" | "min_quantity" | "total_price_cents" | "label" | "is_active"> | null;
  offerLabel: string | null;
}

/**
 * Price one line from DB data only.
 * Offer selection: product-specific offers win over store-level defaults;
 * among applicable offers (min_quantity <= qty) the highest min_quantity wins.
 * The offer price is the TOTAL for the bundle, per Algerian COD convention.
 */
export function priceLine(
  product: Pick<ProductRow, "id" | "price_cents">,
  variant: Pick<ProductVariantRow, "id" | "price_cents"> | null,
  quantity: number,
  offers: Array<Pick<QuantityOfferRow, "id" | "store_id" | "product_id" | "min_quantity" | "total_price_cents" | "label" | "is_active">>,
): PricedLine {
  const base = variant ? (variant.price_cents ?? product.price_cents) : product.price_cents;
  const applicable = offers.filter(
    (o) =>
      o.is_active &&
      o.min_quantity >= 1 &&
      o.min_quantity <= quantity &&
      (o.product_id === null || o.product_id === product.id),
  );
  const productSpecific = applicable.filter((o) => o.product_id === product.id);
  const pool = productSpecific.length > 0 ? productSpecific : applicable;
  const best =
    pool
      .slice()
      .sort((a, b) => b.min_quantity - a.min_quantity)[0] ?? null;

  if (best) {
    return {
      unitPriceCents: base,
      lineTotalCents: best.total_price_cents,
      offer: best,
      offerLabel: best.label ?? `Offre : ${best.min_quantity} pièces`,
    };
  }
  return { unitPriceCents: base, lineTotalCents: base * quantity, offer: null, offerLabel: null };
}

export interface OrderTotals {
  subtotalCents: number;
  shippingFeeCents: number;
  discountCents: number;
  totalCents: number;
}

export function computeTotals(
  lines: Array<Pick<PricedLine, "lineTotalCents">>,
  shippingFeeCents: number,
  discountCents = 0,
): OrderTotals {
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const fee = Math.max(0, shippingFeeCents);
  const discount = Math.max(0, Math.min(discountCents, subtotalCents));
  const totalCents = Math.max(0, subtotalCents + fee - discount);
  return { subtotalCents, shippingFeeCents: fee, discountCents: discount, totalCents };
}

/** Shipping fee lookup shared by checkout display and tests. */
export function lookupShippingFee(
  zones: Array<{ wilaya_code: number; home_fee_cents: number | null; office_fee_cents: number | null; is_active: boolean }>,
  wilayaCode: number,
  deliveryType: "home" | "office",
): number | null {
  const zone = zones.find((z) => z.is_active && z.wilaya_code === wilayaCode);
  const fallback = zones.find((z) => z.is_active && z.wilaya_code === 0);
  const row = zone ?? fallback ?? null;
  if (!row) return null;
  const fee = deliveryType === "home" ? row.home_fee_cents : row.office_fee_cents;
  return fee ?? null;
}
