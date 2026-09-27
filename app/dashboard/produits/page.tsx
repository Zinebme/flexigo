import { Suspense } from "react";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { formatDA } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState, Button, IconButton, rowCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { ProductFilters } from "@/components/dashboard/product-filters";
import { ProductVisibilityToggle } from "@/components/dashboard/product-visibility-toggle";
import type { ProductRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) {
    return (
      <Badge tone="red" dot size="sm">
        Rupture
      </Badge>
    );
  }
  if (stock <= threshold) {
    return (
      <Badge tone="amber" dot size="sm" title={`Seuil d'alerte : ${threshold}`}>
        <span className="fx-num">Faible · {stock}</span>
      </Badge>
    );
  }
  return (
    <Badge tone="green" dot size="sm">
      <span className="fx-num">{stock} en stock</span>
    </Badge>
  );
}

function Thumb({ url, name }: { url?: string; name: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 ring-inset">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon name="image" size={18} className="text-slate-400" />
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

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

  const all = (products ?? []) as ProductRow[];
  const lowCount = all.filter((p) => p.stock <= p.low_stock_threshold && p.stock > 0).length;
  const outCount = all.filter((p) => p.stock === 0).length;
  const activeCount = all.filter((p) => p.is_active).length;
  const canManage = can(ctx.role, "products.manage");
  const hasFilters = Boolean(q || cat || stock);

  return (
    <>
      <PageHeader
        icon="package"
        title="Produits"
        subtitle={`${all.length} produit${all.length > 1 ? "s" : ""} · ${activeCount} visible${activeCount > 1 ? "s" : ""} sur la boutique`}
      >
        <Button href="/dashboard/inventaire" icon="clipboard" tone="secondary" size="sm">
          Inventaire
        </Button>
        {canManage ? (
          <Button href="/dashboard/produits/nouveau" icon="plus" tone="primary" size="sm">
            Nouveau produit
          </Button>
        ) : null}
      </PageHeader>

      {(lowCount > 0 || outCount > 0) && !hasFilters ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {outCount > 0 ? (
            <Link
              href="/dashboard/produits?stock=out"
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Icon name="alert" size={14} />
              {outCount} en rupture de stock
            </Link>
          ) : null}
          {lowCount > 0 ? (
            <Link
              href="/dashboard/produits?stock=low"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              <Icon name="alert" size={14} />
              {lowCount} sous le seuil d&apos;alerte
            </Link>
          ) : null}
        </div>
      ) : null}

      <Suspense>
        <ProductFilters categories={(categories ?? []) as Array<{ id: string; name: string }>} />
      </Suspense>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-600">
            <span className="fx-num font-bold text-slate-900">{list.length}</span> produit{list.length > 1 ? "s" : ""} affiché{list.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-slate-400">Prix en DA · stock ajustable depuis la fiche ou l&apos;inventaire</p>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<Icon name="package" size={22} />}
            title={hasFilters ? "Aucun produit ne correspond à ces filtres" : "Aucun produit pour le moment"}
            text={
              hasFilters
                ? "Modifiez la recherche ou réinitialisez les filtres pour voir tout votre catalogue."
                : "Créez votre premier produit : il apparaîtra immédiatement sur votre boutique."
            }
            action={
              hasFilters ? (
                <Button href="/dashboard/produits" icon="refresh">
                  Réinitialiser les filtres
                </Button>
              ) : canManage ? (
                <Button href="/dashboard/produits/nouveau" icon="plus" tone="primary">
                  Créer un produit
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Desktop / tablet */}
            <div className="hidden md:block">
              <Table
                sticky
                head={
                  <>
                    <Th>Produit</Th>
                    <Th className="hidden lg:table-cell">Catégorie</Th>
                    <Th align="right">Prix</Th>
                    <Th>Stock</Th>
                    <Th>Visibilité</Th>
                    <Th align="right" />
                  </>
                }
              >
                {list.map((p) => (
                  <tr key={p.id} className={rowCls}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Thumb url={imgMap.get(p.id)} name={p.name} />
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/produits/${p.id}`}
                            className="block truncate font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                          >
                            {p.name}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="truncate">{p.slug}</span>
                            {p.sku ? <span className="fx-num shrink-0">· {p.sku}</span> : null}
                            {p.is_featured ? (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-purple-200 ring-inset">
                                <Icon name="star" size={10} strokeWidth={2.2} />
                                Vedette
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      {p.category_id ? (
                        <span className="inline-flex max-w-40 items-center truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {catMap.get(p.category_id) ?? "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </Td>
                    <Td align="right">
                      <div className="fx-num font-semibold text-slate-900">{formatDA(p.price_cents)}</div>
                      {p.compare_at_price_cents != null ? (
                        <div className="fx-num text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</div>
                      ) : null}
                    </Td>
                    <Td>
                      <StockBadge stock={p.stock} threshold={p.low_stock_threshold} />
                    </Td>
                    <Td>
                      <ProductVisibilityToggle productId={p.id} name={p.name} isActive={p.is_active} canManage={canManage} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon="external"
                          label={`Voir ${p.name} sur la boutique`}
                          href={`/s/${ctx.store.slug}/produit/${p.slug}`}
                          external
                          tone="ghost"
                          size={32}
                        />
                        <IconButton
                          icon="pencil"
                          label={`Modifier ${p.name}`}
                          href={`/dashboard/produits/${p.id}`}
                          tone="ghost"
                          size={32}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {list.map((p) => (
                <li key={p.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <Thumb url={imgMap.get(p.id)} name={p.name} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/produits/${p.id}`} className="block truncate font-semibold text-slate-900">
                        {p.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                        <span className="fx-num font-semibold text-slate-900">{formatDA(p.price_cents)}</span>
                        {p.compare_at_price_cents != null ? (
                          <span className="fx-num line-through">{formatDA(p.compare_at_price_cents)}</span>
                        ) : null}
                        {p.category_id ? <span className="truncate">· {catMap.get(p.category_id)}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StockBadge stock={p.stock} threshold={p.low_stock_threshold} />
                    <ProductVisibilityToggle productId={p.id} name={p.name} isActive={p.is_active} canManage={canManage} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button href={`/dashboard/produits/${p.id}`} size="sm" icon="pencil" className="flex-1">
                      Modifier
                    </Button>
                    <IconButton
                      icon="external"
                      label={`Voir ${p.name} sur la boutique`}
                      href={`/s/${ctx.store.slug}/produit/${p.slug}`}
                      external
                      size={32}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
