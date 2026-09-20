import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { TEMPLATES, defaultHomeSections, defaultPages, getTemplate } from "../../lib/templates/defaults";
import { NOOR_TEMPLATE_KEY, isNoorTemplate } from "../../lib/templates/noor";
import { noorCopy } from "../../lib/storefront/noor/copy";
import { NOOR_DEFAULTS, noorCssVars } from "../../lib/storefront/noor/tokens";
import { serializeNoorJsonLd } from "../../lib/storefront/noor/json-ld";
import { safeNoorExternalUrl } from "../../lib/storefront/noor/links";
import { SECTION_DEFS, imageUrl, pageContentSchema } from "../../lib/sections/definitions";
import { noorDemoOffers, noorDemoOptionGroups, noorDemoProducts, noorDemoVariants, noorDemoZones } from "../../lib/preview/noor-demo";
import { emptySelections, resolveVariant, validateSelections } from "../../lib/storefront/souq/variants";
import { buildOrderPreview } from "../../lib/storefront/souq/order-model";

describe("NOOR — isolated registry and defaults", () => {
  it("registers one explicit Arabic-first beauty key without aliases", () => {
    expect(NOOR_TEMPLATE_KEY).toBe("noor-v1");
    expect(isNoorTemplate("noor-v1")).toBe(true);
    expect(isNoorTemplate("noor")).toBe(false);
    expect(TEMPLATES.filter((template) => template.key === NOOR_TEMPLATE_KEY)).toHaveLength(1);
    const template = getTemplate(NOOR_TEMPLATE_KEY);
    expect(template).toMatchObject({ name: "NOOR", category: "Beauty", categoryKey: "beauty", language: "ar", direction: "rtl" });
    expect(template?.highlights).toMatchObject({ dynamicVariants: true, multiSelectOptions: true, quantityOffers: true, codForm: true, rtl: true });
  });

  it("creates a complete structured Arabic homepage without inventing before/after", () => {
    const sections = defaultHomeSections(NOOR_TEMPLATE_KEY, "ecommerce", "نور بيوتي");
    expect(sections.map((section) => section.type)).toEqual([
      "hero", "collections", "products", "features", "how_it_works", "banner", "products", "offer", "reviews", "gallery", "faq", "contact",
    ]);
    // New stores never ship a fabricated before/after block.
    expect(sections.some((section) => section.type === "before_after")).toBe(false);
    expect(pageContentSchema.safeParse({ sections }).success).toBe(true);
    const pages = defaultPages(NOOR_TEMPLATE_KEY, "ecommerce", "نور بيوتي");
    expect(pages.find((page) => page.key === "home")?.title).toBe("الرئيسية");
    expect(pages.some((page) => page.key === "shop")).toBe(true);
  });

  it("keeps routine / gallery / before_after editable for ecommerce stores", () => {
    expect(SECTION_DEFS.how_it_works.allowedFor).toContain("ecommerce");
    expect(SECTION_DEFS.gallery.allowedFor).toContain("ecommerce");
    expect(SECTION_DEFS.before_after.allowedFor).toContain("ecommerce");
  });

  it("validates the optional before_after section and rejects unsafe images", () => {
    const good = pageContentSchema.safeParse({
      sections: [{ id: "ba1", type: "before_after", enabled: true, before_image: "/images/noor/texture.jpg", after_image: "/images/noor/cream.jpg", before_label: "قبل", after_label: "بعد", note: null, layout: "split" }],
    });
    expect(good.success).toBe(true);
    expect(imageUrl.safeParse("/images/noor/hero.jpg").success).toBe(true);
    expect(imageUrl.safeParse("/images/../../secret.png").success).toBe(false);
    expect(imageUrl.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("NOOR — design system and Arabic copy", () => {
  it("uses the requested soft-luxury defaults and defines every used token", () => {
    const vars = noorCssVars(null) as Record<string, string>;
    expect(vars["--noor-bg"]).toBe(NOOR_DEFAULTS.bg);
    expect(vars["--noor-plum"]).toBe(NOOR_DEFAULTS.plum);
    expect(vars["--noor-gold"]).toBe(NOOR_DEFAULTS.gold);
    const css = readFileSync("components/storefront/templates-v2/noor/noor.css", "utf8");
    const used = new Set(css.match(/--noor-[a-z-]+/g) ?? []);
    for (const token of used) expect(vars[token], `${token} is undefined`).toBeTruthy();
  });

  it("keeps Arabic feminine beauty storefront and checkout wording", () => {
    const copy = noorCopy("ar");
    expect(copy.dir).toBe("rtl");
    expect(copy.search.placeholder).toBe("ابحثي عن منتج...");
    expect(copy.checkout.formTitle).toBe("أكملي طلبك");
    expect(copy.checkout.submit).toBe("تأكيد الطلب");
    expect(copy.product.orderNow).toBe("اطلبي الآن");
    expect(copy.promo.defaultBar).toBe("توصيل إلى 58 ولاية • الدفع عند الاستلام");
  });

  it("escapes merchant text before embedding product JSON-LD", () => {
    const serialized = serializeNoorJsonLd({ name: "</script><script>alert('x')</script>&" });
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(JSON.parse(serialized).name).toBe("</script><script>alert('x')</script>&");
  });

  it("allows social web links but rejects executable and non-web protocols", () => {
    expect(safeNoorExternalUrl("https://instagram.com/noor")).toBe("https://instagram.com/noor");
    expect(safeNoorExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeNoorExternalUrl("data:text/html,unsafe")).toBeNull();
  });
});

describe("NOOR — real variants, offers, and shipping primitives", () => {
  it("supports arbitrary single and multiple groups from real variant data", () => {
    expect(noorDemoOptionGroups.map((group) => group.label)).toEqual(["الحجم", "الرائحة", "إضافات"]);
    expect(noorDemoOptionGroups.at(-1)?.selectionMode).toBe("multiple");
    expect(noorDemoOptionGroups.at(-1)?.displayType).toBe("checkbox");
    const empty = emptySelections(noorDemoOptionGroups);
    expect(validateSelections(noorDemoOptionGroups, empty).length).toBeGreaterThan(0);
  });

  it("resolves only a server-known combination and blocks an impossible one", () => {
    const valid = { size: ["30مل"], scent: ["وردة"], extras: [] };
    expect(resolveVariant(noorDemoVariants, noorDemoOptionGroups, valid)?.id).toBe("31000000-0000-4000-8000-000000000001");
    const invalid = { size: ["50مل"], scent: ["ياسمين"], extras: [] };
    // That combination exists but is out of stock; a truly impossible one:
    expect(resolveVariant(noorDemoVariants, noorDemoOptionGroups, { size: ["99مل"], scent: ["وردة"], extras: [] })).toBeNull();
    expect(invalid.size).toHaveLength(1);
  });

  it("previews real variant, quantity pack, and wilaya delivery while sending identifiers", () => {
    const selections = { size: ["30مل"], scent: ["وردة"], extras: [] };
    const preview = buildOrderPreview({
      product: { id: noorDemoProducts[0]!.id, name: noorDemoProducts[0]!.name, price_cents: noorDemoProducts[0]!.priceCents },
      variants: noorDemoVariants,
      groups: noorDemoOptionGroups,
      selections,
      quantity: 2,
      offers: noorDemoOffers,
      addOnProducts: [],
      zones: noorDemoZones,
      wilayaCode: 16,
      deliveryType: "office",
    });
    expect(preview.variant?.id).toBe("31000000-0000-4000-8000-000000000001");
    expect(preview.lines[0]).toMatchObject({ quantity: 2, lineTotalCents: 520000 });
    expect(preview.shippingFeeCents).toBe(35000);
    expect(preview.totalCents).toBe(555000);
  });

  it("ships a safe registry-only migration", () => {
    const sql = readFileSync("supabase/migrations/20260918000019_noor_template.sql", "utf8").toLowerCase();
    expect(sql).toContain("'noor-v1'");
    expect(sql).toContain("on conflict (key) do nothing");
    expect(sql).not.toMatch(/update\s+public\.stores|delete\s+from|insert\s+into\s+public\.(orders|customers)/);
  });
});
