/**
 * SOUQ — unit tests (pure logic only, no database, no network).
 *
 * These cover the parts of the template that must never regress:
 *   - dynamic option groups (derived + merchant-declared, single/multiple)
 *   - quantity offers and the display preview totals
 *   - shipping recalculation by wilaya + delivery type
 *   - Arabic copy required by the COD flow, search normalization, formatting
 *   - theme palette / contrast helpers
 *
 * Server-side authority (fn_place_cod_order) is covered by the integration
 * suite (tests/integration/run.mjs, section 8).
 */
import { describe, expect, it } from "vitest";

import {
  applySelection,
  buildOptionGroups,
  deriveOptionGroups,
  emptySelections,
  resolveVariant,
  selectedValues,
  validateSelections,
  type SouqVariantInput,
} from "../../lib/storefront/souq/variants";
import {
  buildOrderPreview,
  buildQuantityOfferCards,
  discountPercent,
  stockBadge,
  type SouqPricingOffer,
  type SouqShippingZone,
} from "../../lib/storefront/souq/order-model";
import { formatSouqPrice } from "../../lib/storefront/souq/format";
import { normalizeSearchText, searchProducts, type SouqSearchItem } from "../../lib/storefront/souq/search";
import { souqCopy, souqFormat } from "../../lib/storefront/souq/copy";
import {
  composeFullName,
  fieldSetting,
  resolveSouqCheckoutSettings,
} from "../../lib/storefront/souq/checkout-settings";
import { readableOn, souqCssVars, souqPalette, SOUQ_DEFAULTS } from "../../lib/storefront/souq/tokens";

// ---------------------------------------------------------------------------
// Fixtures — mirror the Arabic demo store (سوق بلس)
// ---------------------------------------------------------------------------

const variants: SouqVariantInput[] = [
  { id: "v1", name: "أسود / 40 ملم", options: { اللون: "أسود", المقاس: "40 ملم" }, price_cents: null, stock: 18, is_active: true },
  { id: "v2", name: "أسود / 44 ملم", options: { اللون: "أسود", المقاس: "44 ملم" }, price_cents: 310000, stock: 14, is_active: true },
  { id: "v3", name: "ذهبي / 44 ملم", options: { اللون: "ذهبي", المقاس: "44 ملم" }, price_cents: 320000, stock: 0, is_active: true },
];

const product = { id: "p1", name: "ساعة ذكية رياضية", price_cents: 290000, stock: 42 };

const offers: SouqPricingOffer[] = [
  { id: "o2", store_id: "s1", product_id: "p1", min_quantity: 2, total_price_cents: 520000, label: "قطعتان : 5 200 دج", is_active: true },
  { id: "o3", store_id: "s1", product_id: "p1", min_quantity: 3, total_price_cents: 720000, label: "3 قطع : 7 200 دج", is_active: true },
];

const zones: SouqShippingZone[] = [
  { wilaya_code: 0, home_fee_cents: 70000, office_fee_cents: 40000, is_active: true },
  { wilaya_code: 16, home_fee_cents: 50000, office_fee_cents: 30000, is_active: true },
];

function preview(overrides: Partial<Parameters<typeof buildOrderPreview>[0]> = {}) {
  const groups = buildOptionGroups(variants, null);
  return buildOrderPreview({
    product,
    variants,
    groups,
    selections: emptySelections(groups),
    quantity: 1,
    offers,
    addOnProducts: [],
    zones,
    wilayaCode: null,
    deliveryType: "home",
    ...overrides,
  });
}

// ---------------------------------------------------------------------------

