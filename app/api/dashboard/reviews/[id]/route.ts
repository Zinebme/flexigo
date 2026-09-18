import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({ is_approved: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");
    const input = patchSchema.parse(await req.json().catch(() => null));

    const admin = getAdminSupabase();
    const { data: review } = await admin.from("reviews").select("id, store_id").eq("id", id).eq("store_id", ctx.store.id).maybeSingle();
    if (!review) throw err("NOT_FOUND", "Avis introuvable");

    const { error } = await admin.from("reviews").update({ is_approved: input.is_approved, updated_at: new Date().toISOString() } as never).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "review.moderated",
      entity: "review",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { is_approved: input.is_approved },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");

    const admin = getAdminSupabase();
    const { data: review } = await admin.from("reviews").select("id, store_id").eq("id", id).eq("store_id", ctx.store.id).maybeSingle();
    if (!review) throw err("NOT_FOUND", "Avis introuvable");

    const { error } = await admin.from("reviews").update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "review.moderated",
      entity: "review",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { deleted: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
