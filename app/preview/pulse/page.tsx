import type {Metadata} from "next";import {ShowcaseHome} from "@/components/storefront/showcase-preview";
export const dynamic="force-static";export const metadata:Metadata={title:"PULSE — معاينة القالب",robots:{index:false,follow:false}};
export default function Page(){return <ShowcaseHome theme="pulse"/>}
