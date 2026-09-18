/**
 * Storefront language helpers (isomorphic — safe in client and server code).
 */
import { STORE_LANGUAGES, type StoreLanguage } from "../types";

/** Cookie that stores the visitor's chosen storefront language. */
export const LANG_COOKIE = "fx_lang";

/** Validate a candidate language token. */
export function normalizeLang(value: string | null | undefined): StoreLanguage | null {
  return value && STORE_LANGUAGES.includes(value as StoreLanguage) ? (value as StoreLanguage) : null;
}
