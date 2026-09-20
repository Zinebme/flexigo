import localFont from "next/font/local";

/**
 * NOOR typography — fully self-hosted, deterministic, no runtime font fetch.
 *
 * Headings / display: Alexandria (Arabic-first geometric sans, modern + soft).
 * Body / forms / navigation / commerce UI: IBM Plex Sans Arabic.
 * Both fall back to Tajawal → sans-serif per the NOOR spec.
 */
const body = localFont({
  src: [
    { path: "./font-files/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./font-files/ibm-plex-sans-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./font-files/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./font-files/ibm-plex-sans-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-noor-body",
  fallback: ["Tajawal", "sans-serif"],
  preload: true,
});

const heading = localFont({
  src: [
    { path: "./font-files/alexandria-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./font-files/alexandria-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./font-files/alexandria-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./font-files/alexandria-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-noor-heading",
  fallback: ["Tajawal", "sans-serif"],
  preload: true,
});

/** Space-separated CSS variable classes applied on the NOOR root. */
export const noorFontVariables = `${body.variable} ${heading.variable}`;
