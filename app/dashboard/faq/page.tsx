import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { FaqManager } from "@/components/dashboard/faq-manager";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();

  const { data: faqs } = await admin
    .from("faq_items")
    .select("*")
    .eq("store_id", ctx.store.id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  const canManage = can(ctx.role, "content.manage");

  return (
    <>
      <PageHeader title="FAQ" subtitle="Questions fréquentes — affichées sur la page FAQ et en sections FAQ du site. Contenu sanitizé, pas de HTML libre." />

      <Card className="p-5">
        {canManage ? (
          <FaqManager faqs={(faqs ?? []) as Array<{ id: string; question: string; answer: string; position: number; is_visible: boolean }>} />
        ) : (
          <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de gérer la FAQ." />
        )}
      </Card>
    </>
  );
}
