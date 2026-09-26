// @vitest-environment jsdom
/**
 * SOUQ — COD form interaction tests (real DOM, no network).
 *
 * The markup tests already prove what the form renders; these tests drive it
 * like a shopper would, because the conversion path depends on client behaviour:
 *  - choosing a wilaya recalculates the delivery fee live (home / office);
 *  - the commune list follows the selected wilaya;
 *  - a quantity pack changes what is ordered and what the summary shows;
 *  - picking an out-of-stock variant blocks the order with Arabic wording;
 *  - invalid customer data never reaches the API;
 *  - a valid order posts identifiers only (never a price) and shows the
 *    Arabic success screen with the real order number;
 *  - a raw server/database message is never shown to the shopper.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { souqCopy } from "../../lib/storefront/souq/copy";
import { buildOptionGroups, type SouqVariantInput } from "../../lib/storefront/souq/variants";
import { resolveSouqCheckoutSettings } from "../../lib/storefront/souq/checkout-settings";
import type { SouqPricingOffer, SouqShippingZone } from "../../lib/storefront/souq/order-model";
import { SouqOrderForm, type SouqOrderFormData } from "../../components/storefront/templates-v2/souq/souq-order-form";

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
      imageUrl: null,
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

function renderForm(overrides: Partial<SouqOrderFormData> = {}) {
  return render(<SouqOrderForm {...formData(overrides)} />);
}

const wilayaSelect = () => screen.getByLabelText(new RegExp(copy.checkout.wilaya)) as HTMLSelectElement;
const communeSelect = () => screen.getByLabelText(new RegExp(copy.checkout.commune)) as HTMLSelectElement;
const summary = () => document.querySelector("dl") as HTMLElement;

/** Pick the in-stock combination (colour + size) of the variant fixture. */
async function chooseInStockVariant(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "أسود" }));
  await user.click(screen.getByRole("button", { name: "40 ملم" }));
}

const submitButton = () => document.querySelector('button[type="submit"]') as HTMLButtonElement;

