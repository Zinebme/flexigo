import { err } from "../errors";
import { supabaseOverrides } from "./preview-override";

/**
 * Environment access for Supabase configuration.
 * Throws a friendly AppError when misconfigured so pages can render a
 * clear setup screen instead of an opaque 500.
 */
export function supabaseConfig(): { url: string; anonKey: string } {
  // Preview harness (development only): the in-memory client never performs a
  // network call, so placeholder credentials are enough to satisfy callers.
  if (supabaseOverrides()) return { url: "http://preview.local", anonKey: "preview-override" };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || anonKey.includes("placeholder")) {
    throw err(
      "CONFIG_MISSING",
      "La connexion à Supabase n'est pas configurée. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.",
    );
  }
  return { url, anonKey };
}

/** Service role key — SERVER ONLY. Never expose, never prefix NEXT_PUBLIC_. */
export function serviceRoleKey(): string {
  if (supabaseOverrides()) return "preview-override";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.includes("placeholder")) {
    throw err(
      "CONFIG_MISSING",
      "La clé de service n'est pas configurée (SUPABASE_SERVICE_ROLE_KEY). Cette opération requiert l'accès serveur.",
    );
  }
  return key;
}

/** Whether Supabase is configured at all (used to render setup screens). */
export function isSupabaseConfigured(): boolean {
  if (supabaseOverrides()) return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!anonKey && !anonKey.includes("placeholder");
}
