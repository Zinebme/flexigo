import { afterEach, describe, expect, it } from "vitest";
import { cleanHostname, platformHostname, subdomainStoreSlug } from "../../lib/storefront/hosts";

const previous = process.env.NEXT_PUBLIC_APP_URL;
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previous; });

describe("storefront hostnames", () => {
  it("recognizes exactly one slug label under the configured platform host", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://marqova.shop";
    expect(subdomainStoreSlug("AlMaSa.marqova.shop:443")).toBe("almasa");
    expect(subdomainStoreSlug("boutique-test.marqova.shop")).toBe("boutique-test");
    expect(subdomainStoreSlug("marqova.shop")).toBeNull();
    expect(subdomainStoreSlug("a.b.marqova.shop")).toBeNull();
    expect(subdomainStoreSlug("www.marqova.shop")).toBeNull();
  });

  it("does not resolve lookalike hostnames or a different platform", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://marqova.shop";
    expect(subdomainStoreSlug("almasa.marqova.shop.attacker.test")).toBeNull();
    expect(subdomainStoreSlug("almasa-dz.com")).toBeNull();
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
    expect(platformHostname()).toBe("example.test");
    expect(subdomainStoreSlug("almasa.example.test")).toBe("almasa");
  });

  it("normalizes the host without changing its labels", () => {
    expect(cleanHostname(" SHOP.Example.COM:443 ")).toBe("shop.example.com");
    expect(cleanHostname(" SHOP.Example.COM. ")).toBe("shop.example.com");
  });
});
