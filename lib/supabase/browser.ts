/**
 * Browser Supabase client (anon key only — RLS enforces all security).
 */
import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseConfig } from "./config";

let client: SupabaseClient<Database> | null = null;

export function getBrowserSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const { url, anonKey } = supabaseConfig();
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
