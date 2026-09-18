import { Suspense } from "react";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { formatDA } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState, btnPrimary } from "@/components/ui";
import { ProductFilters } from "@/components/dashboard/product-filters";
import type { ProductRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await getMerchantContext();
  const qs = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const admin = getAdminSupabase();
  const [{ data: products }, { data: categories }, { data: imgs }] = await Promise.all([
    admin.from("products").select("*").eq("store_id", ctx.store.id).is("deleted_at", null).order("created_at", { ascending: false }),
    admin.from("categories").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("position", { ascending: true }),
    admin.from("product_images").select("product_id, url").eq("store_id", ctx.store.id).order("position", { ascending: true }),
  ]);

  let list = (products ?? []) as ProductRow[];
  const catMap = new Map(((categories ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]));
  const imgMap = new Map<string, string>();
  for (const im of (imgs ?? []) as Array<{ product_id: string; url: string }>) {
    if (!imgMap.has(im.product_id)) imgMap.set(im.product_id, im.url);
  }

  const q = first(qs.q)?.trim().toLowerCase();
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.slug ?? "").toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
  const cat = first(qs.cat);
  if (cat) list = list.filter((p) => p.category_id === cat);
  const stock = first(qs.stock);
  if (stock === "low") list = list.filter((p) => p.stock <= (p.low_stock_threshold ?? 5) && p.stock > 0);
  if (stock === "out") list = list.filter((p) => p.stock === 0);
  if (stock === "in") list = list.filter((p) => p.stock > (p.low_stock_threshold ?? 5));

  const lowCount = (products ?? []).filter((p) => (p as ProductRow).stock <= (p as ProductRow).low_stock_threshold && (p as ProductRow).stock > 0).length;
  const outCount = (products ?? []).filter((p) => (p as ProductRow).stock === 0).length;

  return (
    <>
      <PageHeader title="Produits" subtitle={`${list.length} produits · ${lowCount} stock faible · ${outCount} en rupture`}>
        <Link href="/dashboard/produits/nouveau" className={btnPrimary}>
          + Nouveau produit
        </Link>
      </PageHeader>

      <Suspense>
        <ProductFilters categories={(categories ?? []) as Array<{ id: string; name: string }>} />
      </Suspense>

      <Card className="mt-4">
        {list.length === 0 ? (
          <EmptyState icon="🛍️" title="Aucun produit" text="Créez votre premier produit pour l'afficher sur votre site." />
        ) : (
          <Table
            head={
              <>
                <Th>Produit</Th>
                <Th>Catégorie</Th>
                <Th>Prix</Th>
                <Th>Stock</Th>
                <Th>Statut</Th>
                <Th />
              </>
            }
          >
            {list.map((p) => {
              const low = p.stock <= p.low_stock_threshold && p.stock > 0;
              return (
                <tr key={p.id} className="transition hover:bg-slate-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-lg">
                        {imgMap.get(p.id) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgMap.get(p.id)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          "📦"
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.slug}{p.sku ? ` · ${p.sku}` : ""}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-600">{p.category_id ? (catMap.get(p.category_id) ?? "—") : "—"}</Td>
                  <Td>
                    <div className="font-semibold text-slate-900">{formatDA(p.price_cents)}</div>
                    {p.compare_at_price_cents != null && (
                      <div className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</div>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={p.stock === 0 ? "red" : low ? "amber" : "green"}>
                      {p.stock === 0 ? "Rupture" : low ? `Faible (${p.stock})` : p.stock}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={p.is_active ? "green" : "gray"}>{p.is_active ? "Actif" : "Désactivé"}</Badge>
                      {p.is_featured && <Badge tone="purple">★ Vedette</Badge>}
                    </div>
                  </Td>
                  <Td>
                    <Link href={`/dashboard/produits/${p.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                      Modifier
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
