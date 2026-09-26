/**
 * SOUQ — dynamic option / variant engine (pure functions, unit-tested).
 *
 * Requirements this file implements:
 *  - NOTHING is hardcoded to "color" / "size": option groups are declared data.
 *  - Groups may be configured on the product (`products.option_groups`, JSONB)
 *    with selection_mode (single|multiple), display_type
 *    (buttons|color_swatch|image|checkbox|dropdown), required, min/max.
 *  - When no configuration exists, groups are DERIVED from the store's real
 *    `product_variants.options` data, so every existing product keeps working
 *    without any migration of its data.
 *  - Single-choice groups resolve to an existing variant id (the checkout
 *    engine only accepts product_id + variant_id + quantity, so the server
 *    remains the single source of truth for pricing and stock).
 *  - Multiple-choice groups ("الإضافات") are resolved to real add-on products
 *    of the same store → they become additional order lines priced by the
 *    server. Values without an add-on product are clearly flagged as
 *    informational (confirmed by phone) instead of being silently dropped.
 */
import { z } from "zod";

export const SOUQ_SELECTION_MODES = ["single", "multiple"] as const;
export type SouqSelectionMode = (typeof SOUQ_SELECTION_MODES)[number];
export type SouqSelectionCountMode = "fixed" | "order_quantity";

export const SOUQ_DISPLAY_TYPES = ["buttons", "color_swatch", "image", "checkbox", "dropdown"] as const;
export type SouqDisplayType = (typeof SOUQ_DISPLAY_TYPES)[number];

// ---------------------------------------------------------------------------
// Configuration schema (products.option_groups)
// ---------------------------------------------------------------------------

const optionValueSchema = z.object({
  value: z.string().trim().min(1).max(60),
  label: z.string().trim().max(80).optional().nullable(),
  label_fr: z.string().trim().max(80).optional().nullable(),
  label_en: z.string().trim().max(80).optional().nullable(),
  color: z
    .string()
    .trim()
    .max(20)
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Couleur invalide")
    .optional()
    .nullable(),
  image: z.string().trim().max(2000).optional().nullable(),
  /** Multiple-choice values may point to a real add-on product of the store. */
  addon_product_id: z.string().uuid().optional().nullable(),
  addon_product_slug: z.string().trim().max(120).optional().nullable(),
  disabled: z.boolean().optional(),
});

const optionGroupSchema = z.object({
  key: z.string().trim().min(1).max(40),
  /** Key inside product_variants.options (defaults to `key`). */
  option_key: z.string().trim().max(60).optional().nullable(),
  label: z.string().trim().min(1).max(80),
  label_fr: z.string().trim().max(80).optional().nullable(),
  label_en: z.string().trim().max(80).optional().nullable(),
  selection_mode: z.enum(SOUQ_SELECTION_MODES).optional(),
  selection_count_mode: z.enum(["fixed", "order_quantity"]).optional(),
  display_type: z.enum(SOUQ_DISPLAY_TYPES).optional(),
  required: z.boolean().optional(),
  min_selections: z.number().int().min(0).max(20).optional().nullable(),
  max_selections: z.number().int().min(1).max(20).optional().nullable(),
  default_value: z.string().trim().max(60).optional().nullable(),
  help: z.string().trim().max(200).optional().nullable(),
  values: z.array(optionValueSchema).max(40).optional(),
  position: z.number().int().min(0).max(99).optional(),
  is_active: z.boolean().optional(),
});

export const souqOptionGroupsSchema = z.union([z.array(optionGroupSchema).max(8), z.null()]);
export type SouqOptionGroupConfig = z.infer<typeof optionGroupSchema>;
export type SouqOptionValueConfig = z.infer<typeof optionValueSchema>;

