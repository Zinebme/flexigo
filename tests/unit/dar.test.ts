import { describe, expect, it } from "vitest";
import { DAR_TEMPLATE_KEY, isDarTemplate, darHomeSections, darContentPages } from "@/lib/templates/dar";
import { getTemplate, defaultHomeSections, defaultPages } from "@/lib/templates/defaults";

describe("DAR template", () => {
  it("uses a unique canonical key", () => {
    expect(DAR_TEMPLATE_KEY).toBe("dar-v1");
    expect(isDarTemplate("dar-v1")).toBe(true);
    expect(isDarTemplate("casa")).toBe(false);
  });
  it("is registered as Arabic RTL home ecommerce", () => {
    const tpl=getTemplate("dar-v1");
    expect(tpl?.category).toBe("Home");
    expect(tpl?.language).toBe("ar");
    expect(tpl?.direction).toBe("rtl");
    expect(tpl?.websiteTypes).toContain("ecommerce");
    expect(tpl?.previewMobileUrl).toBe("/images/templates/dar-v1-mobile.svg");
  });
  it("ships structured Arabic defaults", () => {
    const sections=darHomeSections("دار الجزائر");
    expect(sections.length).toBeGreaterThan(6);
    expect(sections[0]?.type).toBe("hero");
    expect(JSON.stringify(sections)).not.toMatch(/<script|javascript:/i);
    expect(defaultHomeSections("dar-v1","ecommerce","دار")).toHaveLength(sections.length);
  });
  it("creates Arabic ecommerce pages", () => {
    expect(darContentPages("دار").some((p)=>p.key==="faq")).toBe(true);
    const pages=defaultPages("dar-v1","ecommerce","دار");
    expect(pages.some((p)=>p.key==="home"&&p.title==="الرئيسية")).toBe(true);
    expect(pages.some((p)=>p.key==="shop"&&p.title==="المتجر")).toBe(true);
  });
});
