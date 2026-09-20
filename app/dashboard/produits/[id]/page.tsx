import { notFound } from "next/navigation";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";
import { ProductForm } from "@/components/dashboard/product-form";
import { StockAdjustForm } from "@/components/dashboard/stock-adjust-form";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();

  const [{ data: product }, { data: categories }, { data: variants }, { data: offers }, { data: images }, { data: productChoices }] = await Promise.all([
    admin.from("products").select("*").eq("id", id).eq("store_id", ctx.store.id).maybeSingle(),
    admin.from("categories").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("position", { ascending: true }),
    admin.from("product_variants").select("*").eq("product_id", id).order("position", { ascending: true }),
    admin.from("quantity_offers").select("*").eq("product_id", id).order("position", { ascending: true }),
    admin.from("product_images").select("*").eq("product_id", id).order("position", { ascending: true }),
    admin.from("products").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).neq("id", id).order("name"),
  ]);

  if (!product) notFound();

  const canManage = can(ctx.role, "products.manage");
  const p = product as Record<string, unknown> & {
    id: string; name: string; slug: string; description: string | null; price_cents: number;
    compare_at_price_cents: number | null; sku: string | null; low_stock_threshold: number;
    is_active: boolean; is_featured: boolean; category_id: string | null; stock: number;
    seo_title: string | null; seo_description: string | null;
    short_description?: string | null; cost_cents?: number | null; is_digital?: boolean;
    gallery_mode?: "slideshow" | "stacked"; landing_images?: string[]; min_order_quantity?: number;
    shipping_label?: string | null; stock_tracking_mode?: "none" | "global" | "variants";
    related_product_ids?: string[]; cross_sell_product_ids?: string[]; page_element_order?: string[];
    option_groups?: unknown;
  };

  const initial = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    short_description: p.short_description ?? "",
    price: p.price_cents / 100,
    cost: p.cost_cents != null ? p.cost_cents / 100 : null,
    is_digital: p.is_digital ?? false,
    gallery_mode: p.gallery_mode ?? "slideshow",
    landing_images: p.landing_images ?? [],
    min_order_quantity: p.min_order_quantity ?? 1,
    shipping_label: p.shipping_label ?? "",
    stock_tracking_mode: p.stock_tracking_mode ?? "global",
    related_product_ids: p.related_product_ids ?? [],
    cross_sell_product_ids: p.cross_sell_product_ids ?? [],
    page_element_order: p.page_element_order ?? ["gallery","title","price","variants","offers","description","order_form","landing","reviews","related"],
    option_groups: Array.isArray(p.option_groups) ? p.option_groups : [],
    compare_at_price: p.compare_at_price_cents != null ? (p.compare_at_price_cents as number) / 100 : null,
    sku: p.sku ?? "",
    stock: p.stock,
    low_stock_threshold: p.low_stock_threshold,
    is_active: p.is_active,
    is_featured: p.is_featured,
    category_id: p.category_id,
    images: ((images ?? []) as Array<{ url: string }>).map((im) => im.url),
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    variants: ((variants ?? []) as Array<{ id: string; name: string; options: Record<string, string> | null; price_cents: number | null; stock: number; is_active: boolean }>).map((v) => ({
      id: v.id,
      name: v.name,
      options_text: v.options ? Object.entries(v.options).map(([k, val]) => `${k}: ${val}`).join(", ") : "",
      price: v.price_cents != null ? v.price_cents / 100 : null,
      sku: (v as { sku?: string | null }).sku ?? "",
      stock: v.stock,
      is_active: v.is_active,
    })),
    offers: ((offers ?? []) as Array<{ min_quantity: number; total_price_cents: number; label: string | null }>).map((o) => ({
      min_quantity: o.min_quantity,
      total_price: o.total_price_cents / 100,
      label: o.label ?? "",
    })),
  };

  const low = p.stock <= p.low_stock_threshold && p.stock > 0;

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={`/${p.slug} · Stock : ${p.stock}${low ? " (faible)" : p.stock === 0 ? " (rupture)" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/s/${ctx.store.slug}/produit/${p.slug}`}
            target="_blank"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Voir sur le site
          </Link>
          <Link href="/dashboard/produits" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            ← Retour
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {canManage ? (
            <ProductForm mode="edit" initial={initial} categories={(categories ?? []) as Array<{ id: string; name: string }>} productChoices={(productChoices ?? []) as Array<{ id: string; name: string }>} />
          ) : (
            <Card><EmptyState icon="🔒" title="Accès en lecture seule" text="Votre rôle permet de consulter mais pas de modifier les produits." /></Card>
          )}

          <Card>
            <CardHeader title="Ajustement de stock" subtitle="Chaque mouvement est justifié et journalisé (audit).">
              <div className="flex gap-2">
                <Badge tone={p.stock === 0 ? "red" : low ? "amber" : "green"}>
                  {p.stock === 0 ? "Rupture" : low ? "Stock faible" : "En stock"}
                </Badge>
                {p.is_featured && <Badge tone="purple">★ Vedette</Badge>}
              </div>
            </CardHeader>
            <StockAdjustForm productId={p.id} currentStock={p.stock} canAdjust={canManage} />
          </Card>
        </div>

        <div className="space-y-4">
          {canManage && (
            <Card>
              <CardHeader title="Zone dangereuse" />
              <p className="mb-3 text-sm text-slate-500">
                La suppression est <span className="font-semibold text-slate-700">douce</span> : le produit devient invisible
                mais les commandes passées conservent leurs articles (snapshot).
              </p>
              <DeleteProductButton productId={p.id} productName={p.name} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
