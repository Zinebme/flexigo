/**
 * NOOR — isolated beauty design system tokens.
 *
 * The palette follows the NOOR art direction: warm white, blush, soft nude,
 * dusty rose, sage and a deep plum/cocoa ink, with a restrained gold accent.
 * Shades are tuned for text contrast while staying soft and luminous.
 *
 * The `--souq-*` aliases are exposed so the shared, secure COD / variant
 * business widgets (rendered inside the NOOR shell) pick up NOOR's skin —
 * the surrounding `noor.css` supplies their visual treatment.
 */
import type { CSSProperties } from "react";

export interface NoorThemeInput {
  primary_color?: string | null;
  secondary_color?: string | null;
  background_color?: string | null;
}

export const NOOR_DEFAULTS = {
  /** Warm white page background. */
  bg: "#FFFDFC",
  /** Blush tinted surfaces. */
  blush: "#F6E8E6",
  /** Soft nude — image wells and hairlines. */
  nude: "#E9D6CF",
  /** Dusty rose — soft accent / selected outlines. */
  rose: "#C78F8B",
  /** Deepened rose for small text on light (accessible). */
  roseDeep: "#A96A66",
  /** Sage — fresh secondary accent. */
  sage: "#A7B7A0",
  /** Deepened sage for success / in-stock text. */
  sageDeep: "#55684E",
  /** Deep plum / cocoa — primary action + ink headings. */
  plum: "#4B3538",
  /** Darker plum for hover. */
  plumDeep: "#372529",
  /** Soft gold accent. */
  gold: "#C5A26B",
  /** Body text ink. */
  ink: "#362A2E",
  /** Secondary / muted text. */
  muted: "#7C6B70",
  /** Cards. */
  white: "#FFFFFF",
  /** Hairlines. */
  border: "#EEDFD9",
  /** Form error. */
  danger: "#9B3D35",
} as const;

function color(value: string | null | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/** CSS custom properties applied on the NOOR root element. */
export function noorCssVars(theme?: NoorThemeInput | null): CSSProperties {
  const plum = color(theme?.primary_color, NOOR_DEFAULTS.plum);
  const gold = color(theme?.secondary_color, NOOR_DEFAULTS.gold);
  const bg = color(theme?.background_color, NOOR_DEFAULTS.bg);
  return {
    ["--noor-bg" as string]: bg,
    ["--noor-blush" as string]: NOOR_DEFAULTS.blush,
    ["--noor-nude" as string]: NOOR_DEFAULTS.nude,
    ["--noor-rose" as string]: NOOR_DEFAULTS.rose,
    ["--noor-rose-deep" as string]: NOOR_DEFAULTS.roseDeep,
    ["--noor-sage" as string]: NOOR_DEFAULTS.sage,
    ["--noor-sage-deep" as string]: NOOR_DEFAULTS.sageDeep,
    ["--noor-plum" as string]: plum,
    ["--noor-plum-deep" as string]: NOOR_DEFAULTS.plumDeep,
    ["--noor-gold" as string]: gold,
    ["--noor-ink" as string]: NOOR_DEFAULTS.ink,
    ["--noor-muted" as string]: NOOR_DEFAULTS.muted,
    ["--noor-white" as string]: NOOR_DEFAULTS.white,
    ["--noor-border" as string]: NOOR_DEFAULTS.border,
    ["--noor-danger" as string]: NOOR_DEFAULTS.danger,
    // Spacing / geometry
    ["--noor-space-xs" as string]: "8px",
    ["--noor-space-md" as string]: "16px",
    ["--noor-radius-control" as string]: "18px",
    ["--noor-radius-card" as string]: "24px",
    ["--noor-radius-chip" as string]: "999px",
    ["--noor-shadow-soft" as string]: "0 16px 44px -30px rgb(75 53 56 / .25)",
    ["--noor-shadow-float" as string]: "0 8px 22px rgb(54 42 46 / .12)",
    ["--noor-motion-fast" as string]: "160ms",
    ["--noor-motion-base" as string]: "240ms",
    ["--noor-ease" as string]: "cubic-bezier(.2,.75,.2,1)",
    // Aliases consumed by the shared, secure option/checkout widgets so the
    // NOOR CSS can re-skin them without touching shared markup.
    ["--souq-primary" as string]: plum,
    ["--souq-primary-soft" as string]: NOOR_DEFAULTS.blush,
    ["--souq-accent" as string]: NOOR_DEFAULTS.rose,
    ["--souq-accent-text" as string]: NOOR_DEFAULTS.plum,
    ["--souq-accent-soft" as string]: NOOR_DEFAULTS.blush,
    ["--souq-accent-hover" as string]: NOOR_DEFAULTS.roseDeep,
    ["--souq-surface" as string]: bg,
    ["--souq-card" as string]: NOOR_DEFAULTS.white,
    ["--souq-ink" as string]: NOOR_DEFAULTS.ink,
    ["--souq-muted" as string]: NOOR_DEFAULTS.muted,
    ["--souq-border" as string]: NOOR_DEFAULTS.border,
    ["--souq-success" as string]: NOOR_DEFAULTS.sageDeep,
    ["--souq-danger" as string]: NOOR_DEFAULTS.danger,
    ["--souq-radius-card" as string]: "24px",
    ["--souq-radius-control" as string]: "18px",
  };
}
