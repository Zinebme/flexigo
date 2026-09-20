/**
 * SOUQ — rendering tests (server markup).
 *
 * Renders the real components with fixture data (no database, no network) and
 * asserts the presentation requirements: Arabic-first copy, RTL attributes,
 * discount/stock badges, quantity-offer cards, wilaya + delivery selectors,
 * the summary lines, the COD notes and the mobile sticky CTA.
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { souqCopy } from "../../lib/storefront/souq/copy";
import { buildOptionGroups, type SouqVariantInput } from "../../lib/storefront/souq/variants";
import { resolveSouqCheckoutSettings } from "../../lib/storefront/souq/checkout-settings";
import type { SouqProductSummary } from "../../lib/storefront/souq/catalog";
import type { SouqPricingOffer, SouqShippingZone } from "../../lib/storefront/souq/order-model";
import { SouqProductCard } from "../../components/storefront/templates-v2/souq/souq-product-card";
import { SouqOrderForm, type SouqOrderFormData } from "../../components/storefront/templates-v2/souq/souq-order-form";
import { SouqProductView } from "../../components/storefront/templates-v2/souq/souq-product-view";

// next/image is not usable outside the Next runtime — render a plain <img>.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
  default: ({ src, alt }: { src?: string; alt?: string }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} />,
}));

const copy = souqCopy("ar");

const variants: SouqVariantInput[] = [
  { id: "v1", name: "أسود / 40 ملم", options: { اللون: "أسود", المقاس: "40 ملم" }, price_cents: null, stock: 18, is_active: true },
  { id: "v2", name: "ذهبي / 44 ملم", options: { اللون: "ذهبي", المقاس: "44 ملم" }, price_cents: 320000, stock: 0, is_active: true },
];

const optionGroups = buildOptionGroups(variants, null);

const offers: SouqPricingOffer[] = [
  { id: "o2", store_id: "s1", product_id: "p1", min_quantity: 2, total_price_cents: 520000, label: "قطعتان : 5 200 دج", is_active: true },
  { id: "o3", store_id: "s1", product_id: "p1", min_quantity: 3, total_price_cents: 720000, label: "3 قطع : 7 200 دج", is_active: true },
];

const zones: SouqShippingZone[] = [
  { wilaya_code: 0, home_fee_cents: 70000, office_fee_cents: 40000, is_active: true },
  { wilaya_code: 16, home_fee_cents: 50000, office_fee_cents: 30000, is_active: true },
];

function formData(overrides: Partial<SouqOrderFormData> = {}): SouqOrderFormData {
  return {
    storeSlug: "souq-plus",
    base: "/s/souq-plus",
    copy,
    lang: "ar",
    currency: "DZD",
    settings: resolveSouqCheckoutSettings(null),
    product: {
      id: "p1",
      slug: "saat-dhakiyya",
      name: "ساعة ذكية رياضية",
      priceCents: 290000,
      compareAtPriceCents: 390000,
      imageUrl: "https://picsum.photos/seed/souq-watch-1/800/800",
      stock: 42,
      ratingAverage: 4.5,
      ratingCount: 12,
    },
    variants,
    optionGroups,
    addOnProducts: [],
    offers,
    zones,
    officeDeliveryEnabled: true,
    whatsapp: "https://wa.me/213550445566",
    anchorId: "souq-order-form",
    ...overrides,
  };
}

const summary: SouqProductSummary = {
  id: "p1",
  slug: "saat-dhakiyya",
  name: "ساعة ذكية رياضية",
  priceCents: 290000,
  compareAtPriceCents: 390000,
  image: "https://picsum.photos/seed/souq-watch-1/800/800",
  categoryId: "c1",
  categoryName: "إلكترونيات",
  categorySlug: "electronics",
  sku: "SQ-WAT-031",
  hasVariants: true,
  isFeatured: true,
  stock: 42,
  lowStockThreshold: 8,
  ratingAverage: 4.5,
  ratingCount: 12,
};

describe("SOUQ — product card rendering", () => {
  it("shows the discount badge, the stock badge and the quick order CTA", () => {
    const html = renderToStaticMarkup(<SouqProductCard product={summary} base="/s/souq-plus" copy={copy} lang="ar" />);
    expect(html).toContain("ساعة ذكية رياضية");
    expect(html).toContain("خصم 26%");
    expect(html).toContain(copy.product.inStock);
    expect(html).toContain(copy.product.orderNow);
    expect(html).toContain("2 900 دج");
    expect(html).toContain('href="/s/souq-plus/produit/saat-dhakiyya"');
  });

  it("never invents a discount when there is no compare-at price", () => {
    const html = renderToStaticMarkup(
      <SouqProductCard
        product={{ ...summary, compareAtPriceCents: null, isFeatured: false, ratingAverage: null, ratingCount: 0 }}
        base="/s/souq-plus"
        copy={copy}
        lang="ar"
      />,
    );
    expect(html).not.toContain("خصم");
    expect(html).not.toContain(copy.product.bestSeller);
  });

  it("renders an honest empty state when the product has no image", () => {
    const html = renderToStaticMarkup(
      <SouqProductCard product={{ ...summary, image: null }} base="/s/souq-plus" copy={copy} lang="ar" />,
    );
    expect(html).toContain('data-souq-fallback="true"');
  });

  it("shows the 'متوفر' badge on a plain in-stock product", () => {
    const html = renderToStaticMarkup(
      <SouqProductCard
        product={{ ...summary, hasVariants: false, stock: 42, isFeatured: false, ratingAverage: null }}
        base="/s/souq-plus"
        copy={copy}
        lang="ar"
      />,
    );
    expect(html).toContain(copy.product.inStock);
  });
});

describe("SOUQ — COD form rendering", () => {
  const html = renderToStaticMarkup(<SouqOrderForm {...formData()} />);

  it("uses the required Arabic title and subtitle", () => {
    expect(html).toContain("أكمل طلبك");
    expect(html).toContain(copy.checkout.formSubtitle);
    expect(copy.dir).toBe("rtl");
  });

  it("renders the quantity-offer cards (1 / 2 / 3) with their Arabic quantity words", () => {
    expect(html).toContain(copy.checkout.quantityLabel);
    expect(html).toContain("قطعة واحدة");
    expect(html).toContain("قطعتان");
    expect(html).toContain("3 قطع");
    expect(html).toContain("5 200 دج");
    expect(html).toContain("7 200 دج");
    expect(html).toContain("توفير 600 دج"); // real savings of the 2-piece pack
    expect(html).toContain(copy.product.mostOrdered);
    expect(html).toContain(copy.product.specialOffer);
    // merchant wording is preserved for assistive tech / hover
    expect(html).toContain('title="قطعتان : 5 200 دج"');
  });

  it("renders the customer fields with the Algerian phone input", () => {
    expect(html).toContain('id="souq-first-name"');
    expect(html).toContain('id="souq-last-name"');
    expect(html).toContain('type="tel"');
    expect(html).toContain("05 XX XX XX XX");
    expect(html).toContain(copy.checkout.phoneHint);
  });

  it("renders all 58 wilayas plus the commune field", () => {
    const options = html.match(/<option value="\d+"/g) ?? [];
    expect(options.length).toBe(58); // every Algerian wilaya
    expect(html).toContain('id="souq-wilaya"');
    expect(html).toContain('id="souq-commune"');
    expect(html).toContain("16 - الجزائر");
    expect(html).toContain("31 - وهران");
  });

  it("offers home and office delivery as real radio inputs", () => {
    expect(html).toContain(copy.checkout.home);
    expect(html).toContain(copy.checkout.office);
    expect(html).toMatch(/<input[^>]*type="radio"[^>]*name="souq-delivery"[^>]*value="home"/);
    expect(html).toMatch(/<input[^>]*type="radio"[^>]*name="souq-delivery"[^>]*value="office"/);
    expect(html).toContain('checked=""'); // home is the default choice
  });

  it("renders the display-only summary lines and the amber CTA", () => {
    expect(html).toContain(copy.checkout.summary);
    expect(html).toContain(copy.checkout.products);
    expect(html).toContain(copy.checkout.shipping);
    expect(html).toContain(copy.checkout.total);
    expect(html).toContain(copy.checkout.submit);
    expect(html).toContain(copy.checkout.codNote);
    expect(html).toContain(copy.checkout.secureNote);
    expect(html).toContain(copy.checkout.trustNote); // server stays authoritative
  });

  it("keeps the anti-spam honeypot out of the visible flow", () => {
    expect(html).toContain('id="souq-website"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("-left-[9999px]"); // off-canvas, never tabbable
    expect(html).toContain('tabindex="-1"');
  });

  it("blocks the order and explains it in Arabic when the product is out of stock", () => {
    const outOfStock = renderToStaticMarkup(
      <SouqOrderForm
        {...formData({ product: { ...formData().product, stock: 0 }, variants: [], optionGroups: [] })}
      />,
    );
    expect(outOfStock).toContain(copy.product.notAvailable);
    expect(outOfStock).toContain('role="alert"');
    expect(outOfStock).toMatch(/disabled=""/);
  });

  it("hides the option pickers and quantity offers when the host page renders them", () => {
    const hosted = renderToStaticMarkup(
      <SouqOrderForm {...formData({ showOptionPickers: false, showQuantityOffers: false })} />,
    );
    expect(hosted).not.toContain("قطعتان : 5 200 دج");
    expect(hosted).toContain(copy.checkout.submit);
  });
});

describe("SOUQ — product page rendering", () => {
  const html = renderToStaticMarkup(
    <SouqProductView
      data={{
        ...formData({ showOptionPickers: false, showQuantityOffers: false }),
        images: [
          "https://picsum.photos/seed/souq-watch-1/800/800",
          "https://picsum.photos/seed/souq-watch-2/800/800",
        ],
        description: "ساعة ذكية بشاشة لمس كبيرة.",
        ratingAverage: 4.5,
        ratingCount: 12,
        shipping: { homeFromCents: 50000, officeFromCents: 30000, officeEnabled: true },
        benefits: ["بطارية تدوم حتى 7 أيام", "مقاومة للماء والغبار"],
      }}
    />,
  );

  it("renders the gallery and the buy box in RTL", () => {
    expect(html).toContain("souq-watch-1");
    expect(html).toContain("souq-watch-2");
    expect(html).toContain("ساعة ذكية رياضية");
    expect(html).toContain("خصم 26%");
  });

  it("shows the benefit list and the trust strip", () => {
    expect(html).toContain("بطارية تدوم حتى 7 أيام");
    expect(html).toContain("مقاومة للماء والغبار");
    expect(html).toContain(copy.product.codPayment);
    expect(html).toContain(copy.product.deliveryTo58);
  });

  it("renders the mobile-only sticky CTA with the live price", () => {
    expect(html).toContain("souq-sticky-cta");
    expect(html).toContain("lg:hidden"); // desktop keeps the inline form CTA
    expect(html).toContain(`${copy.product.orderNow} •`);
    expect(html).toContain("2 900 دج");
    expect(html).toContain("souq-order-form"); // scroll target id
  });
});
