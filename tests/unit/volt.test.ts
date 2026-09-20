import { describe, expect, it } from "vitest";
import { VOLT_TEMPLATE_KEY, isVoltTemplate, voltHomeSections, voltContentPages } from "@/lib/templates/volt";
import { getTemplate, defaultHomeSections, defaultPages } from "@/lib/templates/defaults";

describe("VOLT template", () => {
  it("uses a unique canonical key", () => {
    expect(VOLT_TEMPLATE_KEY).toBe("volt-v1");
    expect(isVoltTemplate("volt-v1")).toBe(true);
    expect(isVoltTemplate("tech")).toBe(false);
  });

  it("is registered as Arabic RTL tech ecommerce", () => {
    const tpl=getTemplate("volt-v1");
    expect(tpl?.category).toBe("Tech");
    expect(tpl?.language).toBe("ar");
    expect(tpl?.direction).toBe("rtl");
    expect(tpl?.websiteTypes).toContain("ecommerce");
    expect(tpl?.previewMobileUrl).toBe("/images/templates/volt-v1-mobile.svg");
  });

  it("ships structured Arabic defaults without raw html", () => {
    const sections=voltHomeSections("فولت الجزائر");
    expect(sections.length).toBeGreaterThan(6);
    expect(sections[0]?.type).toBe("hero");
    expect(JSON.stringify(sections)).not.toMatch(/<script|javascript:/i);
    expect(defaultHomeSections("volt-v1","ecommerce","فولت")).toHaveLength(sections.length);
  });

  it("creates Arabic ecommerce pages", () => {
    const pages=voltContentPages("فولت");
    expect(pages.some((p)=>p.key==="faq")).toBe(true);
    const defaults=defaultPages("volt-v1","ecommerce","فولت");
    expect(defaults.some((p)=>p.key==="home"&&p.title==="الرئيسية")).toBe(true);
    expect(defaults.some((p)=>p.key==="shop"&&p.title==="المتجر")).toBe(true);
  });
});
