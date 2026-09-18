/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * This client bypasses Row Level Security. It must only ever be created in
 * server-side code (route handlers, server components, proxy) after the
 * caller has been authenticated and authorized at the application layer
 * (see lib/auth/*). Never import this file from a client component.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { serviceRoleKey, supabaseConfig } from "./config";

if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin.ts must never be imported into browser code.");
}

let client: SupabaseClient<Database> | null = null;

export function getAdminSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const { url } = supabaseConfig();
  client = createClient<Database>(url, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

/**
 * Build a Supabase client that acts on behalf of a specific user's JWT
 * (used for server-side operations that must respect the user's RLS scope,
 * e.g. reading a store's public data exactly as an anonymous visitor would).
 */
export function getSupabaseForToken(token: string): SupabaseClient<Database> {
  const { url } = supabaseConfig();
  return createClient<Database>(url, token, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
