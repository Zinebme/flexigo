import type { StorefrontData } from "@/lib/storefront/data";
import { SouqCheckoutPage } from "../souq/souq-checkout-page";
export function VoltCheckoutPage(props:{data:StorefrontData;productId:string|null;variantId:string|null;quantity:number}){return <div className="volt-order-form volt-container py-8"><SouqCheckoutPage {...props}/></div>}
