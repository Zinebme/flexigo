import { afterEach, describe, expect, it } from "vitest";
import { getInviteRedirectUrl, getPlatformAppUrl } from "@/lib/app-url";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

describe("platform auth URLs", () => {
  it("uses the configured platform origin and strips paths", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://flexigo.eurekayw1234.chatgpt.site/some/path/";
    expect(getPlatformAppUrl()).toBe("https://flexigo.eurekayw1234.chatgpt.site");
    expect(getInviteRedirectUrl()).toBe("https://flexigo.eurekayw1234.chatgpt.site/auth/finish");
  });

  it("rejects insecure non-local URLs", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://example.com";
    expect(() => getPlatformAppUrl()).toThrow("HTTPS");
  });
});
