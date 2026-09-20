import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { TEMPLATES, defaultHomeSections, defaultPages, getTemplate } from "../../lib/templates/defaults";
import { LAMSA_TEMPLATE_KEY, isLamsaTemplate } from "../../lib/templates/lamsa";
import { lamsaCopy } from "../../lib/storefront/lamsa/copy";
import { LAMSA_DEFAULTS, lamsaCssVars } from "../../lib/storefront/lamsa/tokens";
import { serializeLamsaJsonLd } from "../../lib/storefront/lamsa/json-ld";
import { safeLamsaExternalUrl } from "../../lib/storefront/lamsa/links";
import { imageUrl, pageContentSchema } from "../../lib/sections/definitions";
import { lamsaDemoOffers, lamsaDemoOptionGroups, lamsaDemoProducts, lamsaDemoVariants, lamsaDemoZones } from "../../lib/preview/lamsa-demo";
import { emptySelections, resolveVariant, validateSelections } from "../../lib/storefront/souq/variants";
import { buildOrderPreview } from "../../lib/storefront/souq/order-model";

describe("LAMSA — isolated registry and defaults", () => {
  it("registers one explicit Arabic-first fashion key without aliases", () => {
    expect(LAMSA_TEMPLATE_KEY).toBe("lamsa-v1");
    expect(isLamsaTemplate("lamsa-v1")).toBe(true);
    expect(isLamsaTemplate("lamsa")).toBe(false);
    expect(TEMPLATES.filter((template) => template.key === LAMSA_TEMPLATE_KEY)).toHaveLength(1);
    const template = getTemplate(LAMSA_TEMPLATE_KEY);
    expect(template).toMatchObject({ name: "LAMSA", category: "Fashion", categoryKey: "fashion", language: "ar", direction: "rtl" });
    expect(template?.highlights).toMatchObject({ dynamicVariants: true, multiSelectOptions: true, quantityOffers: true, codForm: true, rtl: true });
  });

  it("creates a complete structured homepage and Arabic content pages", () => {
    const sections = defaultHomeSections(LAMSA_TEMPLATE_KEY, "ecommerce", "لمسة بوتيك");
    expect(sections.map((section) => section.type)).toEqual([
      "hero", "products", "collections", "products", "banner", "offer", "products", "features", "reviews", "gallery", "faq", "contact",
    ]);
    expect(pageContentSchema.safeParse({ sections }).success).toBe(true);
    const pages = defaultPages(LAMSA_TEMPLATE_KEY, "ecommerce", "لمسة بوتيك");
    expect(pages.find((page) => page.key === "home")?.title).toBe("الرئيسية");
    expect(pages.some((page) => page.key === "shop")).toBe(true);
    expect(defaultHomeSections("souq-v1", "ecommerce", "سوق")[0]?.type).toBe("hero");
  });

  it("allows safe bundled preview imagery but rejects traversal and scripts", () => {
    expect(imageUrl.safeParse("/images/lamsa/hero.jpg").success).toBe(true);
    expect(imageUrl.safeParse("/images/../../secret.png").success).toBe(false);
    expect(imageUrl.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("LAMSA — design system and Arabic copy", () => {
  it("uses the requested quiet-luxury defaults and defines every used token", () => {
    const vars = lamsaCssVars(null) as Record<string, string>;
    expect(vars["--lamsa-ivory"]).toBe(LAMSA_DEFAULTS.ivory);
    expect(vars["--lamsa-chocolate"]).toBe(LAMSA_DEFAULTS.chocolate);
    expect(vars["--lamsa-gold"]).toBe(LAMSA_DEFAULTS.gold);
    const css = readFileSync("components/storefront/templates-v2/lamsa/lamsa.css", "utf8");
    const used = new Set(css.match(/--lamsa-[a-z-]+/g) ?? []);
    for (const token of used) expect(vars[token], `${token} is undefined`).toBeTruthy();
  });

  it("keeps Arabic feminine storefront and checkout wording", () => {
    const copy = lamsaCopy("ar");
    expect(copy.dir).toBe("rtl");
    expect(copy.search.placeholder).toBe("ابحثي عن منتج...");
    expect(copy.checkout.formTitle).toBe("أكملي طلبك");
    expect(copy.checkout.submit).toBe("تأكيد الطلب");
    expect(copy.product.orderNow).toBe("اطلبي الآن");
  });

  it("escapes merchant text before embedding product JSON-LD", () => {
    const serialized = serializeLamsaJsonLd({ name: "</script><script>alert('x')</script>&" });
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(serialized).name).toBe("</script><script>alert('x')</script>&");
  });

  it("allows social web links but rejects executable and non-web protocols", () => {
    expect(safeLamsaExternalUrl("https://instagram.com/lamsa")).toBe("https://instagram.com/lamsa");
    expect(safeLamsaExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeLamsaExternalUrl("data:text/html,unsafe")).toBeNull();
  });
});

describe("LAMSA — real variants, offers, and shipping primitives", () => {
  it("supports arbitrary single and multiple groups from real variant data", () => {
    expect(lamsaDemoOptionGroups.map((group) => group.label)).toEqual(["اللون", "المقاس", "نوع القماش", "إضافات"]);
    expect(lamsaDemoOptionGroups.at(-1)?.selectionMode).toBe("multiple");
    expect(lamsaDemoOptionGroups.at(-1)?.displayType).toBe("checkbox");
    const empty = emptySelections(lamsaDemoOptionGroups);
    expect(validateSelections(lamsaDemoOptionGroups, empty).length).toBeGreaterThan(0);
  });

  it("resolves only a server-known combination and blocks an impossible one", () => {
    const valid = { color: ["أسود"], size: ["M"], fabric: ["كريب"], extras: [] };
    expect(resolveVariant(lamsaDemoVariants, lamsaDemoOptionGroups, valid)?.id).toBe("30000000-0000-4000-8000-000000000001");
    const invalid = { color: ["بيج"], size: ["XL"], fabric: ["كريب"], extras: [] };
    expect(resolveVariant(lamsaDemoVariants, lamsaDemoOptionGroups, invalid)).toBeNull();
  });

  it("previews real variant, quantity pack, and wilaya delivery while sending identifiers", () => {
    const selections = { color: ["أسود"], size: ["M"], fabric: ["كريب"], extras: [] };
    const preview = buildOrderPreview({
      product: { id: lamsaDemoProducts[0]!.id, name: lamsaDemoProducts[0]!.name, price_cents: lamsaDemoProducts[0]!.priceCents },
      variants: lamsaDemoVariants,
      groups: lamsaDemoOptionGroups,
      selections,
      quantity: 2,
      offers: lamsaDemoOffers,
      addOnProducts: [],
      zones: lamsaDemoZones,
      wilayaCode: 16,
      deliveryType: "office",
    });
    expect(preview.variant?.id).toBe("30000000-0000-4000-8000-000000000001");
    expect(preview.lines[0]).toMatchObject({ quantity: 2, lineTotalCents: 1080000 });
    expect(preview.shippingFeeCents).toBe(35000);
    expect(preview.totalCents).toBe(1115000);
  });

  it("ships a safe registry-only migration", () => {
    const sql = readFileSync("supabase/migrations/20260918000018_lamsa_template.sql", "utf8").toLowerCase();
    expect(sql).toContain("'lamsa-v1'");
    expect(sql).toContain("on conflict (key) do nothing");
    expect(sql).not.toMatch(/update\s+public\.stores|delete\s+from|insert\s+into\s+public\.(orders|customers)/);
  });
});
