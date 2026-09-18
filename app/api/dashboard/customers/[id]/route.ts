import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email("Email invalide").max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

/**
 * Update a customer's contact/notes (capability: customers.manage).
 * Identity fields (name/phone) come from orders — never edited here,
 * to keep the normalized-phone matching intact.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "customers.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = bodySchema.parse(body);
    const admin = getAdminSupabase();

    const { data: current, error: curError } = await admin
      .from("customers")
      .select("id")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (curError) throw curError;
    if (!current) throw err("NOT_FOUND", "Client introuvable");

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.email !== undefined) patch.email = input.email || null;
    if (input.notes !== undefined) patch.notes = input.notes || null;

    const { error } = await admin.from("customers").update(patch).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "customer.updated",
      entity: "customer",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { fields: Object.keys(patch) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
