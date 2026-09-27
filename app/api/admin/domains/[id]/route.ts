import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const body = (await req.json().catch(() => ({}))) as { is_primary?: boolean; status?: string; dns_mode?: string; hosting_ready?: boolean };
    const admin = getAdminSupabase();

    const { data: domain } = await admin.from("domains").select("*").eq("id", id).maybeSingle();
    if (!domain) throw err("NOT_FOUND", "Domaine introuvable");

    const updates: Record<string, unknown> = {};
    if (typeof body.is_primary === "boolean" && body.is_primary) {
      if ((domain as { status: string }).status !== "verified") {
        throw err("VALIDATION", "Un domaine doit être vérifié avant de devenir principal.");
      }
      const { error: clearError } = await admin.from("domains").update({ is_primary: false } as never).eq("store_id", (domain as { store_id: string }).store_id).eq("is_primary", true);
      if (clearError) throw clearError;
      updates.is_primary = true;
    }
    // "verified" can only be set by the DNS verification endpoint.
    if (body.status && ["pending", "failed"].includes(body.status)) {
      updates.status = body.status;
    }
    if (body.dns_mode === "apex" || body.dns_mode === "subdomain") {
      updates.verification_data = { ...((domain as { verification_data?: Record<string, unknown> | null }).verification_data ?? {}), dns_mode: body.dns_mode };
    }
    if (typeof body.hosting_ready === "boolean") {
      if (body.hosting_ready && (domain as { status: string }).status !== "verified") throw err("VALIDATION", "Vérifiez le TXT avant d'activer le routage.");
      updates.verification_data = { ...((domain as { verification_data?: Record<string, unknown> | null }).verification_data ?? {}), ...(updates.verification_data as object ?? {}), hosting_ready: body.hosting_ready };
    }

    if (Object.keys(updates).length === 0) throw err("VALIDATION", "Aucune mise à jour.");

    const { error } = await admin.from("domains").update(updates as never).eq("id", id);
    if (error) throw error;

    await logAudit({
      actorId: ctx.user.id,
      storeId: (domain as { store_id: string }).store_id,
      action: "domain.updated",
      entity: "domain",
      entityId: id,
      metadata: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const admin = getAdminSupabase();

    const { data: domain } = await admin.from("domains").select("*").eq("id", id).maybeSingle();
    if (!domain) throw err("NOT_FOUND", "Domaine introuvable");

    const { error } = await admin.from("domains").delete().eq("id", id);
    if (error) throw error;

    await logAudit({
      actorId: ctx.user.id,
      storeId: (domain as { store_id: string }).store_id,
      action: "domain.deleted",
      entity: "domain",
      entityId: id,
      metadata: { hostname: (domain as { hostname: string }).hostname },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
