import type { Metadata } from "next";
import { ShowcaseHome } from "@/components/storefront/showcase-preview";

export const dynamic="force-static";
export const metadata:Metadata={title:"DAR — معاينة القالب",robots:{index:false,follow:false}};
export default function DarPreview(){ return <ShowcaseHome theme="dar"/>; }
