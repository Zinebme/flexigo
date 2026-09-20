import type { StorefrontData } from "@/lib/storefront/data";
import { SouqCheckoutPage } from "../souq/souq-checkout-page";

/**
 * Backward-compatible /commande entry. The primary LAMSA checkout stays on the
 * product page; this route reuses the same secure engine and receives LAMSA's
 * scoped form skin from the surrounding shell.
 */
export function LamsaCheckoutPage(props: { data: StorefrontData; productId: string | null; variantId: string | null; quantity: number }) {
  return <div className="lamsa-order-form lamsa-standalone-checkout"><SouqCheckoutPage {...props} /></div>;
}
