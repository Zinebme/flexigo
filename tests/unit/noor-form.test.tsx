// @vitest-environment jsdom
/**
 * NOOR — COD form interaction tests (real DOM, no network).
 *
 * NOOR's buy-box reuses the shared, secure checkout engine, so we drive the
 * NOOR skin exactly like a shopper would and assert:
 *  - the NOOR Arabic beauty wording renders (form title / submit / sticky CTA);
 *  - invalid data never reaches the API;
 *  - preview mode stays read-only and shows the Arabic success screen;
 *  - an out-of-stock variant combination blocks the order.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { noorCopy } from "../../lib/storefront/noor/copy";
import {
  noorDemoCheckoutSettings,
  noorDemoOffers,
  noorDemoOptionGroups,
  noorDemoProducts,
  noorDemoVariants,
  noorDemoZones,
} from "../../lib/preview/noor-demo";
import { NoorProductView } from "../../components/storefront/templates-v2/noor/noor-product-view";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
  default: ({ src, alt }: { src?: string; alt?: string }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} />,
}));

const copy = noorCopy("ar");
const product = noorDemoProducts[0]!;

function viewData(overrides: Partial<Parameters<typeof NoorProductView>[0]["data"]> = {}) {
  return {
    storeSlug: "noor-demo",
    base: "/preview/noor",
    copy,
    lang: "ar" as const,
    currency: "DZD",
    settings: noorDemoCheckoutSettings,
    product: { id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents, compareAtPriceCents: product.compareAtPriceCents, imageUrl: product.image, stock: product.stock },
    variants: noorDemoVariants,
    optionGroups: noorDemoOptionGroups,
    addOnProducts: [],
    offers: noorDemoOffers,
    zones: noorDemoZones,
    officeDeliveryEnabled: true,
    whatsapp: null,
    anchorId: "noor-order-form",
    previewMode: true,
    previewOrderNumber: "DEMO-NOOR",
    images: ["/images/noor/serum.jpg"],
    description: "سيروم ترطيب يومي.",
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    shipping: { hasZones: true, homeFromCents: 50000, officeFromCents: 35000, officeEnabled: true },
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  // jsdom has no layout APIs used by the shared form's focus/scroll helpers.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NOOR — COD form skin and validation", () => {
  it("renders the NOOR Arabic beauty form wording", () => {
    render(<NoorProductView data={viewData()} />);
    expect(screen.getByText("أكملي طلبك")).toBeTruthy();
    expect(screen.getByRole("button", { name: /تأكيد الطلب/ })).toBeTruthy();
    expect(screen.getAllByText(/اطلبي الآن/).length).toBeGreaterThan(0);
  });

  it("blocks invalid customer data without calling the API", async () => {
    const user = userEvent.setup();
    const { container } = render(<NoorProductView data={viewData()} />);
    await user.click(screen.getByRole("button", { name: /تأكيد الطلب/ }));
    expect(container.querySelector('[data-field="firstName"]')).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("shows the Arabic success screen in read-only preview mode", async () => {
    const user = userEvent.setup();
    const { container } = render(<NoorProductView data={viewData()} />);
    // Valid variant combination.
    await user.click(screen.getByRole("button", { name: "30مل" }));
    await user.click(screen.getByRole("button", { name: "وردة" }));
    await user.type(container.querySelector('input[name="souq-first-name"]')!, "نور");
    await user.type(container.querySelector('input[name="souq-last-name"]')!, "بن يوسف");
    await user.type(container.querySelector('input[name="souq-phone"]')!, "0550123456");
    // Wilaya + commune.
    const wilaya = container.querySelector('select[name="souq-wilaya"]') as HTMLSelectElement;
    await user.selectOptions(wilaya, "16");
    const commune = container.querySelector('select[name="souq-commune"]') as HTMLSelectElement;
    await user.selectOptions(commune, commune.querySelector("option:not([value=''])")?.getAttribute("value") ?? "");
    await user.type(container.querySelector('input[name="souq-address"]')!, "حي السلام، شارع 19");
    await user.click(screen.getByRole("button", { name: /تأكيد الطلب/ }));
    expect(await screen.findByText("تم استلام طلبكِ", {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.getAllByText(/DEMO-NOOR/).length).toBeGreaterThan(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("blocks an out-of-stock variant combination with Arabic wording", async () => {
    const user = userEvent.setup();
    render(<NoorProductView data={viewData()} />);
    await user.click(screen.getByRole("button", { name: "50مل" }));
    await user.click(screen.getByRole("button", { name: "ياسمين" }));
    // The shared engine explains unavailability in Arabic (never a silent button).
    const matches = await screen.findAllByText(copy.product.notAvailable, {}, { timeout: 2000 });
    expect(matches.length).toBeGreaterThan(0);
    const submit = screen.getByRole("button", { name: copy.product.notAvailable }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(screen.queryByText("تم استلام طلبكِ")).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
