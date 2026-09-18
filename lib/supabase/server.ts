/**
 * Per-request Supabase client for server components and route handlers.
 * Uses the visitor's session cookies, so every query is bound to the
 * authenticated user (or anonymous) — RLS applies automatically.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseConfig } from "./config";

export async function getServerSupabase(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = supabaseConfig();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore when the
          // middleware refreshes the session cookie.
        }
      },
    },
  });
}
