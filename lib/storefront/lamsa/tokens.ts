import type { CSSProperties } from "react";

export interface LamsaThemeInput {
  primary_color?: string | null;
  secondary_color?: string | null;
  background_color?: string | null;
}

export const LAMSA_DEFAULTS = {
  ivory: "#FAF7F2",
  beige: "#E7DDD1",
  taupe: "#9D8C7B",
  chocolate: "#4A382F",
  ink: "#22201E",
  gold: "#B79B6C",
  white: "#FFFDF9",
  muted: "#756A63",
  border: "#DDD2C6",
} as const;

function color(value: string | null | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function lamsaCssVars(theme?: LamsaThemeInput | null): CSSProperties {
  const chocolate = color(theme?.primary_color, LAMSA_DEFAULTS.chocolate);
  const gold = color(theme?.secondary_color, LAMSA_DEFAULTS.gold);
  const ivory = color(theme?.background_color, LAMSA_DEFAULTS.ivory);
  return {
    ["--lamsa-ivory" as string]: ivory,
    ["--lamsa-beige" as string]: LAMSA_DEFAULTS.beige,
    ["--lamsa-taupe" as string]: LAMSA_DEFAULTS.taupe,
    ["--lamsa-chocolate" as string]: chocolate,
    ["--lamsa-ink" as string]: LAMSA_DEFAULTS.ink,
    ["--lamsa-gold" as string]: gold,
    ["--lamsa-white" as string]: LAMSA_DEFAULTS.white,
    ["--lamsa-muted" as string]: LAMSA_DEFAULTS.muted,
    ["--lamsa-border" as string]: LAMSA_DEFAULTS.border,
    ["--lamsa-space-xs" as string]: "8px",
    ["--lamsa-space-md" as string]: "16px",
    ["--lamsa-radius-control" as string]: "12px",
    ["--lamsa-radius-card" as string]: "22px",
    ["--lamsa-shadow-soft" as string]: "0 14px 42px -32px rgb(74 56 47 / .28)",
    ["--lamsa-shadow-float" as string]: "0 7px 20px rgb(34 32 30 / .13)",
    ["--lamsa-motion-fast" as string]: "160ms",
    ["--lamsa-motion-base" as string]: "220ms",
    ["--lamsa-ease" as string]: "cubic-bezier(.2,.75,.2,1)",
    // Aliases consumed by the shared, secure option/checkout widgets. The
    // surrounding LAMSA CSS supplies their own visual treatment.
    ["--souq-primary" as string]: chocolate,
    ["--souq-primary-soft" as string]: LAMSA_DEFAULTS.beige,
    ["--souq-accent" as string]: gold,
    ["--souq-accent-text" as string]: LAMSA_DEFAULTS.ink,
    ["--souq-accent-soft" as string]: "#F1EADF",
    ["--souq-accent-hover" as string]: "#A98C5D",
    ["--souq-surface" as string]: ivory,
    ["--souq-card" as string]: LAMSA_DEFAULTS.white,
    ["--souq-ink" as string]: LAMSA_DEFAULTS.ink,
    ["--souq-muted" as string]: LAMSA_DEFAULTS.muted,
    ["--souq-border" as string]: LAMSA_DEFAULTS.border,
    ["--souq-success" as string]: "#536B58",
    ["--souq-danger" as string]: "#9B3D35",
    ["--souq-radius-card" as string]: "22px",
    ["--souq-radius-control" as string]: "14px",
  };
}
