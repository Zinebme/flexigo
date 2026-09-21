import type {Metadata} from "next";import {ShowcaseHome} from "@/components/storefront/showcase-preview";
export const dynamic="force-static";export const metadata:Metadata={title:"PULSE — الجري واللياقة",robots:{index:false,follow:false}};
export default function Page(){return <ShowcaseHome theme="pulse"/>}
