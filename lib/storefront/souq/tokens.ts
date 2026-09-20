/**
 * SOUQ — visual tokens (template-specific, additive).
 *
 * SOUQ is the flagship Arabic-first (RTL) Algerian COD storefront template.
 * Its identity: light slate canvas (#F8FAFC), deep navy structure, warm amber
 * accent used strategically (offers, CTA, price, delivery highlights).
 *
 * Tokens are DERIVED from the merchant's theme (colors chosen in the dashboard)
 * and fall back to the SOUQ defaults, so a merchant can recolor the store
 * without ever breaking contrast. Nothing here mutates other templates.
 */

export const SOUQ_DEFAULTS = {
  primary: "#0f2a47", // deep navy — structure, header, prices
  accent: "#f59e0b", // warm amber — CTA, offers, discounts
  surface: "#f8fafc", // page canvas
  card: "#ffffff",
  ink: "#1e293b", // charcoal text
  muted: "#64748b",
  border: "#e2e8f0",
  success: "#047857",
  danger: "#dc2626",
  radiusCard: "18px",
  radiusControl: "14px",
} as const;

export interface SouqPalette {
  primary: string;
  primarySoft: string;
  accent: string;
  accentText: string;
  surface: string;
  card: string;
  ink: string;
  muted: string;
  border: string;
  success: string;
  danger: string;
  radiusCard: string;
  radiusControl: string;
}

/** Normalize #rgb / #rrggbb; returns null when unparseable. */
export function parseHexColor(value: string | null | undefined): { r: number; g: number; b: number } | null {
  if (!value) return null;
  const raw = value.trim().replace(/^#/, "");
  const hex = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const part = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Relative luminance (WCAG) — drives automatic readable text colors. */
export function luminance(color: string): number {
  const rgb = parseHexColor(color);
  if (!rgb) return 0;
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * Pick a readable foreground for a background color.
 * Keeps the amber CTA legible even if a merchant picks a pale accent.
 */
export function readableOn(background: string): string {
  return luminance(background) > 0.55 ? "#0b1b2b" : "#ffffff";
}

/** Mix a color toward white (amount 0..1) — used for soft tints. */
export function tint(color: string, amount: number): string {
  const rgb = parseHexColor(color);
  if (!rgb) return "#f1f5f9";
  const a = Math.max(0, Math.min(1, amount));
  return toHex({
    r: rgb.r + (255 - rgb.r) * a,
    g: rgb.g + (255 - rgb.g) * a,
    b: rgb.b + (255 - rgb.b) * a,
  });
}

/** Shrink toward near-black (amount 0..1) — used for hovers. */
export function shade(color: string, amount: number): string {
  const rgb = parseHexColor(color);
  if (!rgb) return "#0f172a";
  const a = Math.max(0, Math.min(1, amount));
  return toHex({ r: rgb.r * (1 - a), g: rgb.g * (1 - a), b: rgb.b * (1 - a) });
}

export interface SouqThemeInput {
  primary_color?: string | null;
  secondary_color?: string | null;
  background_color?: string | null;
}

/**
 * Resolve the SOUQ palette from a store theme.
 * Unknown / missing colors fall back to the SOUQ identity (never to another
 * template's palette).
 */
export function souqPalette(theme?: SouqThemeInput | null): SouqPalette {
  const primary = parseHexColor(theme?.primary_color) ? (theme?.primary_color as string) : SOUQ_DEFAULTS.primary;
  const accent = parseHexColor(theme?.secondary_color) ? (theme?.secondary_color as string) : SOUQ_DEFAULTS.accent;
  const surface = parseHexColor(theme?.background_color) ? (theme?.background_color as string) : SOUQ_DEFAULTS.surface;
  return {
    primary,
    primarySoft: tint(primary, 0.92),
    accent,
    accentText: readableOn(accent),
    surface,
    card: SOUQ_DEFAULTS.card,
    ink: SOUQ_DEFAULTS.ink,
    muted: SOUQ_DEFAULTS.muted,
    border: SOUQ_DEFAULTS.border,
    success: SOUQ_DEFAULTS.success,
    danger: SOUQ_DEFAULTS.danger,
    radiusCard: SOUQ_DEFAULTS.radiusCard,
    radiusControl: SOUQ_DEFAULTS.radiusControl,
  };
}

/** CSS custom properties injected once on the SOUQ root element. */
export function souqCssVars(palette: SouqPalette): Record<string, string> {
  return {
    "--souq-primary": palette.primary,
    "--souq-primary-soft": palette.primarySoft,
    "--souq-accent": palette.accent,
    "--souq-accent-text": palette.accentText,
    "--souq-accent-soft": tint(palette.accent, 0.88),
    "--souq-accent-hover": shade(palette.accent, 0.12),
    "--souq-surface": palette.surface,
    "--souq-card": palette.card,
    "--souq-ink": palette.ink,
    "--souq-muted": palette.muted,
    "--souq-border": palette.border,
    "--souq-success": palette.success,
    "--souq-danger": palette.danger,
    "--souq-radius-card": palette.radiusCard,
    "--souq-radius-control": palette.radiusControl,
    // Keeps the legacy --fx-primary variable coherent inside SOUQ surfaces.
    "--fx-primary": palette.primary,
    "--fx-secondary": palette.accent,
  };
}
