import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { PAGE_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; key: string }> }) {
  try {
    const { id: storeId, key } = await params;
    if (!PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number])) throw err("NOT_FOUND", "Page inconnue");
    const ctx = await getAdminContext();
    const admin = getAdminSupabase();

    const { data: page } = await admin.from("pages").select("*").eq("store_id", storeId).eq("key", key).maybeSingle();
    if (!page) throw err("NOT_FOUND", "Page introuvable");
    const content = (page as { content: Record<string, unknown> | null }).content;
    if (!content || !Array.isArray((content as { sections?: unknown[] }).sections)) {
      throw err("VALIDATION", "Aucun brouillon à publier.");
    }

    const nextVersion = ((page as { version: number }).version ?? 0) + 1;
    const now = new Date().toISOString();
    const { error } = await admin.from("pages").update({
      published_content: content,
      version: nextVersion,
      published_at: now,
      updated_at: now,
    } as never).eq("id", (page as { id: string }).id);
    if (error) throw error;

    const { error: versionError } = await admin.from("page_versions").insert({
      store_id: storeId,
      page_key: key,
      version: nextVersion,
      content,
      published_by: ctx.user.id,
    } as never);
    if (versionError) throw versionError;

    await logAudit({
      actorId: ctx.user.id,
      storeId,
      action: "page.published",
      entity: "page",
      entityId: (page as { id: string }).id,
      metadata: { page_key: key, version: nextVersion },
    });

    return NextResponse.json({ ok: true, version: nextVersion });
  } catch (e) {
    return toErrorResponse(e);
  }
}
