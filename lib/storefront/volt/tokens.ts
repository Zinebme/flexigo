import type { CSSProperties } from "react";

export const VOLT_COLORS = {
  bg: "#F7FAFF",
  surface: "#FFFFFF",
  surface2: "#EEF4FF",
  border: "#D9E4F5",
  ink: "#14213D",
  muted: "#65748B",
  cyan: "#2EC4B6",
  cyan2: "#62D9D0",
  blue: "#4C6FFF",
  amber: "#F4B740",
  success: "#22A06B",
  danger: "#D64545",
} as const;

export function voltCssVars(): CSSProperties {
  return {
    ["--volt-bg" as string]: VOLT_COLORS.bg,
    ["--volt-surface" as string]: VOLT_COLORS.surface,
    ["--volt-surface-2" as string]: VOLT_COLORS.surface2,
    ["--volt-border" as string]: VOLT_COLORS.border,
    ["--volt-ink" as string]: VOLT_COLORS.ink,
    ["--volt-muted" as string]: VOLT_COLORS.muted,
    ["--volt-cyan" as string]: VOLT_COLORS.cyan,
    ["--volt-cyan-2" as string]: VOLT_COLORS.cyan2,
    ["--volt-blue" as string]: VOLT_COLORS.blue,
    ["--volt-amber" as string]: VOLT_COLORS.amber,
    ["--volt-success" as string]: VOLT_COLORS.success,
    ["--volt-danger" as string]: VOLT_COLORS.danger,
  };
}
