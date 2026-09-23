/**
 * Merchant (tenant) authorization context.
 *
 * Every merchant dashboard request resolves this context, which proves:
 *  1. the user is authenticated (Supabase Auth),
 *  2. the user is a member of the selected store via store_members
 *     (membership model — NOT a single store_id on the profile),
 *  3. or the user is a Super Admin with an OPEN, logged support session
 *     for that store (silent support access — fully audited).
 *
 * The cookie only carries a pointer (store id / session id); it is always
 * re-validated against the database on every request.
 */
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { getAdminSupabase } from "../supabase/admin";
import { getServerSupabase } from "../supabase/server";
import type {
  ProfileRow,
  StoreMemberRow,
  StoreRow,
  SupportSessionRow,
} from "../supabase/database.types";
import { err } from "../errors";
import { can, type Capability, type MerchantRole } from "../types";

export const STORE_COOKIE = "fx_store";
export const SUPPORT_COOKIE = "fx_support_session";

export type MerchantContext = {
  user: User;
  profile: ProfileRow;
  store: StoreRow;
  membership: StoreMemberRow | null;
  /** All stores this user belongs to (store switcher). */
  memberships: StoreMemberRow[];
  role: MerchantRole;
  mode: "normal" | "support";
  supportSession: SupportSessionRow | null;
};

export async function getMerchantContext(): Promise<MerchantContext> {
  const admin = getAdminSupabase();
  const cookieStore = await cookies();

  // 1. Authentication
  const supabase = await getServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw err("UNAUTHORIZED", "Veuillez vous connecter.");
  const user = userData.user;

  // 2. Profile
  let profile = await (async () => {
    const { data } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return data;
  })();
  if (!profile) {
    const { data, error } = await admin
      .from("profiles")
      .insert({ id: user.id, email: user.email })
      .select()
      .single();
    if (error) throw err("UPSTREAM_ERROR", "Profil indisponible.");
    profile = data;
  }

  const cookieStore2 = cookieStore;

  // 3. Support impersonation (Super Admin only — verified server-side).
  const supportCookie = cookieStore2.get(SUPPORT_COOKIE)?.value ?? null;
  let supportSession: SupportSessionRow | null = null;
  let storeId: string | null = null;

  if (supportCookie) {
    const { data } = await admin
      .from("support_sessions")
      .select("*")
      .eq("id", supportCookie)
      .eq("admin_user_id", user.id)
      .is("ended_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (data) {
      // Only platform admins may hold support sessions (defense in depth).
      const { data: pa } = await admin
        .from("platform_admins")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (pa?.role === "SUPER_ADMIN") {
        supportSession = data;
        storeId = data.store_id;
      }
    }
  }

  // 4. Membership resolution (normal mode).
  const { data: memberships } = await admin
    .from("store_members")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: true });
  const activeMemberships = (memberships ?? []).filter((m) => m.store_id);

  if (!storeId) {
    const cookieStoreId = cookieStore2.get(STORE_COOKIE)?.value;
    if (cookieStoreId && activeMemberships.some((m) => m.store_id === cookieStoreId)) {
      storeId = cookieStoreId;
    } else if (activeMemberships.length > 0) {
      storeId = activeMemberships[0]!.store_id;
    }
  }

  if (!storeId) {
    throw err(
      "FORBIDDEN",
      "Vous n'êtes rattaché à aucun site. Contactez votre administrateur pour obtenir un accès.",
    );
  }

  // 5. Re-validate store access against the database (never trust the cookie).
  if (supportSession) {
    // support: session store is authoritative
  } else {
    const membership = activeMemberships.find((m) => m.store_id === storeId);
    if (!membership) {
      throw err("FORBIDDEN", "Vous n'avez pas accès à ce site.");
    }
  }

  const { data: store } = await admin
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!store) throw err("NOT_FOUND", "Ce site n'existe pas.");
  if (!supportSession && store.organization_id) {
    const { data: organization } = await admin
      .from("organizations")
      .select("status")
      .eq("id", store.organization_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!organization || organization.status === "suspended") {
      throw err("STORE_SUSPENDED", "Ce compte client est suspendu. Contactez votre administrateur.");
    }
  }
  if (store.status === "archived") {
    throw err("FORBIDDEN", "Ce site est archivé. Contactez votre administrateur.");
  }

  const membership = supportSession
    ? null
    : activeMemberships.find((m) => m.store_id === storeId) ?? null;

  const role: MerchantRole = supportSession ? "MANAGER" : membership!.role;

  return {
    user,
    profile,
    store,
    membership,
    memberships: activeMemberships,
    role,
    mode: supportSession ? "support" : "normal",
    supportSession,
  };
}

/**
 * Capability check for a merchant context.
 * Support sessions can operate the store (orders, content, publishing) but
 * never manage the team or the store's settings/identity — and every action
 * is recorded in the audit log with the support session id.
 */
export function requireCapability(ctx: MerchantContext, capability: Capability): void {
  if (ctx.mode === "support") {
    const blocked: Capability[] = ["team.manage", "settings.manage"];
    if (blocked.includes(capability)) {
      throw err("FORBIDDEN", "Cette action n'est pas disponible en mode assistance.");
    }
    return;
  }
  if (!can(ctx.role, capability)) {
    throw err(
      "FORBIDDEN",
      `Votre rôle (${roleLabelFr(ctx.role)}) ne permet pas cette action.`,
    );
  }
}

export function roleLabelFr(role: MerchantRole): string {
  switch (role) {
    case "OWNER":
      return "Propriétaire";
    case "MANAGER":
      return "Manager";
    case "ORDER_MANAGER":
      return "Gestionnaire de commandes";
    case "CONTENT_EDITOR":
      return "Rédacteur";
    case "VIEWER":
      return "Lecteur";
  }
}
