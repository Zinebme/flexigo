/**
 * Shared storefront data loading (used by the layout and every storefront page).
 * Store resolution is cached 30 s (see resolve.ts); theme/settings are cheap
 * point reads.
 */
import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang } from "./lang";
import { getAnonSupabase } from "../supabase/anon";
import { t, type StorefrontDict } from "../i18n/dictionaries";
import type { StoreLanguage } from "../types";
import type { StoreSettings } from "../supabase/database.types";
import { resolveStoreBySlug } from "./resolve";

export interface StorefrontData {
  id: string;
  slug: string;
  name: string;
  website_type: string;
  currency: string;
  settings: StoreSettings | null;
  theme: {
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    background_color: string | null;
    typography: string | null;
    button_shape: string | null;
    announcement: string | null;
  } | null;
  dict: StorefrontDict;
  lang: StoreLanguage;
  base: string;
}

export async function getStorefrontData(
  slug: string,
  lang?: string,
): Promise<StorefrontData | null> {
  const store = await resolveStoreBySlug(slug);
  if (!store) return null;

  // Language priority: explicit arg > fx_lang cookie (set by the switcher) > store default.
  let cookieLang: string | null = null;
  try {
    cookieLang = (await cookies()).get(LANG_COOKIE)?.value ?? null;
  } catch {
    cookieLang = null;
  }
  const chosenLang: StoreLanguage = normalizeLang(lang) ?? normalizeLang(cookieLang) ?? (store.language as StoreLanguage);
  const dict = t(chosenLang);

  const anon = getAnonSupabase();
  const [{ data: theme }, { data: storeRow }] = await Promise.all([
    anon.from("themes").select("*").eq("store_id", store.id).maybeSingle(),
    anon.from("stores").select("settings").eq("id", store.id).maybeSingle(),
  ]);

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    website_type: store.website_type,
    currency: store.currency,
    settings: (storeRow?.settings as StoreSettings | null) ?? null,
    theme: theme
      ? {
          logo_url: theme.logo_url,
          favicon_url: theme.favicon_url,
          primary_color: theme.primary_color,
          secondary_color: theme.secondary_color,
          background_color: theme.background_color,
          typography: theme.typography,
          button_shape: theme.button_shape,
          announcement: theme.announcement,
        }
      : null,
    dict,
    lang: chosenLang,
    base: `/s/${store.slug}`,
  };
}
