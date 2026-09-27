import { notFound } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState, Badge, Button } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { ProductForm } from "@/components/dashboard/product-form";
import { StockAdjustForm } from "@/components/dashboard/stock-adjust-form";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";

export const dynamic = "force-dynamic";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-xs font-semibold text-slate-800">{children}</span>
    </div>
  );
}

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

  const variantRows = (variants ?? []) as Array<{ id: string; name: string; options: Record<string, string> | null; price_cents: number | null; stock: number; is_active: boolean }>;
  const offerRows = (offers ?? []) as Array<{ min_quantity: number; total_price_cents: number; label: string | null }>;
  const imageRows = (images ?? []) as Array<{ url: string }>;
  const categoryRows = (categories ?? []) as Array<{ id: string; name: string }>;

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
    images: imageRows.map((im) => im.url),
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    variants: variantRows.map((v) => ({
      id: v.id,
      name: v.name,
      options_text: v.options ? Object.entries(v.options).map(([k, val]) => `${k}: ${val}`).join(", ") : "",
      price: v.price_cents != null ? v.price_cents / 100 : null,
      sku: (v as { sku?: string | null }).sku ?? "",
      stock: v.stock,
      is_active: v.is_active,
    })),
    offers: offerRows.map((o) => ({
      min_quantity: o.min_quantity,
      total_price: o.total_price_cents / 100,
      label: o.label ?? "",
    })),
  };

  const low = p.stock <= p.low_stock_threshold && p.stock > 0;
  const categoryName = categoryRows.find((c) => c.id === p.category_id)?.name ?? null;
  const priceLabel = new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(p.price_cents / 100);
  const thumb = imageRows[0]?.url ?? null;

  return (
    <>
      <PageHeader
        backHref="/dashboard/produits"
        backLabel="Produits"
        eyebrow="Modifier le produit"
        title={p.name}
        subtitle={`/${p.slug}`}
      >
        <Badge tone={p.is_active ? "green" : "gray"} dot size="sm">{p.is_active ? "En ligne" : "Masqué"}</Badge>
        <Badge tone={p.stock === 0 ? "red" : low ? "amber" : "green"} size="sm" icon="package">
          {p.stock === 0 ? "Rupture" : low ? `Stock faible · ${p.stock}` : `En stock · ${p.stock}`}
        </Badge>
        {p.is_featured ? <Badge tone="purple" size="sm" icon="star">Vedette</Badge> : null}
        <Button href={`/s/${ctx.store.slug}/produit/${p.slug}`} external tone="secondary" size="sm" icon="external">
          Voir sur le site
        </Button>
      </PageHeader>

      {/* Product snapshot: thumbnail + key facts, always visible. */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="image" size={20} className="text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-900">
            <span className="fx-num">{priceLabel} DA</span>
            {p.compare_at_price_cents != null ? (
              <span className="fx-num text-xs font-medium text-slate-400 line-through">
                {(p.compare_at_price_cents as number) / 100} DA
              </span>
            ) : null}
            <span className="text-xs font-medium text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">{imageRows.length} photo(s)</span>
            <span className="text-xs font-medium text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">{variantRows.length} variante(s)</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {categoryName ? `Catégorie : ${categoryName} · ` : ""}
            SKU : <span className="fx-num font-semibold text-slate-700">{p.sku || "—"}</span>
            {p.is_digital ? " · Produit digital" : ""}
          </p>
        </div>
      </div>

      {canManage ? (
        <ProductForm mode="edit" initial={initial} categories={categoryRows} productChoices={(productChoices ?? []) as Array<{ id: string; name: string }>} />
      ) : (
        <Card>
          <EmptyState
            icon={<Icon name="lock" size={24} />}
            title="Accès en lecture seule"
            text="Votre rôle permet de consulter mais pas de modifier les produits."
          />
        </Card>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon="clipboard"
            title="Ajustement de stock"
            subtitle="Chaque mouvement est justifié et journalisé (audit)."
          >
            <Badge tone={p.stock === 0 ? "red" : low ? "amber" : "green"} size="sm" dot>
              {p.stock === 0 ? "Rupture" : low ? `Stock faible (${p.stock})` : `En stock (${p.stock})`}
            </Badge>
            <span className="text-xs text-slate-500">
              Alerte si ≤ <strong className="fx-num text-slate-700">{p.low_stock_threshold}</strong>
            </span>
          </CardHeader>
          <div className="px-5 py-4">
            {canManage ? (
              <StockAdjustForm productId={p.id} currentStock={p.stock} canAdjust />
            ) : (
              <p className="text-sm text-slate-500">
                Votre rôle ne permet pas les mouvements de stock.
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader icon="package" title="Résumé de la fiche" />
            <div className="divide-y divide-slate-100 px-5 py-1">
              <InfoRow label="Référence (SKU)"><span className="fx-num">{p.sku || "—"}</span></InfoRow>
              <InfoRow label="Catégorie">{categoryName ?? "Aucune"}</InfoRow>
              <InfoRow label="Suivi du stock">
                {p.stock_tracking_mode === "variants" ? "Par variante" : p.stock_tracking_mode === "none" ? "Non suivi" : "Quantité globale"}
              </InfoRow>
              <InfoRow label="Variantes">{variantRows.length}</InfoRow>
              <InfoRow label="Offres quantité">{offerRows.length}</InfoRow>
              <InfoRow label="Images landing">{(p.landing_images ?? []).length}</InfoRow>
              <InfoRow label="Quantité min.">
                <span className="fx-num">{p.min_order_quantity ?? 1}</span>
              </InfoRow>
            </div>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader icon="alert" title="Zone dangereuse" />
              <div className="px-5 py-4">
                <p className="mb-3 text-xs leading-5 text-slate-500">
                  La suppression est <span className="font-semibold text-slate-700">douce</span> : le produit devient
                  invisible sur la boutique, mais les commandes passées conservent leurs articles (snapshot).
                </p>
                <DeleteProductButton productId={p.id} productName={p.name} />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
