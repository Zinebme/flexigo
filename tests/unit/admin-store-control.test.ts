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

describe("admin store content controls", () => {
  it("accepts product creation and soft deletion actions", () => {
    expect(adminStoreControlActionSchema.safeParse({
      action: "product_create",
      name: "Produit test",
      price: 2500,
      stock: 12,
      category_id: null,
      is_active: true,
    }).success).toBe(true);

    expect(adminStoreControlActionSchema.safeParse({
      action: "product_delete",
      product_id: "ef456307-359e-4c30-b2b8-50a8a7c7187f",
    }).success).toBe(true);
  });

  it("accepts category creation and deletion actions", () => {
    expect(adminStoreControlActionSchema.safeParse({
      action: "category_create",
      name: "Nouveautés",
      slug: "nouveautes",
      is_visible: true,
      position: 0,
    }).success).toBe(true);

    expect(adminStoreControlActionSchema.safeParse({
      action: "category_delete",
      category_id: "ef456307-359e-4c30-b2b8-50a8a7c7187f",
    }).success).toBe(true);
  });
});

describe("admin store member controls", () => {
  const memberId = "ef456307-359e-4c30-b2b8-50a8a7c7187f";

  it("accepts editing a merchant profile and role", () => {
    expect(adminStoreControlActionSchema.safeParse({
      action: "member_update",
      member_id: memberId,
      full_name: "Almasa",
      dashboard_language: "fr",
      role: "MANAGER",
    }).success).toBe(true);
  });

  it("only accepts active or revoked membership statuses", () => {
    expect(adminStoreControlActionSchema.safeParse({ action: "member_status", member_id: memberId, status: "revoked" }).success).toBe(true);
    expect(adminStoreControlActionSchema.safeParse({ action: "member_status", member_id: memberId, status: "deleted" }).success).toBe(false);
  });
});
