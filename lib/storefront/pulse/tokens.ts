import type {CSSProperties} from "react";
export const PULSE_COLORS={bg:"#F7FAF8",paper:"#FFFFFF",ink:"#132018",muted:"#647067",border:"#DDE8E0",lime:"#B8F34A",green:"#19A974",greenDark:"#0C7A54",blue:"#3A69F7",soft:"#ECF8F1",dark:"#15221A",danger:"#D64545"} as const;
export function pulseCssVars():CSSProperties{return Object.fromEntries(Object.entries(PULSE_COLORS).map(([k,v])=>[`--pulse-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`,v])) as CSSProperties}