/** Defensive parse of the JSONB column — malformed config never breaks a page. */
export function parseOptionGroupsConfig(raw: unknown): SouqOptionGroupConfig[] {
  if (raw === null || raw === undefined) return [];
  const parsed = souqOptionGroupsSchema.safeParse(raw);
  if (!parsed.success || !parsed.data) return [];
  return parsed.data
    .filter((g) => g.is_active !== false && (g.values ?? []).length > 0)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

// ---------------------------------------------------------------------------
// Resolved runtime model (what the components render)
// ---------------------------------------------------------------------------

export interface SouqOptionValue {
  value: string;
  label: string;
  color: string | null;
  image: string | null;
  addonProductId: string | null;
  addonProductSlug: string | null;
  /** Server-resolved price of the add-on product (cents) — display only. */
  addonPriceCents: number | null;
  informational: boolean;
  disabled: boolean;
}

export interface SouqOptionGroup {
  key: string;
  optionKey: string | null;
  label: string;
  selectionMode: SouqSelectionMode;
  selectionCountMode: SouqSelectionCountMode;
  displayType: SouqDisplayType;
  required: boolean;
  minSelections: number;
  maxSelections: number | null;
  defaultValue: string | null;
  help: string | null;
  values: SouqOptionValue[];
  /** "config" = declared on the product, "derived" = inferred from variants. */
  source: "config" | "derived";
}

export interface SouqVariantInput {
  id: string;
  name: string;
  options: Record<string, unknown> | null;
  price_cents: number | null;
  stock: number;
  is_active?: boolean;
}

export interface SouqAddOnProduct {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image?: string | null;
}

export type SouqSelections = Record<string, string[]>;

// ---------------------------------------------------------------------------
// Derivation from real variant data
// ---------------------------------------------------------------------------

/** Keys that make a group a colour picker, in any language of the platform. */
const COLOR_HINTS = [
  "color",
  "colour",
  "couleur",
  "لون",
  "اللون",
  "ألوان",
  "couleurs",
];

/** Keys that make a group a size picker. */
const SIZE_HINTS = ["size", "taille", "مقاس", "المقاس", "قياس"];

export function looksLikeColorKey(label: string): boolean {
  const needle = label.trim().toLowerCase();
  return COLOR_HINTS.some((hint) => needle.includes(hint));
}

export function looksLikeSizeKey(label: string): boolean {
  const needle = label.trim().toLowerCase();
  return SIZE_HINTS.some((hint) => needle.includes(hint));
}

/** `#rgb`/`#rrggbb`, or a CSS colour keyword we can name in Arabic. */
const COLOR_WORD_MAP: Record<string, string> = {
  black: "#111827",
  أسود: "#111827",
  noir: "#111827",
  white: "#ffffff",
  أبيض: "#ffffff",
  blanc: "#ffffff",
  red: "#dc2626",
  أحمر: "#dc2626",
  rouge: "#dc2626",
  blue: "#2563eb",
  أزرق: "#2563eb",
  bleu: "#2563eb",
  green: "#16a34a",
  أخضر: "#16a34a",
  vert: "#16a34a",
  yellow: "#eab308",
  أصفر: "#eab308",
  jaune: "#eab308",
  gray: "#6b7280",
  grey: "#6b7280",
  رمادي: "#6b7280",
  gris: "#6b7280",
  beige: "#e7d8c9",
  بيج: "#e7d8c9",
  brown: "#92400e",
  بني: "#92400e",
  marron: "#92400e",
  pink: "#ec4899",
  وردي: "#ec4899",
  rose: "#ec4899",
  orange: "#f97316",
  برتقالي: "#f97316",
  purple: "#7c3aed",
  بنفسجي: "#7c3aed",
  violet: "#7c3aed",
  gold: "#d4af37",
  ذهبي: "#d4af37",
  silver: "#c0c0c0",
  فضي: "#c0c0c0",
  navy: "#0f2a47",
  كحلي: "#0f2a47",
};

export function colorForValue(value: string): string | null {
  const raw = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) return raw;
  const key = raw.toLowerCase();
  return COLOR_WORD_MAP[key] ?? COLOR_WORD_MAP[raw] ?? null;
}

function optionEntries(variant: SouqVariantInput): Array<[string, string]> {
  const entries = Object.entries(variant.options ?? {});
  return entries
    .filter(([key, value]) => key.trim().length > 0 && typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => [key.trim(), String(value).trim()] as [string, string]);
}

