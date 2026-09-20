/**
 * SOUQ — instant product search (pure functions).
 *
 * Deliberately simple: no search engine, no network round-trip per keystroke.
 * A compact index (name + category + price + image) is rendered into the SOUQ
 * shell and filtered client-side, with Arabic-aware normalization so
 * "ساعه" also matches "ساعة", "احمر" matches "أحمر", etc.
 */

export interface SouqSearchItem {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  image: string | null;
  categoryName: string | null;
  isFeatured: boolean;
}

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** Normalize Arabic (and Latin) text for forgiving matching. */
export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SouqSearchOptions {
  limit?: number;
}

export function searchProducts(
  items: SouqSearchItem[],
  query: string,
  options: SouqSearchOptions = {},
): SouqSearchItem[] {
  const limit = options.limit ?? 8;
  const needle = normalizeSearchText(query);
  if (needle.length === 0) return [];
  const words = needle.split(" ").filter(Boolean);

  const scored = items
    .map((item) => {
      const name = normalizeSearchText(item.name);
      const category = normalizeSearchText(item.categoryName ?? "");
      const haystack = `${name} ${category}`;
      if (!words.every((word) => haystack.includes(word))) return null;
      let score = 0;
      if (name === needle) score += 100;
      if (name.startsWith(needle)) score += 40;
      if (name.includes(needle)) score += 20;
      if (category.includes(needle)) score += 8;
      if (item.isFeatured) score += 2;
      return { item, score };
    })
    .filter((entry): entry is { item: SouqSearchItem; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "ar"));

  return scored.slice(0, limit).map((entry) => entry.item);
}
