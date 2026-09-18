import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { MERCHANT_ROLES } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Change a member's role (capability: team.manage).
 * - The OWNER role of the current owner cannot be changed (ownership is stable).
 * - Only merchant roles exist here — SUPER_ADMIN is unreachable by design.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "team.manage");

    const body = z.object({ role: z.enum(MERCHANT_ROLES) }).parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: member, error: memError } = await admin
      .from("store_members")
      .select("*")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (memError) throw memError;
    if (!member) throw err("NOT_FOUND", "Membre introuvable");

    if (member.role === "OWNER") {
      throw err("FORBIDDEN", "Le rôle du propriétaire ne peut pas être modifié.");
    }

    const { error } = await admin.from("store_members").update({ role: body.role }).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "team.member_role_changed",
      entity: "store_member",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { user_id: member.user_id, from: member.role, to: body.role },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/**
 * Remove a member (revoke — soft, keeps history) (capability: team.manage).
 * - The owner cannot be removed.
 * - A member cannot remove themselves (prevents lockout of a single-owner store).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "team.manage");

    const admin = getAdminSupabase();
    const { data: member, error: memError } = await admin
      .from("store_members")
      .select("*")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (memError) throw memError;
    if (!member) throw err("NOT_FOUND", "Membre introuvable");

    if (member.role === "OWNER") {
      throw err("FORBIDDEN", "Le propriétaire ne peut pas être retiré du site.");
    }
    if (member.user_id === ctx.user.id) {
      throw err("FORBIDDEN", "Vous ne pouvez pas vous retirer vous-même (le site doit garder un gestionnaire).");
    }

    const { error } = await admin.from("store_members").update({ status: "revoked" }).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "team.member_removed",
      entity: "store_member",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { user_id: member.user_id, role: member.role },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