/** Groups + values inferred from the store's real product variants. */
export function deriveOptionGroups(variants: SouqVariantInput[]): SouqOptionGroup[] {
  const order: string[] = [];
  const map = new Map<string, Set<string>>();
  for (const variant of variants) {
    if (variant.is_active === false) continue;
    for (const [key, value] of optionEntries(variant)) {
      if (!map.has(key)) {
        map.set(key, new Set());
        order.push(key);
      }
      map.get(key)?.add(value);
    }
  }

  return order.map((key) => {
    const values = [...(map.get(key) ?? new Set<string>())];
    const isColor = looksLikeColorKey(key);
    const isSize = looksLikeSizeKey(key);
    const everyValueHasColorWord = values.every((v) => colorForValue(v) !== null);
    const useSwatch = isColor || everyValueHasColorWord;
    const displayType: SouqDisplayType = useSwatch
      ? "color_swatch"
      : isSize || values.length <= 6
        ? "buttons"
        : "dropdown";

    return {
      key,
      optionKey: key,
      label: key,
      selectionMode: "single" as SouqSelectionMode,
      selectionCountMode: "fixed" as SouqSelectionCountMode,
      displayType,
      required: true,
      minSelections: 1,
      maxSelections: 1,
      defaultValue: null,
      help: null,
      values: values.map((value) => ({
        value,
        label: value,
        color: useSwatch ? colorForValue(value) : null,
        image: null,
        addonProductId: null,
        addonProductSlug: null,
        addonPriceCents: null,
        informational: false,
        disabled: false,
      })),
      source: "derived" as const,
    };
  });
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Merge the merchant's declared groups with groups derived from real variant
 * data. Declared configuration always wins; anything else keeps working.
 */
export function buildOptionGroups(
  variants: SouqVariantInput[],
  config: unknown,
  addOnProducts: SouqAddOnProduct[] = [],
): SouqOptionGroup[] {
  const declared = parseOptionGroupsConfig(config);
  const derived = deriveOptionGroups(variants);
  const byId = new Map(addOnProducts.map((p) => [p.id, p]));
  const bySlug = new Map(addOnProducts.map((p) => [norm(p.slug), p]));

  const declaredKeys = new Set(declared.map((g) => g.option_key ?? g.key));

  const configGroups: SouqOptionGroup[] = declared.map((group) => {
    const selectionMode: SouqSelectionMode = group.selection_mode === "multiple" ? "multiple" : "single";
    const values: SouqOptionValue[] = (group.values ?? []).map((value) => {
      const addon = value.addon_product_id
        ? byId.get(value.addon_product_id) ?? null
        : value.addon_product_slug
          ? bySlug.get(norm(value.addon_product_slug)) ?? null
          : null;
      const hasAddon = Boolean(addon);
      return {
        value: value.value,
        label: value.label ?? value.value,
        color: value.color ?? colorForValue(value.value),
        image: value.image ?? null,
        addonProductId: addon?.id ?? null,
        addonProductSlug: addon?.slug ?? null,
        addonPriceCents: addon?.price_cents ?? null,
        // Multiple-choice values without a real add-on product cannot be priced
        // by the server → they are explicit informational selections.
        informational: selectionMode === "multiple" && !hasAddon,
        disabled: value.disabled === true || (selectionMode === "single" && hasAddon),
      };
    });
    const defaultType: SouqDisplayType =
      selectionMode === "multiple" ? "checkbox" : values.every((v) => v.color) ? "color_swatch" : "buttons";
    return {
      key: group.key,
      optionKey: selectionMode === "single" ? group.option_key ?? group.key : null,
      label: group.label,
      selectionMode,
      selectionCountMode: selectionMode === "multiple" && group.selection_count_mode === "order_quantity" ? "order_quantity" : "fixed",
      displayType: group.display_type ?? defaultType,
      required: group.required ?? selectionMode === "single",
      minSelections:
        selectionMode === "multiple"
          ? group.min_selections ?? (group.required ? 1 : 0)
          : 1,
      maxSelections:
        selectionMode === "multiple"
          ? group.max_selections ?? null
          : 1,
      defaultValue: group.default_value ?? null,
      help: group.help ?? null,
      values,
      source: "config",
    };
  });

  const missingDerived = derived.filter((g) => !declaredKeys.has(g.optionKey ?? g.key));
  return [...configGroups, ...missingDerived];
}

// ---------------------------------------------------------------------------
// Selection resolution
// ---------------------------------------------------------------------------

export function emptySelections(groups: SouqOptionGroup[]): SouqSelections {
  const out: SouqSelections = {};
  for (const group of groups) {
    out[group.key] = group.defaultValue ? [group.defaultValue] : [];
  }
  return out;
}

export function selectedValues(selections: SouqSelections, group: SouqOptionGroup): string[] {
  const values = selections[group.key] ?? [];
  const allowed = new Set(group.values.map((v) => v.value));
  return values.filter((v) => allowed.has(v));
}

/** Toggle/select a value respecting the group's selection mode and limits. */
export function applySelection(
  group: SouqOptionGroup,
  selections: SouqSelections,
  value: string,
  quantity = 1,
): SouqSelections {
  const current = selectedValues(selections, group);
  if (group.selectionMode === "single") {
    return { ...selections, [group.key]: current[0] === value ? [] : [value] };
  }
  const exists = current.includes(value);
  let next = exists ? current.filter((v) => v !== value) : [...current, value];
  const maximum = group.selectionCountMode === "order_quantity" ? Math.max(1, quantity) : group.maxSelections;
  if (!exists && maximum !== null && next.length > maximum) {
    next = [...next.slice(1)];
  }
  return { ...selections, [group.key]: next };
}

function variantOptionMap(variant: SouqVariantInput): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, value] of optionEntries(variant)) map.set(norm(key), norm(value));
  return map;
}

/**
 * Resolve the concrete variant matching the single-choice selections.
 * Returns null when the combination does not exist (or is not fully chosen).
 */
