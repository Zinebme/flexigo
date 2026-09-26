import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { formatDA, formatDateTimeFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, EmptyState } from "@/components/ui";
import type { AbandonedCheckoutRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

async function abandonedCutoff() {
  return new Date(Date.now() - 5 * 60_000).toISOString();
}

export default async function AbandonedOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await getMerchantContext();
  if (!can(ctx.role, "orders.view")) return <EmptyState icon="🔒" title="Accès restreint" text="Vous ne pouvez pas voir les commandes." />;
  const qs = await searchParams;
  const pick = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
  const admin = getAdminSupabase();
  const { data: products } = await admin.from("products").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("name");
  let query = admin.from("abandoned_checkouts").select("*").eq("store_id", ctx.store.id)
    .is("converted_order_id", null).lt("updated_at", await abandonedCutoff())
    .order("updated_at", { ascending: false }).limit(200);
  const product = pick(qs.product);
  if (product) query = query.eq("product_id", product);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const search = (pick(qs.q) ?? "").trim().toLowerCase();
  const rows = ((data ?? []) as AbandonedCheckoutRow[]).filter((row) =>
    !search || `${row.product_name ?? ""} ${row.full_name ?? ""} ${row.phone ?? ""}`.toLowerCase().includes(search));

  return <>
    <PageHeader title="Commandes abandonnées" subtitle="Tentatives de commande non confirmées depuis au moins 5 minutes. La cause exacte n’est pas connue." />
    <form className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-white p-3">
      <input name="q" defaultValue={pick(qs.q)} placeholder="Nom, téléphone, produit" className="rounded-lg border px-3 py-2 text-sm" />
      <select name="product" defaultValue={product ?? ""} className="rounded-lg border px-3 py-2 text-sm"><option value="">Tous les produits</option>{(products ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Filtrer</button>
    </form>
    <Card>{rows.length ? <Table head={<><Th>Client</Th><Th>Produit</Th><Th>Choix</Th><Th>Estimation</Th><Th>Dernière étape</Th><Th>Action</Th></>}>
      {rows.map((row) => <tr key={row.id}>
        <Td><div className="font-medium">{row.full_name || "—"}</div><div className="text-xs text-slate-500">{row.phone || "—"}</div></Td>
        <Td>{row.product_name || "—"} × {row.quantity}</Td>
        <Td className="text-xs">{Object.entries(row.selected_options ?? {}).map(([key, values]) => `${key}: ${values.join(", ")}`).join(" · ") || "—"}</Td>
        <Td>{row.estimated_total_cents == null ? "—" : formatDA(row.estimated_total_cents)}</Td>
        <Td><div>Formulaire envoyé, commande non confirmée</div><div className="text-xs text-slate-500">{formatDateTimeFr(row.updated_at)} · cause probable : interruption ou erreur</div></Td>
        <Td>{row.phone ? <a className="text-blue-600 hover:underline" href={`tel:${row.phone.replace(/[^+0-9]/g, "")}`}>Appeler</a> : "—"}</Td>
      </tr>)}
    </Table> : <EmptyState icon="◫" title="Aucune tentative abandonnée" text="Les tentatives non confirmées apparaîtront ici." />}</Card>
  </>;
}
