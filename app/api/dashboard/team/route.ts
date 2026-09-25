import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { inviteSchema, parseBody } from "@/lib/schemas";
import { MERCHANT_ROLES } from "@/lib/types";
import { roleLabelFr } from "@/lib/auth/merchant-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * List the store's team (members with profile info).
 * Any member of the store can see the team list (no secrets exposed).
 */
export async function GET() {
  try {
    const ctx = await getMerchantContext();
    const admin = getAdminSupabase();

    const { data: members, error } = await admin
      .from("store_members")
      .select("*")
      .eq("store_id", ctx.store.id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const ids = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
    const { data: profiles } = ids.length > 0 ? await admin.from("profiles").select("id, email, full_name").in("id", ids) : { data: [] };

    const profMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>).map((p) => [p.id, p]));

    return NextResponse.json({
      ok: true,
      members: ((members ?? []) as Array<Record<string, unknown>>).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        created_at: m.created_at,
        email: profMap.get(m.user_id as string)?.email ?? "compte supprimé",
        full_name: profMap.get(m.user_id as string)?.full_name ?? null,
        is_self: m.user_id === ctx.user.id,
      })),
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * Invite a user by email (capability: team.manage → OWNER only).
 * The invitee must already have a Marqova account with that email (no
 * account-creation email sending is wired yet); the membership is created
 * with status `invited`, which the dashboard already resolves to an active
 * access as soon as the person logs in with their own credentials.
 * SUPER_ADMIN can NEVER be granted from the merchant side.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "team.manage");

    const input = parseBody(inviteSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: profile, error: profError } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", input.email)
      .maybeSingle();
    if (profError) throw profError;
    if (!profile) {
      throw err("NOT_FOUND", "Aucun compte Marqova avec cet email. La personne doit d'abord créer un compte, puis être invitée.");
    }

    const { data: existing } = await admin
      .from("store_members")
      .select("id, status")
      .eq("store_id", ctx.store.id)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (existing) {
      if (existing.status === "revoked") {
        // Re-invite a revoked user.
        const { error: reError } = await admin
          .from("store_members")
          .update({ role: input.role, status: "invited", invited_by: ctx.user.id })
          .eq("id", existing.id);
        if (reError) throw reError;
      } else {
        throw err("CONFLICT", "Cette personne est déjà membre de ce site.");
      }
    } else {
      const { error: insError } = await admin.from("store_members").insert({
        store_id: ctx.store.id,
        user_id: profile.id,
        role: input.role,
        status: "invited",
        invited_by: ctx.user.id,
      });
      if (insError) throw insError;
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "team.member_added",
      entity: "store_member",
      entityId: profile.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { email: input.email, role: input.role, role_fr: roleLabelFr(input.role as (typeof MERCHANT_ROLES)[number]) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
