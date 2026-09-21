import type { Metadata } from "next";
import { ShowcaseHome } from "@/components/storefront/showcase-preview";

export const dynamic="force-static";
export const metadata:Metadata={title:"VOLT — أجهزة وإكسسوارات تقنية",robots:{index:false,follow:false}};
export default function VoltPreview(){ return <ShowcaseHome theme="volt"/>; }
