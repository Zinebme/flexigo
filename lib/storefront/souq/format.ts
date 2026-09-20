/**
 * SOUQ — display formatting (Arabic-first).
 *
 * Prices are stored in cents everywhere. SOUQ shows Algerian Dinar with the
 * Arabic short unit "دج" (e.g. "2 900 دج") while every other template keeps the
 * platform's historical "DA" formatting: nothing shared is modified.
 */
import type { StoreLanguage } from "../../types";

const NUMBER = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function group(cents: number): string {
  // Normalize exotic group separators (narrow no-break space, no-break space)
  // to a plain space so the price renders identically across browsers.
  return NUMBER.format(Math.round(cents / 100)).replace(/[\u202F\u00A0]/g, " ");
}

/** "2 900 دج" (ar) / "2 900 DA" (fr, en). */
export function formatSouqPrice(cents: number, lang: StoreLanguage | string | null = "ar", currency = "DZD"): string {
  const unit = lang === "ar" ? "دج" : currency === "DZD" ? "DA" : currency;
  return `${group(cents)} ${unit}`;
}

/** Amount without the unit — useful inside offer cards ("3 قطع / 7 200"). */
export function formatSouqAmount(cents: number): string {
  return group(cents);
}

/** Arabic-aware date for review cards. */
export function formatSouqDate(value: string | null | undefined, lang: StoreLanguage | string | null = "ar"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "en" ? "en-GB" : "fr-FR", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}
