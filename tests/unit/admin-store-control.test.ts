import { describe, expect, it } from "vitest";
import { adminStoreControlActionSchema } from "@/app/api/admin/stores/[id]/control/route";

describe("admin store owner invitation", () => {
  it("accepts an invitation without a full name", () => {
    const result = adminStoreControlActionSchema.safeParse({
      action: "owner",
      email: "merchant@example.com",
      full_name: "",
      dashboard_language: "fr",
    });

    expect(result.success).toBe(true);
  });

  it("still rejects an invalid email", () => {
    const result = adminStoreControlActionSchema.safeParse({
      action: "owner",
      email: "not-an-email",
      full_name: "",
      dashboard_language: "fr",
    });

    expect(result.success).toBe(false);
  });
});
