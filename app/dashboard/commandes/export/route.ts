import { getMerchantContext } from "@/lib/auth/merchant-context";
import { listOrders } from "@/lib/dashboard/orders";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { toCsv, csvResponse } from "@/lib/csv";
import { can } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** CSV export of the filtered order list (capability: orders.view). */
export async function GET(req: Request) {
  const ctx = await getMerchantContext();
  if (!can(ctx.role, "orders.view")) throw Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" });

  const url = new URL(req.url);
  const orders = await listOrders(ctx.store.id, {
    status: url.searchParams.get("status") ?? undefined,
    wilaya_code: url.searchParams.get("wilaya") ? Number(url.searchParams.get("wilaya")) : undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  }, 5000);

  const rows = orders.map((o) => ({
    numero: o.order_number,
    nom: o.full_name,
    telephone: o.phone,
    wilaya: o.wilaya,
    commune: o.commune,
    adresse: o.address ?? "",
    livraison: o.delivery_type === "office" ? `bureau:${o.office ?? ""}` : "domicile",
    sous_total_dz: o.subtotal_cents / 100,
    livraison_dz: o.shipping_fee_cents / 100,
    total_dz: o.total_cents / 100,
    statut: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status,
    utm_source: o.utm_source ?? "",
    utm_campaign: o.utm_campaign ?? "",
    creee: o.created_at,
  }));
  return csvResponse(
    toCsv(rows, [
      { key: "numero", label: "N° commande" },
      { key: "nom", label: "Nom" },
      { key: "telephone", label: "Téléphone" },
      { key: "wilaya", label: "Wilaya" },
      { key: "commune", label: "Commune" },
      { key: "adresse", label: "Adresse" },
      { key: "livraison", label: "Livraison" },
      { key: "sous_total_dz", label: "Sous-total (DA)" },
      { key: "livraison_dz", label: "Frais (DA)" },
      { key: "total_dz", label: "Total (DA)" },
      { key: "statut", label: "Statut" },
      { key: "utm_source", label: "UTM source" },
      { key: "utm_campaign", label: "UTM campagne" },
      { key: "creee", label: "Créée le" },
    ]),
    `commandes-${ctx.store.slug}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
