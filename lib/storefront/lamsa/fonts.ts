import localFont from "next/font/local";

/** Self-hosted subsets: deterministic builds and no storefront third-party request. */
const body = localFont({
  src: [
    { path: "./font-files/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./font-files/ibm-plex-sans-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./font-files/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./font-files/ibm-plex-sans-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-lamsa-body",
  fallback: ["Tajawal", "Arial", "sans-serif"],
  preload: true,
});

const heading = localFont({
  src: [
    { path: "./font-files/noto-kufi-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./font-files/noto-kufi-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./font-files/noto-kufi-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./font-files/noto-kufi-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-lamsa-heading",
  fallback: ["Tajawal", "Arial", "sans-serif"],
  preload: true,
});

export const lamsaFontVariables = `${body.variable} ${heading.variable}`;
