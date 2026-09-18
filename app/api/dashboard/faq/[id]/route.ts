import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  question: z.string().trim().min(2).max(200).optional(),
  answer: z.string().trim().min(2).max(1000).optional(),
  is_visible: z.boolean().optional(),
  position: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");
    const input = patchSchema.parse(await req.json().catch(() => null));

    const admin = getAdminSupabase();
    const { data: existing } = await admin.from("faq_items").select("id, store_id").eq("id", id).eq("store_id", ctx.store.id).maybeSingle();
    if (!existing) throw err("NOT_FOUND", "FAQ introuvable");

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.question !== undefined) patch.question = input.question;
    if (input.answer !== undefined) patch.answer = input.answer;
    if (input.is_visible !== undefined) patch.is_visible = input.is_visible;
    if (input.position !== undefined) patch.position = input.position;

    const { error } = await admin.from("faq_items").update(patch as never).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "faq.changed",
      entity: "faq",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: patch,
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
    const { data: existing } = await admin.from("faq_items").select("id, store_id").eq("id", id).eq("store_id", ctx.store.id).maybeSingle();
    if (!existing) throw err("NOT_FOUND", "FAQ introuvable");

    const { error } = await admin.from("faq_items").update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "faq.changed",
      entity: "faq",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { deleted: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
