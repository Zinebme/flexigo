import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { StockAdjustForm } from "@/components/dashboard/stock-adjust-form";
import { formatDateTimeFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventairePage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();

  const [{ data: products }, { data: movements }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, stock, low_stock_threshold, is_active")
      .eq("store_id", ctx.store.id)
      .is("deleted_at", null)
      .order("stock", { ascending: true })
      .limit(100),
    admin
      .from("inventory_movements")
      .select("id, product_id, change, reason, created_at")
      .eq("store_id", ctx.store.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const canManage = can(ctx.role, "products.manage");
  const rows = (products ?? []) as Array<{ id: string; name: string; stock: number; low_stock_threshold: number; is_active: boolean }>;
  const lowStock = rows.filter((p) => p.stock <= p.low_stock_threshold && p.stock > 0);
  const outOfStock = rows.filter((p) => p.stock === 0);

  return (
    <>
      <PageHeader title="Inventaire" subtitle={`${rows.length} produits · ${outOfStock.length} en rupture · ${lowStock.length} stock faible`} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rupture</div>
          <div className="mt-2 text-2xl font-extrabold text-red-600">{outOfStock.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stock faible</div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">{lowStock.length}</div>
          <div className="mt-1 text-xs text-slate-400">Seuil: low_stock_threshold par produit</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total produits</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{rows.length}</div>
        </Card>
      </div>

      <Card className="mt-6">
        {rows.length === 0 ? (
          <EmptyState icon="📦" title="Aucun produit" text="Ajoutez des produits pour gérer l'inventaire." />
        ) : (
          <Table head={<><Th>Produit</Th><Th>Stock</Th><Th>Seuil</Th><Th>Statut</Th><Th>Ajustement</Th></>}>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-800">{p.name}</Td>
                <Td className="font-bold text-slate-900">{p.stock}</Td>
                <Td className="text-slate-500">{p.low_stock_threshold}</Td>
                <Td>
                  {p.stock === 0 ? <Badge tone="red">Rupture</Badge> : p.stock <= p.low_stock_threshold ? <Badge tone="amber">Faible</Badge> : <Badge tone="green">OK</Badge>}
                  {!p.is_active && <span className="ml-2"><Badge tone="gray">Inactif</Badge></span>}
                </Td>
                <Td>
                  <StockAdjustForm productId={p.id} currentStock={p.stock} canAdjust={canManage} />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Mouvements récents (50)</h2>
          <p className="text-xs text-slate-500">Raison obligatoire, journalisé, audité.</p>
        </div>
        <Table head={<><Th>Quand</Th><Th>Produit</Th><Th>Variation</Th><Th>Raison</Th></>}>
          {((movements ?? []) as Array<{ id: string; product_id: string; change: number; reason: string; created_at: string }>).map((m) => {
            const prod = rows.find((p) => p.id === m.product_id);
            return (
              <tr key={m.id} className="hover:bg-slate-50">
                <Td className="text-xs text-slate-500">{formatDateTimeFr(m.created_at)}</Td>
                <Td className="text-sm text-slate-700">{prod?.name ?? m.product_id.slice(0, 8)}</Td>
                <Td className={`text-sm font-bold ${m.change > 0 ? "text-emerald-600" : "text-red-600"}`}>{m.change > 0 ? `+${m.change}` : m.change}</Td>
                <Td className="text-sm text-slate-600">{m.reason}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
