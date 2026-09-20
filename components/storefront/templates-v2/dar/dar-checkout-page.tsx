import type { StorefrontData } from "@/lib/storefront/data";
import { SouqCheckoutPage } from "../souq/souq-checkout-page";
export function DarCheckoutPage(props:{data:StorefrontData;productId:string|null;variantId:string|null;quantity:number}){return <div className="dar-order-form dar-container py-8"><SouqCheckoutPage {...props}/></div>}
