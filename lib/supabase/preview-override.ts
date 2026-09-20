/**
 * Preview-only Supabase overrides (development harness).
 *
 * FlexiGo has no demo mode in production: the storefront always reads the real
 * tenant data through RLS. To let reviewers look at a template in an
 * environment without Supabase credentials, `next dev` can be started with
 * `FLEXIGO_PREVIEW=1`, which registers an in-memory client here
 * (`instrumentation.ts` → `lib/preview/souq-demo.ts`).
 *
 * The registry is intentionally inert: nothing is registered unless that
 * environment variable is set at boot, and the storefront falls back to the
 * real client in every other case — including production builds.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface SupabaseOverrides {
  anon: SupabaseClient<Database>;
  admin: SupabaseClient<Database>;
}

const KEY = "__flexigoSupabaseOverrides";

type OverrideHolder = typeof globalThis & { [KEY]?: SupabaseOverrides | null };

/** The registered override, or null when running against the real backend. */
export function supabaseOverrides(): SupabaseOverrides | null {
  return (globalThis as OverrideHolder)[KEY] ?? null;
}

/** Used by the preview harness only. */
export function setSupabaseOverrides(next: SupabaseOverrides | null): void {
  (globalThis as OverrideHolder)[KEY] = next;
}
