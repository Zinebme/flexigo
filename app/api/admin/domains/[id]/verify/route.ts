import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/domains/[id]/verify — marque le domaine comme vérifié (placeholder).
 * En production, on vérifierait le DNS / un fichier .well-known.
 * Ici on marque verified et on log.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const admin = getAdminSupabase();

    const { data: domain } = await admin.from("domains").select("*").eq("id", id).maybeSingle();
    if (!domain) throw err("NOT_FOUND", "Domaine introuvable");

    // TODO real DNS check — for now mark verified (admin explicitly confirms)
    const { error } = await admin.from("domains").update({ status: "verified" } as never).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: (domain as { store_id: string }).store_id,
      action: "domain.verified",
      entity: "domain",
      entityId: id,
      metadata: { hostname: (domain as { hostname: string }).hostname },
    });

    return NextResponse.json({ ok: true, status: "verified" });
  } catch (e) {
    return toErrorResponse(e);
  }
}
