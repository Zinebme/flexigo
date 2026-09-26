import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const [{ data: categories }, { data: products }] = await Promise.all([
    admin.from("categories").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("position", { ascending: true }),
    admin.from("products").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("name"),
  ]);

  const canManage = can(ctx.role, "products.manage");

  return (
    <>
      <PageHeader title="Ajouter un produit" subtitle="Créez une fiche complète : photos, prix, stock, variantes, offres et visibilité.">
        <Link href="/dashboard/produits" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          ← Retour
        </Link>
      </PageHeader>

      {canManage ? (
          <ProductForm
            mode="create"
            categories={(categories ?? []) as Array<{ id: string; name: string }>}
            productChoices={(products ?? []) as Array<{ id: string; name: string }>}
            initial={{
              name: "",
              slug: "",
              description: "",
              short_description: "",
              price: 0,
              cost: null,
              is_digital: false,
              free_shipping: false,
              gallery_mode: "slideshow",
              landing_images: [],
              min_order_quantity: 1,
              shipping_label: "",
              stock_tracking_mode: "global",
              related_product_ids: [],
              cross_sell_product_ids: [],
              page_element_order: ["gallery","title","price","variants","offers","description","order_form","landing","reviews","related"],
              option_groups: [],
              compare_at_price: null,
              sku: "",
              stock: 0,
              low_stock_threshold: 5,
              is_active: true,
              is_featured: false,
              category_id: null,
              images: [],
              seo_title: "",
              seo_description: "",
              variants: [],
              offers: [],
            }}
          />
        ) : (
          <Card><EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de gérer les produits." /></Card>
        )}
    </>
  );
}
