import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { verifyDomainByDns } from "@/lib/domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/domains/[id]/verify — real DNS TXT verification. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const admin = getAdminSupabase();

    const { data: domain } = await admin.from("domains").select("*").eq("id", id).maybeSingle();
    if (!domain) throw err("NOT_FOUND", "Domaine introuvable");

    const hostname = (domain as { hostname: string }).hostname;
    const token = (domain as { verification_token: string }).verification_token;
    const check = await verifyDomainByDns(hostname, token);

    if (!check.ok) {
      await admin.from("domains").update({
        status: "pending",
        verification_data: {
          last_checked_at: new Date().toISOString(),
          last_result: "failed",
          detail: check.detail,
        },
      } as never).eq("id", id);

      return NextResponse.json(
        { ok: false, status: "pending", detail: check.detail },
        { status: 409 },
      );
    }

    const verifiedAt = new Date().toISOString();
    const { error } = await admin.from("domains").update({
      status: "verified",
      verified_at: verifiedAt,
      verification_data: {
        last_checked_at: verifiedAt,
        last_result: "verified",
      },
    } as never).eq("id", id);
    if (error) throw error;

    await logAudit({
      actorId: ctx.user.id,
      storeId: (domain as { store_id: string }).store_id,
      action: "domain.verified",
      entity: "domain",
      entityId: id,
      metadata: { hostname },
    });

    return NextResponse.json({ ok: true, status: "verified", detail: check.detail });
  } catch (e) {
    return toErrorResponse(e);
  }
}
