/**
 * Anonymous Supabase client for SERVER-SIDE public storefront reads.
 *
 * The storefront has no customer accounts: public catalog/page reads run as
 * the `anon` role so RLS public policies apply exactly as in the browser.
 * Never use this client for writes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseConfig } from "./config";

let client: SupabaseClient<Database> | null = null;

export function getAnonSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const { url, anonKey } = supabaseConfig();
  client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
