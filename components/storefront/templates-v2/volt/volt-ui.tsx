import type { ReactNode } from "react";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import type { StoreLanguage } from "@/lib/types";
import { SouqIcon, type SouqIconName } from "../souq/souq-ui";

export function VoltIcon(props:{name:SouqIconName;className?:string;filled?:boolean}){return <SouqIcon {...props}/>}
export function VoltContainer({children,className=""}:{children:ReactNode;className?:string}){return <div className={`volt-container ${className}`}>{children}</div>}
export function VoltHeading({title,subtitle,eyebrow,action}:{title:string;subtitle?:string|null;eyebrow?:string|null;action?:ReactNode}){
 return <header className="volt-section-head"><div>{eyebrow?<div className="volt-kicker">{eyebrow}</div>:null}<h2 className="volt-title mt-2 text-2xl sm:text-3xl">{title}</h2>{subtitle?<p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--volt-muted)]">{subtitle}</p>:null}</div>{action?<div>{action}</div>:null}</header>
}
export function VoltPrice({cents,compare,lang,currency="DZD"}:{cents:number;compare?:number|null;lang:StoreLanguage|string|null;currency?:string}){return <div className="flex items-baseline gap-2"><strong dir="ltr" className="souq-price text-lg text-[var(--volt-blue)]">{formatSouqPrice(cents,lang,currency)}</strong>{compare&&compare>cents?<span dir="ltr" className="souq-price text-xs text-slate-500 line-through">{formatSouqPrice(compare,lang,currency)}</span>:null}</div>}
