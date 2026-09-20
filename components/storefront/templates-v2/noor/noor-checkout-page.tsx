import type { StorefrontData } from "@/lib/storefront/data";
import { SouqCheckoutPage } from "../souq/souq-checkout-page";

/**
 * Backward-compatible /commande entry for NOOR. The primary NOOR checkout
 * stays on the product page; this route reuses the same secure engine and the
 * NOOR skin comes from the surrounding shell.
 */
export function NoorCheckoutPage(props: { data: StorefrontData; productId: string | null; variantId: string | null; quantity: number }) {
  return (
    <div className="noor-order-form noor-standalone-checkout">
      <SouqCheckoutPage {...props} />
    </div>
  );
}