describe("SOUQ — dynamic option groups", () => {
  it("derives one group per variant option key, in first-seen order", () => {
    const groups = deriveOptionGroups(variants);
    expect(groups.map((g) => g.label)).toEqual(["اللون", "المقاس"]);
  });

  it("renders colour groups as swatches and size groups as buttons", () => {
    const groups = deriveOptionGroups(variants);
    expect(groups[0]?.displayType).toBe("color_swatch");
    expect(groups[0]?.values.map((v) => v.color)).toEqual(["#111827", "#d4af37"]);
    expect(groups[1]?.displayType).toBe("buttons");
  });

  it("ignores inactive variants when deriving values", () => {
    const groups = deriveOptionGroups([
      ...variants,
      { id: "v4", name: "أحمر", options: { اللون: "أحمر" }, price_cents: null, stock: 5, is_active: false },
    ]);
    expect(groups[0]?.values.map((v) => v.value)).not.toContain("أحمر");
  });

  it("honours a merchant-declared group config (multiple selection, checkbox, min/max)", () => {
    const groups = buildOptionGroups(variants, [
      {
        key: "extras",
        label: "الإضافة",
        option_key: null,
        selection_mode: "multiple",
        display_type: "checkbox",
        required: true,
        min_selections: 1,
        max_selections: 2,
        values: [{ value: "حماية الشاشة" }, { value: "شاحن إضافي" }, { value: "حافظة" }],
      },
    ]);
    const group = groups.find((g) => g.key === "extras");
    expect(group?.selectionMode).toBe("multiple");
    expect(group?.displayType).toBe("checkbox");
    expect(group?.maxSelections).toBe(2);
    expect(group?.values.length).toBe(3);
  });

  it("keeps the derived groups when the config is absent or invalid", () => {
    expect(buildOptionGroups(variants, null).map((g) => g.key)).toEqual(["اللون", "المقاس"]);
    expect(buildOptionGroups(variants, { nonsense: true }).map((g) => g.key)).toEqual(["اللون", "المقاس"]);
  });

  it("single-choice selection replaces the previous value", () => {
    const groups = buildOptionGroups(variants, null);
    const color = groups[0]!;
    let selections = emptySelections(groups);
    selections = applySelection(color, selections, "أسود");
    expect(selectedValues(selections, color)).toEqual(["أسود"]);
    selections = applySelection(color, selections, "ذهبي");
    expect(selectedValues(selections, color)).toEqual(["ذهبي"]);
    selections = applySelection(color, selections, "ذهبي");
    expect(selectedValues(selections, color)).toEqual([]);
  });

  it("multiple-choice selection adds, removes and enforces max_selections", () => {
    const groups = buildOptionGroups(variants, [
      {
        key: "extras",
        label: "الإضافة",
        selection_mode: "multiple",
        max_selections: 2,
        values: [{ value: "أ" }, { value: "ب" }, { value: "ج" }],
      },
    ]);
    const group = groups.find((g) => g.key === "extras")!;
    let selections = emptySelections(groups);
    selections = applySelection(group, selections, "أ");
    selections = applySelection(group, selections, "ب");
    expect(selectedValues(selections, group)).toEqual(["أ", "ب"]);
    selections = applySelection(group, selections, "ج");
    expect(selectedValues(selections, group)).toEqual(["ب", "ج"]);
    selections = applySelection(group, selections, "ب");
    expect(selectedValues(selections, group)).toEqual(["ج"]);
  });

  it("reports required / min / max issues with machine codes", () => {
    const groups = buildOptionGroups(variants, null);
    const issues = validateSelections(groups, emptySelections(groups));
    expect(issues.map((i) => i.code)).toEqual(["required", "required"]);
    expect(issues[0]?.label).toBe("اللون");

    const filled = { ...emptySelections(groups), اللون: ["أسود"], المقاس: ["44 ملم"] };
    expect(validateSelections(groups, filled)).toEqual([]);
  });

  it("resolves the real variant id for the chosen combination", () => {
    const groups = buildOptionGroups(variants, null);
    const selections = { ...emptySelections(groups), اللون: ["أسود"], المقاس: ["44 ملم"] };
    expect(resolveVariant(variants, groups, selections)?.id).toBe("v2");
    const missing = { ...emptySelections(groups), اللون: ["ذهبي"], المقاس: ["40 ملم"] };
    expect(resolveVariant(variants, groups, missing)).toBeNull();
  });
});

