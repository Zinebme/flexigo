// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProductForm, type ProductFormInitial } from "../../components/dashboard/product-form";
import { productSchema } from "../../lib/schemas";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const uncategorizedProduct: ProductFormInitial = {
  id: "91783bcf-858d-4901-88f5-3edc0358f902",
  name: "hijab almasa",
  slug: "hijab-almasa",
  description: "",
  price: 3000,
  compare_at_price: null,
  sku: "",
  low_stock_threshold: 5,
  is_active: true,
  is_featured: false,
  category_id: null,
  images: [],
  seo_title: "",
  seo_description: "",
  variants: [],
  offers: [],
};

describe("édition d'un produit existant sans catégorie", () => {
  it("enregistre une variante sans envoyer une catégorie vide", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<ProductForm mode="edit" initial={uncategorizedProduct} categories={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Variante" }));
    fireEvent.change(screen.getByPlaceholderText("Nom ex: Rouge / M"), { target: { value: "Noir" } });
    fireEvent.change(screen.getByPlaceholderText("Couleur: Rouge, Taille: M"), { target: { value: "Couleur: Noir" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body).not.toHaveProperty("category_id");
    expect(body.variants).toMatchObject([{ name: "Noir", options: { Couleur: "Noir" } }]);
    expect(productSchema.partial().safeParse(body).success).toBe(true);
  });

  it("accepte le nombre de variantes proposé par le formulaire", () => {
    const variants = Array.from({ length: 50 }, (_, index) => ({ name: `Couleur ${index + 1}` }));
    expect(productSchema.partial().safeParse({ variants }).success).toBe(true);
    expect(productSchema.partial().safeParse({ variants: [...variants, { name: "Couleur 51" }] }).success).toBe(false);
  });
});
