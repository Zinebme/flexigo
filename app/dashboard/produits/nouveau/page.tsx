import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const { data: categories } = await admin
    .from("categories")
    .select("id, name")
    .eq("store_id", ctx.store.id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  const canManage = can(ctx.role, "products.manage");

  return (
    <>
      <PageHeader title="Nouveau produit" subtitle="Le prix saisi en dinars est converti et revalidé côté serveur.">
        <Link href="/dashboard/produits" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          ← Retour
        </Link>
      </PageHeader>

      <Card>
        <CardHeader title="Informations produit" />
        {canManage ? (
          <ProductForm
            mode="create"
            categories={(categories ?? []) as Array<{ id: string; name: string }>}
            initial={{
              name: "",
              slug: "",
              description: "",
              price: 0,
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
          <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de gérer les produits." />
        )}
      </Card>
    </>
  );
}