describe("SOUQ — quantity offers and preview totals", () => {
  it("builds the 1 / 2 / 3 cards with the requested labels and prices", () => {
    const cards = buildQuantityOfferCards(290000, offers, "p1", "قطعة واحدة");
    expect(cards.map((c) => c.quantity)).toEqual([1, 2, 3]);
    expect(cards[0]?.totalCents).toBe(290000);
    expect(cards[0]?.label).toBe("قطعة واحدة");
    expect(cards[1]?.totalCents).toBe(520000);
    expect(cards[1]?.label).toBe("قطعتان : 5 200 دج");
    expect(cards[1]?.badge).toBe("popular");
    expect(cards[2]?.badge).toBe("special");
    expect(cards[1]?.savingsCents).toBe(60000);
    expect(cards[2]?.savingsCents).toBe(150000);
  });

  it("applies the bundle offer price as the line total", () => {
    const result = preview({ quantity: 2 });
    expect(result.lines[0]?.lineTotalCents).toBe(520000);
    expect(result.offerLabel).toBe("قطعتان : 5 200 دج");
    expect(result.savingsCents).toBe(60000);
  });

  it("uses the variant price override when one is selected", () => {
    const groups = buildOptionGroups(variants, null);
    const selections = { ...emptySelections(groups), اللون: ["أسود"], المقاس: ["44 ملم"] };
    const result = preview({ groups, selections, quantity: 1 });
    expect(result.variant?.id).toBe("v2");
    expect(result.subtotalCents).toBe(310000);
  });

  it("leaves shipping unknown until a wilaya is chosen", () => {
    const result = preview();
    expect(result.shippingKnown).toBe(false);
    expect(result.shippingFeeCents).toBeNull();
    expect(result.totalCents).toBe(result.subtotalCents);
  });
});

describe("SOUQ — shipping recalculation (wilaya + delivery type)", () => {
  it("uses the wilaya-specific home fee", () => {
    const result = preview({ wilayaCode: 16 });
    expect(result.shippingFeeCents).toBe(50000);
    expect(result.totalCents).toBe(290000 + 50000);
  });

  it("switches to the office fee when delivery type changes", () => {
    const result = preview({ wilayaCode: 16, deliveryType: "office" });
    expect(result.shippingFeeCents).toBe(30000);
    expect(result.totalCents).toBe(290000 + 30000);
  });

  it("falls back to the wilaya 0 zone for unlisted wilayas", () => {
    const result = preview({ wilayaCode: 6, deliveryType: "home" });
    expect(result.shippingFeeCents).toBe(70000);
  });

  it("reports the shipping as unknown when no zone matches at all", () => {
    const result = preview({ zones: [], wilayaCode: 16 });
    expect(result.shippingFeeCents).toBeNull();
    expect(result.shippingKnown).toBe(false);
  });

  it("adds a one-unit line for an add-on product, and keeps add-on-less values informational", () => {
    const guardId = "a1000000-0000-4000-8000-000000000009";
    const groups = buildOptionGroups(
      variants,
      [
        {
          key: "extras",
          label: "الإضافة",
          selection_mode: "multiple",
          values: [
            { value: "حماية الشاشة", addon_product_id: guardId },
            { value: "تغليف هدية" },
          ],
        },
      ],
      [{ id: guardId, slug: "screen-guard", name: "حماية الشاشة", price_cents: 40000 }],
    );
    const group = groups.find((g) => g.key === "extras")!;
    // A value with a real product can be priced by the server; a value without
    // one stays informational (nothing is invented).
    expect(group.values.find((v) => v.value === "حماية الشاشة")?.addonProductId).toBe(guardId);
    expect(group.values.find((v) => v.value === "تغليف هدية")?.informational).toBe(true);

    const selections = { ...emptySelections(groups), extras: ["حماية الشاشة", "تغليف هدية"] };
    const result = preview({
      groups,
      selections,
      wilayaCode: 16,
      addOnProducts: [{ id: guardId, slug: "screen-guard", name: "حماية الشاشة", price_cents: 40000 }],
    });
    expect(result.lines.length).toBe(2);
    expect(result.lines[1]?.isAddOn).toBe(true);
    expect(result.lines[1]?.lineTotalCents).toBe(40000);
    expect(result.subtotalCents).toBe(290000 + 40000);
    expect(result.informational.map((i) => i.value)).toEqual(["تغليف هدية"]);
  });
});

