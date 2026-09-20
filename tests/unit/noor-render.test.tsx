// @vitest-environment jsdom
/**
 * NOOR — presentational render tests (real DOM, no network).
 *
 * Asserts the distinct beauty building blocks render with the NOOR skin and,
 * crucially, that optional result-bearing blocks (before/after, stats) render
 * nothing unless the merchant actually supplied content.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { noorCopy } from "../../lib/storefront/noor/copy";
import { noorDemoProducts, noorDemoReviews } from "../../lib/preview/noor-demo";
import { NoorBenefits, NoorBeforeAfter, NoorReviewCards, NoorRoutine, NoorSocialGallery, NoorStats } from "../../components/storefront/templates-v2/noor/noor-home-blocks";
import { NoorProductCard } from "../../components/storefront/templates-v2/noor/noor-product-card";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
  default: ({ src, alt }: { src?: string; alt?: string }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} />,
}));

const copy = noorCopy("ar");

describe("NOOR — building blocks", () => {
  it("renders benefit and routine cards", () => {
    const { container } = render(
      <>
        <NoorBenefits items={[{ title: "ترطيب", text: "نعومة تدوم" }, { title: "إشراقة", text: null }]} />
        <NoorRoutine steps={[{ title: "التنظيف", text: "خطوة أولى" }, { title: "الترطيب", text: "خطوة ثانية" }]} />
      </>,
    );
    expect(screen.getByText("ترطيب")).toBeTruthy();
    expect(screen.getByText("التنظيف")).toBeTruthy();
    expect(container.querySelectorAll(".noor-product-label").length).toBe(0);
  });

  it("never renders before/after unless both images are supplied", () => {
    const { container: missing } = render(<NoorBeforeAfter beforeImage="/images/noor/texture.jpg" afterImage={null} />);
    expect(missing.innerHTML).toBe("");
    const { container: full } = render(<NoorBeforeAfter beforeImage="/images/noor/texture.jpg" afterImage="/images/noor/cream.jpg" beforeLabel="قبل" afterLabel="بعد" />);
    expect(full.textContent).toContain("قبل");
    expect(full.textContent).toContain("بعد");
  });

  it("renders stats only from provided values", () => {
    const { container: empty } = render(<NoorStats items={[]} />);
    expect(empty.innerHTML).toBe("");
    const { container } = render(<NoorStats items={[{ value: "95%", label: "أحببن الملمس" }]} />);
    expect(container.textContent).toContain("95%");
  });

  it("renders review cards without faking verification", () => {
    const { container } = render(<NoorReviewCards reviews={noorDemoReviews} />);
    expect(container.textContent).toContain("أمينة، الجزائر");
    expect(container.textContent).not.toContain("طلب موثّق");
  });

  it("renders the social gallery grid", () => {
    const { container } = render(<NoorSocialGallery images={["/images/noor/serum.jpg", "/images/noor/cream.jpg"]} altBase="نور" />);
    expect(container.querySelectorAll("img").length).toBe(2);
  });

  it("renders the beauty product card with badge and price", () => {
    const { container } = render(<NoorProductCard product={noorDemoProducts[0]!} base="/preview/noor" copy={copy} lang="ar" currency="DZD" />);
    expect(container.textContent).toContain("سيروم ترطيب يومي");
    expect(container.textContent).toContain(copy.product.bestSeller);
    expect(container.textContent).toContain("دج");
  });
});
