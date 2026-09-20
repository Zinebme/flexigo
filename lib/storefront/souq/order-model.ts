/**
 * SOUQ — order model (pure functions).
 *
 * IMPORTANT: everything here is a *display convenience*. The browser only ever
 * submits identifiers (product_id / variant_id / quantity) + contact data, and
 * `fn_place_cod_order` recomputes prices, offers, shipping and totals on the
 * server. These functions reuse the SHARED pricing module so the estimate
 * shown to the customer matches the authoritative calculation line by line
 * (same offer rules, same zone lookup, same rounding).
 */
import { computeTotals, lookupShippingFee, priceLine } from "../../orders/pricing";
import type { SouqOptionGroup, SouqSelections, SouqVariantInput } from "./variants";
import { resolveAddOnLines, resolveInformationalSelections, resolveVariant, selectedValues } from "./variants";

export interface SouqPricingProduct {
  id: string;
  price_cents: number;
  name: string;
}

export interface SouqPricingOffer {
  id: string;
  store_id: string;
  product_id: string | null;
  min_quantity: number;
  total_price_cents: number;
  label: string | null;
  is_active: boolean;
}

export interface SouqShippingZone {
  wilaya_code: number;
  home_fee_cents: number | null;
  office_fee_cents: number | null;
  is_active: boolean;
}

export interface SouqOrderLine {
  productId: string;
  variantId: string | null;
  label: string;
  variantLabel: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  offerLabel: string | null;
  isAddOn: boolean;
}

export interface SouqOrderPreviewInput {
  product: SouqPricingProduct;
  variants: SouqVariantInput[];
  groups: SouqOptionGroup[];
  selections: SouqSelections;
  quantity: number;
  offers: SouqPricingOffer[];
  addOnProducts: Array<SouqPricingProduct & { slug: string }>;
  zones: SouqShippingZone[];
  wilayaCode: number | null;
  deliveryType: "home" | "office";
  discountCents?: number;
}

export interface SouqOrderPreview {
  lines: SouqOrderLine[];
  variant: SouqVariantInput | null;
  informational: Array<{ groupLabel: string; value: string }>;
  subtotalCents: number;
  shippingFeeCents: number | null;
  discountCents: number;
  totalCents: number;
  /** False when no shipping zone matches the chosen wilaya (total is partial). */
  shippingKnown: boolean;
  offerLabel: string | null;
  savingsCents: number;
}

export function buildOrderPreview(input: SouqOrderPreviewInput): SouqOrderPreview {
  const {
    product,
    variants,
    groups,
    selections,
    quantity,
    offers,
    addOnProducts,
    zones,
    wilayaCode,
    deliveryType,
    discountCents = 0,
  } = input;

  const variant = resolveVariant(variants, groups, selections);
  const lines: SouqOrderLine[] = [];

  const mainLine = priceLine(product, variant, quantity, offers);
  lines.push({
    productId: product.id,
    variantId: variant?.id ?? null,
    label: product.name,
    variantLabel: variant ? variantOptionSummary(variant, groups, selections) : null,
    quantity,
    unitPriceCents: mainLine.unitPriceCents,
    lineTotalCents: mainLine.lineTotalCents,
    offerLabel: mainLine.offerLabel,
    isAddOn: false,
  });

  const addOnLines = resolveAddOnLines(groups, selections);
  for (const addOn of addOnLines) {
    const addOnProduct = addOnProducts.find((p) => p.id === addOn.productId);
    if (!addOnProduct) continue;
    const priced = priceLine(addOnProduct, null, 1, offers);
    lines.push({
      productId: addOnProduct.id,
      variantId: null,
      label: addOnProduct.name,
      variantLabel: null,
      quantity: 1,
      unitPriceCents: priced.unitPriceCents,
      lineTotalCents: priced.lineTotalCents,
      offerLabel: priced.offerLabel,
      isAddOn: true,
    });
  }

  const shippingFeeCents = wilayaCode === null || wilayaCode <= 0 ? null : lookupShippingFee(zones, wilayaCode, deliveryType);
  const totals = computeTotals(lines, shippingFeeCents ?? 0, discountCents);

  return {
    lines,
    variant,
    informational: resolveInformationalSelections(groups, selections),
    subtotalCents: totals.subtotalCents,
    shippingFeeCents,
    discountCents: totals.discountCents,
    totalCents: shippingFeeCents === null ? totals.subtotalCents : totals.totalCents,
    shippingKnown: shippingFeeCents !== null,
    offerLabel: mainLine.offerLabel,
    savingsCents: savingsFor(product.price_cents, quantity, mainLine.lineTotalCents),
  };
}