export function resolveVariant(
  variants: SouqVariantInput[],
  groups: SouqOptionGroup[],
  selections: SouqSelections,
): SouqVariantInput | null {
  const singleGroups = groups.filter((g) => g.selectionMode === "single" && g.optionKey);
  const conditions = singleGroups
    .map((group) => ({ group, value: selectedValues(selections, group)[0] }))
    .filter((c): c is { group: SouqOptionGroup; value: string } => Boolean(c.value));

  const active = variants.filter((v) => v.is_active !== false);
  if (active.length === 0) return null;
  if (singleGroups.length === 0) return active.length === 1 ? active[0] ?? null : null;

  if (conditions.length !== singleGroups.length) return null;

  const match = active.find((variant) => {
    const map = variantOptionMap(variant);
    return conditions.every(({ group, value }) => map.get(norm(group.optionKey as string)) === norm(value));
  });
  return match ?? null;
}

export interface SouqSelectionIssue {
  groupKey: string;
  code: "required" | "min" | "max";
  label: string;
  count?: number;
}

/** Validate selections client-side with machine codes (copy lives in copy.ts). */
export function validateSelections(groups: SouqOptionGroup[], selections: SouqSelections, quantity = 1): SouqSelectionIssue[] {
  const issues: SouqSelectionIssue[] = [];
  for (const group of groups) {
    const chosen = selectedValues(selections, group);
    if (group.selectionMode === "single") {
      if (group.required && chosen.length === 0) issues.push({ groupKey: group.key, code: "required", label: group.label });
      continue;
    }
    if (group.selectionCountMode === "order_quantity") {
      const expected = Math.max(1, quantity);
      if (chosen.length < expected) issues.push({ groupKey: group.key, code: "min", label: group.label, count: expected });
      else if (chosen.length > expected) issues.push({ groupKey: group.key, code: "max", label: group.label, count: expected });
      continue;
    }
    if (group.required && chosen.length < Math.max(1, group.minSelections)) {
      issues.push({ groupKey: group.key, code: "min", label: group.label, count: Math.max(1, group.minSelections) });
      continue;
    }
    if (!group.required && group.minSelections > 0 && chosen.length > 0 && chosen.length < group.minSelections) {
      issues.push({ groupKey: group.key, code: "min", label: group.label, count: group.minSelections });
      continue;
    }
    if (group.maxSelections !== null && chosen.length > group.maxSelections) {
      issues.push({ groupKey: group.key, code: "max", label: group.label, count: group.maxSelections });
    }
  }
  return issues;
}

/** Add-on lines (product + quantity 1) produced by multiple-choice groups. */
export interface SouqAddOnLine {
  productId: string;
  label: string;
  priceCents: number;
}

export function resolveAddOnLines(groups: SouqOptionGroup[], selections: SouqSelections): SouqAddOnLine[] {
  const lines: SouqAddOnLine[] = [];
  for (const group of groups) {
    if (group.selectionMode !== "multiple") continue;
    for (const value of selectedValues(selections, group)) {
      const definition = group.values.find((v) => v.value === value);
      if (!definition?.addonProductId || definition.addonPriceCents === null) continue;
      lines.push({
        productId: definition.addonProductId,
        label: definition.label,
        priceCents: definition.addonPriceCents,
      });
    }
  }
  return lines;
}

/** Informational selections (no add-on product) — never silently dropped. */
export function resolveInformationalSelections(
  groups: SouqOptionGroup[],
  selections: SouqSelections,
): Array<{ groupLabel: string; value: string }> {
  const out: Array<{ groupLabel: string; value: string }> = [];
  for (const group of groups) {
    for (const value of selectedValues(selections, group)) {
      const definition = group.values.find((v) => v.value === value);
      if (definition?.informational) out.push({ groupLabel: group.label, value: definition.label });
    }
  }
  return out;
}

/** Human summary of a selection, used on variant chips and the sticky CTA. */
export function selectionSummary(groups: SouqOptionGroup[], selections: SouqSelections): string {
  return groups
    .flatMap((group) => {
      if (group.selectionMode === "multiple") {
        return [];
      }
      return selectedValues(selections, group);
    })
    .filter(Boolean)
    .join(" • ");
}

/** Is at least one value of a single group still orderable? */
export function hasAvailableValue(group: SouqOptionGroup, variants: SouqVariantInput[]): boolean {
  if (group.selectionMode !== "single" || !group.optionKey) return group.values.some((v) => !v.disabled);
  const key = norm(group.optionKey);
  return variants.some((variant) => {
    if (variant.is_active === false || variant.stock <= 0) return false;
    const value = variantOptionMap(variant).get(key);
    return value ? group.values.some((v) => !v.disabled && norm(v.value) === value) : false;
  });
}
