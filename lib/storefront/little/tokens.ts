import type {CSSProperties} from "react";
export const LITTLE_COLORS={bg:"#FFF9F5",paper:"#FFFFFF",ink:"#493D46",muted:"#7B6D76",border:"#F0DDE5",pink:"#FF8FB1",pinkDark:"#E86592",sky:"#8ED8F8",lavender:"#B9A7F7",mint:"#AEE8C7",lemon:"#FFE887",peach:"#FFD2B8",danger:"#D84F67"} as const;
export function littleCssVars():CSSProperties{return Object.fromEntries(Object.entries(LITTLE_COLORS).map(([k,v])=>[`--little-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`,v])) as CSSProperties}