describe("SOUQ — badges and formatting", () => {
  it("computes the discount percentage from compare-at price only", () => {
    expect(discountPercent(290000, 390000)).toBe(26);
    expect(discountPercent(290000, null)).toBe(0);
    expect(discountPercent(290000, 250000)).toBe(0);
  });

  it("maps stock to the three honest badge states", () => {
    expect(stockBadge(42, 8, false)).toBe("in_stock");
    expect(stockBadge(5, 8, false)).toBe("low_stock");
    expect(stockBadge(0, 8, false)).toBe("out_of_stock");
    expect(stockBadge(42, 8, true, 3)).toBe("low_stock");
    expect(stockBadge(42, 8, true, 0)).toBe("out_of_stock");
  });

  it("formats prices with the Arabic dinar suffix and thousands separators", () => {
    expect(formatSouqPrice(290000, "ar", "DZD")).toBe("2 900 دج");
    expect(formatSouqPrice(290000, "fr", "DZD")).toBe("2 900 DA");
    expect(formatSouqPrice(290000, "en", "DZD")).toBe("2 900 DA");
  });
});

describe("SOUQ — Arabic-first copy", () => {
  it("is RTL by default and LTR for fr/en", () => {
    expect(souqCopy("ar").dir).toBe("rtl");
    expect(souqCopy(null).dir).toBe("rtl");
    expect(souqCopy("fr").dir).toBe("ltr");
    expect(souqCopy("en").dir).toBe("ltr");
  });

  it("contains the required COD flow wording", () => {
    const copy = souqCopy("ar");
    expect(copy.checkout.formTitle).toBe("أكمل طلبك");
    expect(copy.checkout.submit).toBe("تأكيد الطلب");
    expect(copy.checkout.products).toBe("سعر المنتجات");
    expect(copy.checkout.shipping).toBe("سعر التوصيل");
    expect(copy.checkout.discount).toBe("الخصم");
    expect(copy.checkout.total).toBe("المجموع");
    expect(copy.checkout.home).toBe("توصيل إلى المنزل");
    expect(copy.checkout.office).toBe("التوصيل إلى المكتب");
    expect(copy.checkout.address).toBe("العنوان");
    expect(copy.checkout.officeName).toBe("مكتب التوصيل");
  });

  it("contains the required success wording (order number + back to shop)", () => {
    const copy = souqCopy("ar");
    expect(copy.success.title).toBe("تم استلام طلبك بنجاح");
    expect(copy.success.orderNumber).toBe("رقم الطلب");
    expect(copy.success.backToShop).toBe("العودة إلى المتجر");
  });

  it("contains the required Arabic error messages (never raw server errors)", () => {
    const copy = souqCopy("ar");
    expect(copy.errors.phone).toBe("يرجى إدخال رقم هاتف صحيح");
    expect(copy.errors.outOfStock).toBe("هذا المنتج غير متوفر حالياً");
    expect(copy.errors.wilaya).toBe("يرجى اختيار الولاية");
    expect(copy.errors.sendFailed).toBe("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى");
  });

  it("names the product-card badges ب Arabic labels", () => {
    const copy = souqCopy("ar");
    expect(copy.product.bestSeller).toBe("الأكثر مبيعاً");
    expect(copy.product.orderNow).toBe("اطلب الآن");
    expect(copy.product.inStock).toBe("متوفر");
  });

  it("keeps the search placeholder and empty-state hints", () => {
    const copy = souqCopy("ar");
    expect(copy.search.placeholder).toBe("ابحث عن منتج...");
    expect(copy.search.noResults.length).toBeGreaterThan(0);
    expect(copy.sections.noProducts.length).toBeGreaterThan(0);
  });

  it("interpolates placeholders", () => {
    expect(souqFormat("خصم {n}%", { n: 20 })).toBe("خصم 20%");
  });
});

