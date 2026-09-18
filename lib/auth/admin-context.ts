/**
 * Super Admin / platform authorization context.
 *
 * Platform roles live in platform_admins (separate from store_members).
 * There is NO RLS policy on platform_admins — client sessions can never
 * read or write it. All privileged operations run through server-side route
 * handlers that first resolve this context with the service-role client.
 */
import type { User } from "@supabase/supabase-js";
import { getAdminSupabase } from "../supabase/admin";
import { getSessionUser } from "./session";
import type { ProfileRow } from "../supabase/database.types";
import { err } from "../errors";
import type { PlatformRole } from "../types";

export type AdminContext = {
  user: User;
  profile: ProfileRow | null;
  role: PlatformRole;
};

export async function getAdminContext(): Promise<AdminContext> {
  const user = await getSessionUser();
  if (!user) throw err("UNAUTHORIZED", "Veuillez vous connecter.");

  const admin = getAdminSupabase();
  const { data } = await admin
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    throw err("FORBIDDEN", "Accès réservé à l'administration de la plateforme.");
  }

  let profile: ProfileRow | null = null;
  const { data: p } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (p) profile = p;

  return { user, profile, role: data.role as PlatformRole };
}

/** Restrict an operation to SUPER_ADMIN (STAFF has limited read access). */
export function requireSuperAdmin(ctx: AdminContext): void {
  if (ctx.role !== "SUPER_ADMIN") {
    throw err("FORBIDDEN", "Cette opération requiert le rôle SUPER_ADMIN.");
  }
}
