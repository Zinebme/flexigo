import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { ReviewsManager } from "@/components/dashboard/reviews-manager";
import { formatDateTimeFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AvisPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();

  const [{ data: reviews }, { data: products }] = await Promise.all([
    admin.from("reviews").select("*").eq("store_id", ctx.store.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    admin.from("products").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).limit(100),
  ]);

  const canManage = can(ctx.role, "content.manage");
  const productMap = new Map(((products ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));

  return (
    <>
      <PageHeader title="Avis clients" subtitle="Modérez les avis — approuvés seulement affichés en boutique. Contenu structuré, pas de HTML libre." />

      <Card className="p-5">
        <h3 className="font-bold text-slate-900">Gestion des avis</h3>
        <p className="mt-1 text-xs text-slate-500">Les avis non approuvés ne sont pas visibles sur le site. Tous les champs sont sanitizés côté serveur.</p>
        <div className="mt-4">
          <ReviewsManager
            reviews={(reviews ?? []) as Array<{ id: string; product_id: string | null; customer_name: string; rating: number; title: string | null; body: string | null; is_approved: boolean; created_at: string }>}
            productMap={productMap}
            canManage={canManage}
          />
        </div>
      </Card>

      <Card className="mt-6">
        {(reviews ?? []).length === 0 ? (
          <EmptyState icon="⭐" title="Aucun avis" text="Les avis clients apparaîtront ici après commandes." />
        ) : (
          <Table head={<><Th>Client</Th><Th>Produit</Th><Th>Note</Th><Th>Titre</Th><Th>Statut</Th><Th>Date</Th></>}>
            {(reviews as Array<Record<string, unknown>>).map((r) => (
              <tr key={r.id as string} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-800">{r.customer_name as string}</Td>
                <Td className="text-sm text-slate-600">{r.product_id ? (productMap.get(r.product_id as string) ?? "—") : "Général"}</Td>
                <Td>{"⭐".repeat(r.rating as number)} ({r.rating as number}/5)</Td>
                <Td className="max-w-xs truncate text-sm text-slate-600" title={r.title as string}>{(r.title as string) ?? "—"}</Td>
                <Td>{(r.is_approved as boolean) ? <Badge tone="green">Approuvé</Badge> : <Badge tone="amber">En attente</Badge>}</Td>
                <Td className="text-xs text-slate-500">{formatDateTimeFr(r.created_at as string)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
