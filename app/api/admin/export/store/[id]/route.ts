import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { toCsv, csvResponse } from "@/lib/csv";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Platform data export for one store (SUPER_ADMIN only): orders, products
 * and customers in a single CSV (sections separated by blank lines).
 * Audited as export.data.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("id, name, slug").eq("id", id).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const [{ data: orders }, { data: products }, { data: customers }] = await Promise.all([
      admin.from("orders").select("*").eq("store_id", id).order("created_at", { ascending: false }),
      admin.from("products").select("*").eq("store_id", id).is("deleted_at", null),
      admin.from("customers").select("*").eq("store_id", id).is("deleted_at", null),
    ]);

    const orderRows = (orders ?? []).map((o) => ({
      numero: o.order_number,
      nom: o.full_name,
      telephone: o.phone,
      wilaya: o.wilaya,
      commune: o.commune,
      livraison: o.delivery_type === "office" ? `bureau:${o.office ?? ""}` : "domicile",
      sous_total_dz: o.subtotal_cents / 100,
      frais_dz: o.shipping_fee_cents / 100,
      total_dz: o.total_cents / 100,
      statut: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status,
      creee_le: o.created_at,
    }));
    const productRows = (products ?? []).map((p) => ({
      nom: p.name,
      slug: p.slug,
      prix_dz: p.price_cents / 100,
      stock: p.stock,
      actif: p.is_active ? "oui" : "non",
      vedette: p.is_featured ? "oui" : "non",
    }));
    const customerRows = (customers ?? []).map((c) => ({
      nom: c.name,
      telephone: c.phone,
      telephone_normalise: c.normalized_phone,
      email: c.email ?? "",
      commandes: c.order_count,
      total_dz: c.total_spent_cents / 100,
      derniere_commande: c.last_order_at ?? "",
    }));

    const parts = [
      `# EXPORT FLEXIGO — ${store.name} (${store.slug}) — ${new Date().toISOString()}`,
      "",
      "# COMMANDES",
      toCsv(orderRows, [
        { key: "numero", label: "N°" },
        { key: "nom", label: "Nom" },
        { key: "telephone", label: "Téléphone" },
        { key: "wilaya", label: "Wilaya" },
        { key: "commune", label: "Commune" },
        { key: "livraison", label: "Livraison" },
        { key: "sous_total_dz", label: "Sous-total (DA)" },
        { key: "frais_dz", label: "Frais (DA)" },
        { key: "total_dz", label: "Total (DA)" },
        { key: "statut", label: "Statut" },
        { key: "creee_le", label: "Créée le" },
      ]),
      "",
      "# PRODUITS",
      toCsv(productRows, [
        { key: "nom", label: "Nom" },
        { key: "slug", label: "Slug" },
        { key: "prix_dz", label: "Prix (DA)" },
        { key: "stock", label: "Stock" },
        { key: "actif", label: "Actif" },
        { key: "vedette", label: "Vedette" },
      ]),
      "",
      "# CLIENTS",
      toCsv(customerRows, [
        { key: "nom", label: "Nom" },
        { key: "telephone", label: "Téléphone" },
        { key: "telephone_normalise", label: "Téléphone normalisé" },
        { key: "email", label: "Email" },
        { key: "commandes", label: "Commandes" },
        { key: "total_dz", label: "Total (DA)" },
        { key: "derniere_commande", label: "Dernière commande" },
      ]),
    ].join("\n");

    void logAudit({
      actorId: ctx.user.id,
      storeId: id,
      action: "export.data",
      entity: "store",
      entityId: id,
      metadata: { rows: { orders: orderRows.length, products: productRows.length, customers: customerRows.length }, by: "platform_admin" },
    });

    return csvResponse(parts, `flexigo-${store.slug}-export-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (e) {
    return toErrorResponse(e);
  }
}
