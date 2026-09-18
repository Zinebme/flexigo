import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { PAGE_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * List published versions of a page (capability: content.manage).
 * NOTE: restoring a version is a SUPER-ADMIN action only (advanced admin),
 * so this route is read-only for merchants.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    if (!PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number])) throw err("NOT_FOUND", "Page inconnue");

    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");

    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from("page_versions")
      .select("id, version, published_by, created_at")
      .eq("store_id", ctx.store.id)
      .eq("page_key", key)
      .order("version", { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      versions: (data ?? []).map((v) => ({
        id: v.id,
        version: v.version,
        published_by: v.published_by,
        created_at: v.created_at,
      })),
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
