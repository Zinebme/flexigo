import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Soft-delete a store from the platform admin.
 * Data is intentionally preserved for recovery/audit; the storefront becomes
 * inaccessible because deleted_at is set and status is archived.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const body = z.object({ confirm_name: z.string().min(1).max(160) }).parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: store, error: readError } = await admin
      .from("stores")
      .select("id, name, slug, status")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (readError) throw readError;
    if (!store) throw err("NOT_FOUND", "Site introuvable");
    if (body.confirm_name.trim() !== store.name) throw err("VALIDATION", "Le nom de confirmation ne correspond pas au site.");

    const now = new Date().toISOString();
    const { error } = await admin
      .from("stores")
      .update({ status: "archived", deleted_at: now, updated_at: now })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: id,
      action: "store.soft_deleted",
      entity: "store",
      entityId: id,
      metadata: { name: store.name, slug: store.slug, previous_status: store.status, by: "platform_admin" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