describe("SOUQ — Arabic-aware search", () => {
  const items: SouqSearchItem[] = [
    { id: "1", slug: "saat", name: "ساعة ذكية رياضية", priceCents: 290000, compareAtPriceCents: 390000, image: null, categoryName: "إلكترونيات", isFeatured: true },
    { id: "2", slug: "samaat", name: "سماعات لاسلكية", priceCents: 240000, compareAtPriceCents: null, image: null, categoryName: "إلكترونيات", isFeatured: true },
    { id: "3", slug: "misbah", name: "مصباح LED قابل للشحن", priceCents: 190000, compareAtPriceCents: null, image: null, categoryName: "المنزل", isFeatured: false },
  ];

  it("normalizes hamza, taa marbuta, alef maqsura and diacritics", () => {
    expect(normalizeSearchText("أحمد")).toBe(normalizeSearchText("احمد"));
    expect(normalizeSearchText("أسئلة")).toBe(normalizeSearchText("اسءله"));
    expect(normalizeSearchText("مُصْبَاح")).toBe("مصباح");
  });

  it("matches Arabic queries and ranks featured products first", () => {
    const results = searchProducts(items, "سماعات");
    expect(results[0]?.slug).toBe("samaat");
  });

  it("matches a category name and the merchant's latin word", () => {
    expect(searchProducts(items, "المنزل").map((r) => r.slug)).toEqual(["misbah"]);
    expect(searchProducts(items, "led").map((r) => r.slug)).toEqual(["misbah"]);
  });

  it("returns nothing for an empty query and respects the limit", () => {
    expect(searchProducts(items, "   ")).toEqual([]);
    expect(searchProducts(items, "إلكترونيات", { limit: 1 }).length).toBe(1);
  });
});

describe("SOUQ — checkout settings and theme tokens", () => {
  it("defaults to a COD-visible form (quantity, offers, delivery choice)", () => {
    const settings = resolveSouqCheckoutSettings(null);
    expect(settings.showQuantity).toBe(true);
    expect(settings.showQuantityOffers).toBe(true);
    expect(settings.showDeliveryChoice).toBe(true);
    expect(settings.variantDisplay).toBe("dynamic");
    expect(fieldSetting(settings, "phone").required).toBe(true);
    expect(fieldSetting(settings, "email").enabled).toBe(false);
  });

  it("accepts a merchant override and ignores an invalid one", () => {
    const custom = resolveSouqCheckoutSettings({
      show_quantity: false,
      fields: [{ key: "email", enabled: true, required: true }],
    });
    expect(custom.showQuantity).toBe(false);
    expect(fieldSetting(custom, "email").enabled).toBe(true);
    expect(resolveSouqCheckoutSettings({ fields: "nope" }).showQuantity).toBe(true);
  });

  it("composes the shared full_name without losing the last name", () => {
    expect(composeFullName("أحمد", "بن علي", true)).toBe("أحمد بن علي");
    expect(composeFullName("أحمد", "", false)).toBe("أحمد");
  });

  it("maps the store theme to the SOUQ palette with readable accents", () => {
    const palette = souqPalette({ primary_color: "#0f2a47", secondary_color: "#f59e0b", background_color: "#f8fafc" });
    expect(palette.primary).toBe("#0f2a47");
    expect(palette.accent).toBe("#f59e0b");
    expect(readableOn(palette.accent)).toBe(palette.accentText);
    expect(readableOn("#ffffff")).not.toBe(readableOn("#0f2a47"));
  });

  it("falls back to the SOUQ defaults when no theme is configured", () => {
    const palette = souqPalette(null);
    expect(palette.primary).toBe(SOUQ_DEFAULTS.primary);
    const vars = souqCssVars(palette);
    expect(vars["--souq-primary"]).toBe(SOUQ_DEFAULTS.primary);
    expect(Object.keys(vars).length).toBeGreaterThan(8);
  });
});
