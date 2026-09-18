import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { CategoriesManager } from "@/components/dashboard/categories-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const { data: categories } = await admin
    .from("categories")
    .select("*")
    .eq("store_id", ctx.store.id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  const canManage = can(ctx.role, "categories.manage");

  return (
    <>
      <PageHeader title="Catégories" subtitle="Organisez votre catalogue (affiché sur la boutique et les pages catégorie)." />
      <Card>
        <CardHeader title="Toutes les catégories" />
        {canManage ? (
          <CategoriesManager
            categories={(categories ?? []) as Array<{
              id: string;
              name: string;
              slug: string;
              description: string | null;
              image_url: string;
              is_visible: boolean;
              position: number;
            }>}
          />
        ) : (
          <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de gérer les catégories." />
        )}
      </Card>
    </>
  );
}
