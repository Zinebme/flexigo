import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Dependency-free icon set (stroke style, 24×24 grid) for the dashboards.
 * Replaces the old unicode glyphs: crisper on retina, consistent weight,
 * colourable with `currentColor` and resizable with `size`.
 * Server-safe — no client hooks, usable in RSC and client components alike.
 */
const PATHS = {
  home: (
    <>
      <path d="M3.5 10.4 12 3.5l8.5 6.9" />
      <path d="M5.8 9.4V20h12.4V9.4" />
      <path d="M9.9 20v-5.6h4.2V20" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3.2" y="3.2" width="7.2" height="7.2" rx="1.6" />
      <rect x="13.6" y="3.2" width="7.2" height="4.6" rx="1.6" />
      <rect x="13.6" y="11.2" width="7.2" height="9.6" rx="1.6" />
      <rect x="3.2" y="13.8" width="7.2" height="7" rx="1.6" />
    </>
  ),
  receipt: (
    <>
      <path d="M5.5 3.5h13v17l-2.6-1.6-2.6 1.6-2.6-1.6-2.6 1.6-2.6-1.6z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </>
  ),
  package: (
    <>
      <path d="M20.8 8.2 12 3.4 3.2 8.2v7.6L12 20.6l8.8-4.8z" />
      <path d="M3.2 8.2 12 13l8.8-4.8M12 13v7.6" />
    </>
  ),
  box: (
    <>
      <path d="M20.8 8.2 12 3.4 3.2 8.2v7.6L12 20.6l8.8-4.8z" />
      <path d="M3.2 8.2 12 13l8.8-4.8M12 13v7.6" />
    </>
  ),
  tag: (
    <>
      <path d="M11.2 3.5H4.4A1 1 0 0 0 3.4 4.5v6.8a2 2 0 0 0 .6 1.4l7.6 7.6a1.8 1.8 0 0 0 2.6 0l6.3-6.3a1.8 1.8 0 0 0 0-2.6l-7.6-7.6a2 2 0 0 0-1.7-.3z" />
      <path d="M7.6 7.7h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8.5 4.6L12 12.2 3.5 7.6z" />
      <path d="m3.5 12.2 8.5 4.6 8.5-4.6M3.5 16.6l8.5 4.6 8.5-4.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9.2" cy="8" r="3.4" />
      <path d="M2.8 20v-.8a4.6 4.6 0 0 1 4.6-4.6h3.6a4.6 4.6 0 0 1 4.6 4.6V20" />
      <path d="M16.4 4.9a3.4 3.4 0 0 1 0 6.5M17.8 14.9a4.6 4.6 0 0 1 3.4 4.4V20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20v-.6a5 5 0 0 1 5-5h4.4a5 5 0 0 1 5 5v.6" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5V11M12 20.5V4.5M17 20.5v-6.5" />
    </>
  ),
  trendingUp: (
    <>
      <path d="m3.5 16.5 5.5-5.5 3.5 3.5 7-7" />
      <path d="M15 7.5h4.5V12" />
    </>
  ),
  trendingDown: (
    <>
      <path d="m3.5 7.5 5.5 5.5 3.5-3.5 7 7" />
      <path d="M15 16.5h4.5V12" />
    </>
  ),
  truck: (
    <>
      <path d="M2.8 6.5h10.4v10.2H2.8z" />
      <path d="M13.2 10h3.4l3.6 3.2v3.5h-7z" />
      <circle cx="7" cy="18.4" r="1.9" />
      <circle cx="17" cy="18.4" r="1.9" />
    </>
  ),
  star: (
    <>
      <path d="m12 3.6 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 10l6-.9z" />
    </>
  ),
  sliders: (
    <>
      <path d="M4.5 20.5v-6.8M4.5 9.9V3.5M12 20.5v-8.6M12 8.1V3.5M19.5 20.5v-4.8M19.5 11.9V3.5" />
      <path d="M2 13.7h5M9.5 8.1h5M17 15.7h5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.6 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.5 1.5 0 0 0-2.6-1.1l-.1.1a1.9 1.9 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.5 1.5 0 0 0 1.1-2.6l-.1-.1A1.9 1.9 0 1 1 8.1 3l.1.1a1.5 1.5 0 0 0 2.6-1.1v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.5 1.5 0 0 0 2.6 1.1l.1-.1A1.9 1.9 0 1 1 20 5.5l-.1.1a1.5 1.5 0 0 0 1.1 2.6h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.5 1.5 0 0 0-1.5 1.4z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.6" />
      <path d="m20.2 20.2-4.5-4.5" />
    </>
  ),
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  minus: <path d="M5.2 12h13.6" />,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronUp: <path d="m6.5 14.5 5.5-5.5 5.5 5.5" />,
  chevronRight: <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />,
  chevronLeft: <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />,
  chevronsUpDown: (
    <>
      <path d="m7.5 15 4.5 4.5L16.5 15M7.5 9 12 4.5 16.5 9" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </>
  ),
  arrowUp: <path d="M12 19.5v-15M6 10.5l6-6 6 6" />,
  arrowDown: <path d="M12 4.5v15M6 13.5l6 6 6-6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m4.8 12.6 4.6 4.6L19.2 7.4" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m8.3 12.2 2.6 2.6 4.8-5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.8 21.2 20H2.8z" />
      <path d="M12 9.6v4.3M12 17.1h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 11.2v5M12 7.9h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.6a6 6 0 1 0-12 0c0 6.4-2.6 8.2-2.6 8.2h17.2S18 15 18 8.6" />
      <path d="M13.7 20.4a2 2 0 0 1-3.4 0" />
    </>
  ),
  message: (
    <>
      <path d="M20.8 11.6a8.3 8.3 0 0 1-8.8 8.3 8.8 8.8 0 0 1-3.8-.8L3.2 20.8l1.8-4.9a8.3 8.3 0 0 1-1-4 8.3 8.3 0 0 1 8.8-8.3 8.3 8.3 0 0 1 8 8" />
    </>
  ),
  phone: (
    <>
      <path d="M21 16.9v2.4a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 3.3 3h2.4a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L6.8 10.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </>
  ),
  mail: (
    <>
      <rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2.2" />
      <path d="m3.4 7.4 8.6 5.6 8.6-5.6" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14.4V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V7.6A1.6 1.6 0 0 1 5.6 6h4.6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.8v11.4M7.6 10.8 12 15.2l4.4-4.4" />
      <path d="M4 19.6h16" />
    </>
  ),
  upload: (
    <>
      <path d="M20.4 15.4v3.6a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-3.6" />
      <path d="m7.6 8.4 4.4-4.4 4.4 4.4M12 4v11.6" />
    </>
  ),
  pencil: (
    <>
      <path d="M12.4 20.4H21" />
      <path d="M16.6 3.6a2.1 2.1 0 0 1 3 3L7.4 18.8l-4 1 1-4z" />
    </>
  ),
  trash: (
    <>
      <path d="M3.6 6.2h16.8M8.4 6.2V4h7.2v2.2" />
      <path d="M18.4 6.2 17.6 20H6.4L5.6 6.2" />
      <path d="M10.2 10.4v5.6M13.8 10.4v5.6" />
    </>
  ),
  dots: (
    <>
      <circle cx="5.4" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18.6" cy="12" r="1.5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11.6" height="11.6" rx="2" />
      <path d="M5.6 15H4.8A1.6 1.6 0 0 1 3.2 13.4V4.8A1.6 1.6 0 0 1 4.8 3.2h8.6A1.6 1.6 0 0 1 15 4.8v.8" />
    </>
  ),
  filter: <path d="M21 4.2H3l7.2 8.6v6.4l3.6 1.8v-8.2z" />,
  image: (
    <>
      <rect x="3.2" y="3.6" width="17.6" height="16.8" rx="2.2" />
      <circle cx="8.6" cy="9" r="1.7" />
      <path d="m20.8 15.6-4.6-4.4-9.4 9.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.6c6 0 9.6 6.4 9.6 6.4a17.7 17.7 0 0 1-2.7 3.6M6.4 7.9A17.6 17.6 0 0 0 2.4 12S6 18.4 12 18.4a9.6 9.6 0 0 0 4-.85" />
      <path d="m10 10a2.9 2.9 0 0 0 4 4M3.4 3.4l17.2 17.2" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.3" />
      <circle cx="15" cy="6" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="15" cy="12" r="1.3" />
      <circle cx="9" cy="18" r="1.3" />
      <circle cx="15" cy="18" r="1.3" />
    </>
  ),
  printer: (
    <>
      <path d="M6.8 9.2V3.4h10.4v5.8" />
      <path d="M6.8 18.2H5.2a2 2 0 0 1-2-2v-4.8a2 2 0 0 1 2-2h13.6a2 2 0 0 1 2 2v4.8a2 2 0 0 1-2 2h-1.6" />
      <rect x="6.8" y="14.4" width="10.4" height="6.4" rx="1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.4" y="5" width="17.2" height="15.6" rx="2.2" />
      <path d="M8 3.2v3.6M16 3.2v3.6M3.4 10h17.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10.4c0 5.8-8 11.2-8 11.2s-8-5.4-8-11.2a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10.2" r="2.8" />
    </>
  ),
  store: (
    <>
      <path d="m2.8 7.6 1.8-4h14.8l1.8 4" />
      <path d="M4.4 7.6v11.6a1.4 1.4 0 0 0 1.4 1.4h12.4a1.4 1.4 0 0 0 1.4-1.4V7.6" />
      <path d="M2.8 7.6h18.4" />
      <path d="M9.4 20.6v-6h5.2v6" />
    </>
  ),
  sparkles: (
    <>
      <path d="m11.4 3.2 1.8 4.3 4.3 1.8-4.3 1.8-1.8 4.3-1.8-4.3L5.3 9.3l4.3-1.8z" />
      <path d="m18.2 14.4.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  palette: (
    <>
      <path d="M12 20.8a8.8 8.8 0 1 1 8.8-8.8c0 1.9-1.5 3-3.2 3h-1.4a2 2 0 0 0-1.4 3.4 1.8 1.8 0 0 1-1.3 3.1z" />
      <circle cx="7.8" cy="11.4" r="1.1" />
      <circle cx="10.6" cy="7.6" r="1.1" />
      <circle cx="15.2" cy="8.4" r="1.1" />
    </>
  ),
  menu: <path d="M3.6 6.6h16.8M3.6 12h16.8M3.6 17.4h16.8" />,
  logout: (
    <>
      <path d="M9.4 20.6H5.6a2 2 0 0 1-2-2V5.4a2 2 0 0 1 2-2h3.8" />
      <path d="m15.6 16.4 4.4-4.4-4.4-4.4M20 12H9.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 21.4s7.8-3.6 7.8-9.6V5.2L12 2.6 4.2 5.2v6.6c0 6 7.8 9.6 7.8 9.6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M3.4 12h17.2" />
      <path d="M12 3.2a14 14 0 0 1 0 17.6 14 14 0 0 1 0-17.6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.4 11.2A8.4 8.4 0 0 0 6.2 6.4L3.6 8.8" />
      <path d="M3.6 4.8v4h4" />
      <path d="M3.6 12.8a8.4 8.4 0 0 0 14.2 4.8l2.6-2.4" />
      <path d="M20.4 19.2v-4h-4" />
    </>
  ),
  link: (
    <>
      <path d="M10.2 13.6a4.6 4.6 0 0 0 6.9.5l2.6-2.6a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5" />
      <path d="M13.8 10.4a4.6 4.6 0 0 0-6.9-.5l-2.6 2.6a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.2" y="10.4" width="15.6" height="10.2" rx="2.2" />
      <path d="M7.8 10.4V7.2a4.2 4.2 0 0 1 8.4 0v3.2" />
    </>
  ),
  zap: <path d="M13.4 2.6 4 14h7l-1 7.4L19.6 10h-7z" />,
  clipboard: (
    <>
      <path d="M9.2 4.2H6.8a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2h-2.4" />
      <rect x="9.2" y="2.4" width="5.6" height="3.6" rx="1.2" />
      <path d="m9.2 13.8 2 2 3.6-3.8" />
    </>
  ),
  creditCard: (
    <>
      <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.2" />
      <path d="M2.8 10h18.4" />
    </>
  ),
  inbox: (
    <>
      <path d="M21.4 12.4h-5.6l-1.8 2.8H10l-1.8-2.8H2.6" />
      <path d="M6.2 4.4h11.6l3.6 8v5.8a2 2 0 0 1-2 2H4.6a2 2 0 0 1-2-2v-5.8z" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.8z" />
      <path d="M14 2.8v5h5M8.6 13h6.8M8.6 16.8h6.8" />
    </>
  ),
  plug: (
    <>
      <path d="M9.2 2.8v5.4M14.8 2.8v5.4" />
      <path d="M6.4 8.2h11.2v3a5.6 5.6 0 0 1-11.2 0z" />
      <path d="M12 16.8v4.4" />
    </>
  ),
  heart: (
    <>
      <path d="M20.6 5.9a4.8 4.8 0 0 0-6.8 0L12 7.7l-1.8-1.8a4.8 4.8 0 1 0-6.8 6.8L12 21.3l8.6-8.6a4.8 4.8 0 0 0 0-6.8" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3.2" />
      <path d="M4 6v12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V6" />
      <path d="M4 12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" />
    </>
  ),
  lifeBuoy: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="m5.8 5.8 3.6 3.6M14.6 14.6l3.6 3.6M18.2 5.8l-3.6 3.6M9.4 14.6l-3.6 3.6" />
    </>
  ),
  send: (
    <>
      <path d="M21 3.4 2.8 10.6l7.6 3 3 7.6z" />
      <path d="m10.4 13.6 4.8-4.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.4 7.4A2.4 2.4 0 0 1 5.8 5h11.4a2 2 0 0 1 2 2v1.4" />
      <rect x="3.4" y="7.4" width="17.2" height="11.8" rx="2.4" />
      <path d="M16.6 13.4h.01" />
    </>
  ),
  history: (
    <>
      <path d="M3.4 12a8.6 8.6 0 1 0 2.8-6.3L3.4 8.2" />
      <path d="M3.4 4.2v4h4" />
      <path d="M12 7.8V12l3 1.8" />
    </>
  ),
  building: (
    <>
      <rect x="4.2" y="3.2" width="15.6" height="17.6" rx="1.8" />
      <path d="M8.4 7.4h2.4M13.2 7.4h2.4M8.4 11.4h2.4M13.2 11.4h2.4M8.4 15.4h2.4M13.2 15.4h2.4" />
    </>
  ),
  cash: (
    <>
      <rect x="2.6" y="6.2" width="18.8" height="11.6" rx="2.2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.2 12h.01M17.8 12h.01" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
  ...rest
}: { name: IconName; size?: number | string; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