function savingsFor(baseUnitCents: number, quantity: number, lineTotalCents: number): number {
  const full = baseUnitCents * quantity;
  return Math.max(0, full - lineTotalCents);
}

/** Variant label, preferring the customer's own selection wording. */
export function variantOptionSummary(
  variant: SouqVariantInput,
  groups: SouqOptionGroup[],
  selections: SouqSelections,
): string {
  const parts = groups
    .filter((g) => g.selectionMode === "single")
    .flatMap((group) => selectedValues(selections, group).map((value) => group.values.find((v) => v.value === value)?.label ?? value));
  if (parts.length > 0) return parts.join(" • ");
  const options = Object.values(variant.options ?? {}).map((v) => String(v));
  return options.length > 0 ? options.join(" • ") : variant.name;
}

// ---------------------------------------------------------------------------
// Quantity offers → attractive offer cards
// ---------------------------------------------------------------------------

export interface SouqQuantityOfferCard {
  /** Number of units covered by this card. */
  quantity: number;
  totalCents: number;
  label: string | null;
  badge: "popular" | "special" | null;
  savingsCents: number;
  /** Cents saved per extra unit compared to the base price. */
  unitPriceCents: number;
  offerId: string | null;
}

export function buildQuantityOfferCards(
  baseUnitCents: number,
  offers: SouqPricingOffer[],
  productId: string,
  fallbackLabel: string,
): SouqQuantityOfferCard[] {
  const applicable = offers.filter(
    (offer) => offer.is_active && offer.min_quantity >= 2 && (offer.product_id === null || offer.product_id === productId),
  );
  const productSpecific = applicable.filter((o) => o.product_id === productId);
  const pool = productSpecific.length > 0 ? productSpecific : applicable;

  const cards: SouqQuantityOfferCard[] = [
    {
      quantity: 1,
      totalCents: baseUnitCents,
      label: fallbackLabel,
      badge: null,
      savingsCents: 0,
      unitPriceCents: baseUnitCents,
      offerId: null,
    },
  ];

  const sorted = [...pool].sort((a, b) => a.min_quantity - b.min_quantity);
  const highest = sorted[sorted.length - 1]?.min_quantity ?? 0;
  for (const offer of sorted) {
    const badge: SouqQuantityOfferCard["badge"] =
      offer.min_quantity === highest && sorted.length > 1 ? "special" : offer.min_quantity === 2 ? "popular" : null;
    cards.push({
      quantity: offer.min_quantity,
      totalCents: offer.total_price_cents,
      label: offer.label,
      badge,
      savingsCents: Math.max(0, baseUnitCents * offer.min_quantity - offer.total_price_cents),
      unitPriceCents: Math.round(offer.total_price_cents / offer.min_quantity),
      offerId: offer.id,
    });
  }
  return cards;
}

/** Discount percentage for badges (never invented: only from compare-at price). */
export function discountPercent(priceCents: number, compareAtCents: number | null | undefined): number {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

export function stockBadge(
  stock: number,
  lowStockThreshold: number,
  hasVariants: boolean,
  variantStock?: number,
): "in_stock" | "low_stock" | "out_of_stock" | null {
  const available = hasVariants ? (variantStock ?? stock) : stock;
  if (hasVariants && variantStock === undefined) return null;
  if (available <= 0) return "out_of_stock";
  if (available <= Math.max(1, lowStockThreshold)) return "low_stock";
  return "in_stock";
}
