/**
 * Super Admin (platform) authorization context.
 *
 * Auth ≠ authorization: being a logged-in user is NOT enough. Access to
 * /admin requires a row in platform_admins (SUPER_ADMIN) — a table with NO
 * RLS policy, readable here only with the service role. Merchant roles can
 * never grant or hold platform roles.
 */
import { getServerSupabase } from "../supabase/server";
import { getAdminSupabase } from "../supabase/admin";
import { err } from "../errors";
import type { User } from "@supabase/supabase-js";
import type { ProfileRow } from "../supabase/database.types";

export type AdminRole = "SUPER_ADMIN" | "STAFF";

export type AdminContext = {
  user: User;
  profile: ProfileRow;
  role: AdminRole;
};

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await getServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw err("UNAUTHORIZED", "Veuillez vous connecter.");
  const user = userData.user;

  const admin = getAdminSupabase();

  let profile = (await admin.from("profiles").select("*").eq("id", user.id).maybeSingle()).data as ProfileRow | null;
  if (!profile) {
    // Auto-provision profile for platform accounts (same rule as merchant flow).
    const { data: created, error: insError } = await admin
      .from("profiles")
      .insert({ id: user.id, email: user.email })
      .select()
      .single();
    if (insError || !created) throw err("UPSTREAM_ERROR", "Profil indisponible.");
    profile = created as ProfileRow;
  }

  const { data: pa } = await admin
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!pa || pa.role !== "SUPER_ADMIN") {
    throw err("FORBIDDEN", "Accès réservé à l'administrateur de la plateforme.");
  }

  return { user, profile, role: "SUPER_ADMIN" };
}

export const SUPPORT_COOKIE = "fx_support_session";

export const STORE_COOKIE = "fx_store";

/** True if the logged-in user is a platform SUPER_ADMIN. */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data: pa } = await admin.from("platform_admins").select("role").eq("user_id", userId).maybeSingle();
  return pa?.role === "SUPER_ADMIN";
}

