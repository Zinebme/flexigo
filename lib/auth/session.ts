/**
 * Session helpers.
 *
 * Authentication (who are you?) and authorization (what may you do?) are
 * always handled separately:
 * - `getSessionUser` only resolves the Supabase Auth user.
 * - `getMerchantContext` / `getAdminContext` perform authorization against
 *   store_members / platform_admins and the support-session model.
 */
import type { User } from "@supabase/supabase-js";
import { getServerSupabase } from "../supabase/server";
import { getAdminSupabase } from "../supabase/admin";
import type { ProfileRow } from "../supabase/database.types";
import { err } from "../errors";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw err("CONFIG_MISSING", "Service d'authentification indisponible.");
  return data.user;
}

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw err("UNAUTHORIZED", "Veuillez vous connecter pour continuer.");
  return user;
}

/** Load a profile row (service client — profiles RLS already blocks cross-user reads). */
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw err("UPSTREAM_ERROR", "Impossible de charger le profil.");
  return data;
}

export async function ensureProfile(user: User): Promise<ProfileRow> {
  let profile = await getProfile(user.id);
  if (!profile) {
    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string) ?? null,
      })
      .select()
      .single();
    if (error) throw err("UPSTREAM_ERROR", "Impossible de créer le profil.");
    profile = data;
  }
  return profile;
}
