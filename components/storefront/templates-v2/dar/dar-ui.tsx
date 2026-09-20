import type { ReactNode } from "react";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import type { StoreLanguage } from "@/lib/types";
import { SouqIcon, type SouqIconName } from "../souq/souq-ui";

export function DarIcon(props:{name:SouqIconName;className?:string;filled?:boolean}){return <SouqIcon {...props}/>}
export function DarContainer({children,className=""}:{children:ReactNode;className?:string}){return <div className={`dar-container ${className}`}>{children}</div>}
export function DarHeading({title,subtitle,eyebrow,action}:{title:string;subtitle?:string|null;eyebrow?:string|null;action?:ReactNode}){return <header className="dar-section-head"><div>{eyebrow?<div className="dar-eyebrow">{eyebrow}</div>:null}<h2 className="dar-heading mt-2 text-2xl sm:text-4xl">{title}</h2>{subtitle?<p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--dar-muted)]">{subtitle}</p>:null}</div>{action?<div>{action}</div>:null}</header>}
export function DarPrice({cents,compare,lang,currency="DZD"}:{cents:number;compare?:number|null;lang:StoreLanguage|string|null;currency?:string}){return <div className="flex items-baseline gap-2"><strong className="text-lg text-[var(--dar-terracotta-dark)]">{formatSouqPrice(cents,lang,currency)}</strong>{compare&&compare>cents?<span className="text-xs text-stone-400 line-through">{formatSouqPrice(compare,lang,currency)}</span>:null}</div>}