/** Quantity-pack card (a real <button>) located by its visible Arabic wording. */
function packButton(quantityLabel: string, priceLabel: string): HTMLButtonElement {
  const button = screen
    .getAllByRole("button")
    .find((node) => node.textContent?.includes(quantityLabel) && node.textContent.includes(priceLabel));
  if (!button) throw new Error(`quantity pack not found: ${quantityLabel} / ${priceLabel}`);
  return button as HTMLButtonElement;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SOUQ — COD form interactions", () => {
  it("recalculates the delivery fee live for the selected wilaya (home then office)", async () => {
    const user = userEvent.setup();
    renderForm();

    // No wilaya yet → the summary must say the fee is still pending.
    expect(summary().textContent).toContain(copy.checkout.shippingPending);

    await user.selectOptions(wilayaSelect(), "16");
    expect(summary().textContent).toContain("500 دج"); // 50 000 centimes, home
    expect(summary().textContent).toContain("3 400 دج"); // 2 900 + 500

    await user.click(screen.getByRole("radio", { name: new RegExp(copy.checkout.office) }));
    expect(summary().textContent).toContain("300 دج"); // office fee for wilaya 16
    expect(summary().textContent).toContain("3 200 دج"); // 2 900 + 300
  });

  it("falls back to the wilaya-independent zone for a wilaya without its own fee", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(wilayaSelect(), "31"); // no dedicated zone in the fixture
    expect(summary().textContent).toContain("700 دج"); // zone 0 home fee
    expect(summary().textContent).toContain("3 600 دج");
  });

  it("loads the communes of the chosen wilaya", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(communeSelect().disabled).toBe(true);
    await user.selectOptions(wilayaSelect(), "16");
    expect(communeSelect().disabled).toBe(false);
    expect(within(communeSelect()).queryByRole("option", { name: "Bab El Oued" })).not.toBeNull();
    expect(within(communeSelect()).queryByRole("option", { name: "Oran" })).toBeNull();
  });

  it("swaps the address field for the office field when delivery changes", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText(new RegExp(copy.checkout.address))).not.toBeNull();
    expect(document.getElementById("souq-office")).toBeNull();

    await user.click(screen.getByRole("radio", { name: new RegExp(copy.checkout.office) }));
    expect(document.getElementById("souq-address")).toBeNull();
    expect(screen.getByLabelText(new RegExp(copy.checkout.office))).not.toBeNull();
  });

  it("applies a quantity pack to the order and to the summary", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(wilayaSelect(), "16");
    const pack = packButton(copy.product.twoUnits, "5 200 دج");
    await user.click(pack);

    expect(pack.getAttribute("aria-pressed")).toBe("true");
    expect(summary().textContent).toContain("5 200 دج"); // pack price, not 2 × 2 900
    expect(summary().textContent).toContain("5 700 دج"); // 5 200 + 500 shipping
  });

  it("blocks the order in Arabic when the selected variant is out of stock", async () => {
    const user = userEvent.setup();
    renderForm();

    // The colour group is a single-choice group derived from the real variants.
    await user.click(screen.getByRole("button", { name: "ذهبي" }));
    await user.click(screen.getByRole("button", { name: "44 ملم" }));

    expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes(copy.product.notAvailable))).toBe(true);
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toContain(copy.product.notAvailable);
  });

  it("refuses a combination that is not a sellable variant instead of billing the base product", async () => {
    const user = userEvent.setup();
    renderForm();

    // Colour and size are both answered, but «ذهبي / 40 ملم» is not a variant:
    // posting it as variant_id = null would sell the base product at the wrong
    // price, so the order must be blocked with Arabic wording.
    await user.click(screen.getByRole("button", { name: "ذهبي" }));
    await user.click(screen.getByRole("button", { name: "40 ملم" }));
    await user.click(submitButton());

    const alerts = screen.getAllByRole("alert").map((node) => node.textContent ?? "");
    expect(alerts.join(" | ")).toContain(copy.errors.variantUnavailable);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("validates the customer fields in Arabic without calling the API", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(submitButton());

    const alerts = screen.getAllByRole("alert").map((node) => node.textContent ?? "");
    expect(alerts.join(" | ")).toContain(copy.errors.phone);
    expect(alerts.join(" | ")).toContain(copy.errors.wilaya);
    expect(screen.getByLabelText(new RegExp(copy.checkout.wilaya)).getAttribute("aria-invalid")).toBe("true");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a phone number that is not a valid Algerian mobile", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(new RegExp(copy.checkout.phone)), "0212345678");
    await user.click(submitButton());

    const alerts = screen.getAllByRole("alert").map((node) => node.textContent ?? "");
    expect(alerts.join(" | ")).toContain(copy.errors.phoneMobile);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts identifiers only and shows the Arabic success screen with the order number", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        order_id: "11111111-1111-4111-8111-111111111111",
        order_number: "ORD-000123",
        subtotal_cents: 520000,
        shipping_fee_cents: 50000,
        total_cents: 570000,
        status: "new",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    await chooseInStockVariant(user);
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.firstName)), "أمين");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.lastName)), "بن علي");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.phone)), "0550445566");
    await user.selectOptions(wilayaSelect(), "16");
    await user.selectOptions(communeSelect(), "Bab El Oued");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.address)), "حي 5 جويلية، عمارة 12");
    await user.click(packButton(copy.product.twoUnits, "5 200 دج"));
    await user.click(submitButton());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/checkout/abandoned");
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/checkout");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;

    // Identifiers only: the browser never sends a price or a total.
    expect(body.store_slug).toBe("souq-plus");
    expect(body.lines).toEqual([{ product_id: "p1", variant_id: "v1", quantity: 2 }]);
    expect(body.wilaya_code).toBe(16);
    expect(body.commune).toBe("Bab El Oued");
    expect(body.delivery_type).toBe("home");
    expect(body.full_name).toBe("أمين بن علي");
    expect(body.locale).toBe("ar");
    const serialized = JSON.stringify(body);
    for (const forbidden of ["price", "total", "amount", "subtotal"]) {
      expect(serialized).not.toMatch(new RegExp(`"${forbidden}`, "i"));
    }

    // Success screen — Arabic, real order number, no internal identifier.
    expect(await screen.findByText(copy.success.title)).not.toBeNull();
    expect(screen.getByText("ORD-000123")).not.toBeNull();
    expect(document.body.textContent).toContain(copy.success.backToShop);
    expect(document.body.textContent).not.toContain("11111111-1111-4111-8111-111111111111");
  });

  it("keeps template preview mode read-only while preserving validation and success UX", async () => {
    const user = userEvent.setup();
    renderForm({ previewMode: true, previewOrderNumber: "DEMO-LAMSA" });
    await chooseInStockVariant(user);
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.firstName)), "أمينة");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.lastName)), "بن علي");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.phone)), "0550445566");
    await user.selectOptions(wilayaSelect(), "16");
    await user.selectOptions(communeSelect(), "Bab El Oued");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.address)), "حي 5 جويلية، عمارة 12");
    await user.click(submitButton());

    expect(await screen.findByText("DEMO-LAMSA")).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("never surfaces a raw server or database message", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ ok: false, error: "PGRST116: JSON object requested, multiple (or no) rows returned" }),
      }),
    );

    renderForm();
    await chooseInStockVariant(user);
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.firstName)), "أمين");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.lastName)), "بن علي");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.phone)), "0550445566");
    await user.selectOptions(wilayaSelect(), "16");
    await user.selectOptions(communeSelect(), "Bab El Oued");
    await user.type(screen.getByLabelText(new RegExp(copy.checkout.address)), "حي 5 جويلية، عمارة 12");
    await user.click(submitButton());

    const alerts = await screen.findAllByRole("alert");
    const text = alerts.map((node) => node.textContent ?? "").join(" | ");
    expect(text).toContain(copy.errors.sendFailed);
    expect(text).not.toContain("PGRST");
  });
});
