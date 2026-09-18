/**
 * Storefront content loading.
 * The LIVE site always reads `published_content` (the last published
 * snapshot). Draft content is only ever rendered in the merchant dashboard
 * preview and the super-admin preview — never on the public site.
 */
import { getAnonSupabase } from "../supabase/anon";
import { pageContentSchema, type PageContent } from "../sections/definitions";
import type { PageKey } from "../types";

export interface PublicPage {
  key: PageKey | string;
  title: string;
  content: PageContent;
}

export async function loadPublicPage(storeId: string, key: string): Promise<PublicPage | null> {
  const anon = getAnonSupabase();
  const { data } = await anon
    .from("pages")
    .select("key, title, published_content")
    .eq("store_id", storeId)
    .eq("key", key)
    .maybeSingle();
  if (!data) return null;
  const raw = data.published_content as unknown;
  if (!raw) return null;
  const parsed = pageContentSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { key: data.key, title: data.title, content: parsed.data };
}

/** Render helper: sections list of a page (empty-safe). */
export function pageSections(page: PublicPage | null): PageContent["sections"] {
  return page?.content.sections ?? [];
}
