import type { CSSProperties } from "react";

export const DAR_COLORS = {
  bg: "#F6F1E8",
  paper: "#FFFDF8",
  cream: "#EFE6D6",
  olive: "#6D7356",
  oliveDark: "#4F563E",
  terracotta: "#B86E4B",
  terracottaDark: "#8F5034",
  ink: "#2E2A25",
  muted: "#7C746C",
  border: "#DED3C2",
  sage: "#A9AF93",
  success: "#5E7A4E",
} as const;

export function darCssVars(): CSSProperties {
  return {
    ["--dar-bg" as string]: DAR_COLORS.bg,
    ["--dar-paper" as string]: DAR_COLORS.paper,
    ["--dar-cream" as string]: DAR_COLORS.cream,
    ["--dar-olive" as string]: DAR_COLORS.olive,
    ["--dar-olive-dark" as string]: DAR_COLORS.oliveDark,
    ["--dar-terracotta" as string]: DAR_COLORS.terracotta,
    ["--dar-terracotta-dark" as string]: DAR_COLORS.terracottaDark,
    ["--dar-ink" as string]: DAR_COLORS.ink,
    ["--dar-muted" as string]: DAR_COLORS.muted,
    ["--dar-border" as string]: DAR_COLORS.border,
    ["--dar-sage" as string]: DAR_COLORS.sage,
    ["--dar-success" as string]: DAR_COLORS.success,
  };
}
