import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { storeStatusSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Change a store's lifecycle status (SUPER_ADMIN only): publish (draft →
 * active), suspend, reactivate, archive (soft — deleted_at stays null and
 * the store is hidden). The exact requested status is applied; the UI only
 * offers sensible transitions. Always audited.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();

    const input = storeStatusSchema.parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("id, name, status")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (storeError) throw storeError;
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const current = store.status as string;
    if (current === input.status) throw err("VALIDATION", "Le site est déjà dans cet état.");
    const nextStatus = input.status;

    const { error } = await admin
      .from("stores")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    await logAudit({
      actorId: ctx.user.id,
      storeId: id,
      action: "store.status_changed",
      entity: "store",
      entityId: id,
      metadata: { name: store.name, from: current, to: nextStatus, by: "platform_admin" },
    });

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (e) {
    return toErrorResponse(e);
  }
}
