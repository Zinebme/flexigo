import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { PAGE_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Publish the current DRAFT of a page (capability: content.manage).
 * - Snapshots content → published_content (what the live site serves)
 * - Increments version + stores an immutable page_versions row
 * - Fully audited.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    if (!PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number])) throw err("NOT_FOUND", "Page inconnue");

    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");

    const admin = getAdminSupabase();
    const { data: page, error: pageError } = await admin
      .from("pages")
      .select("*")
      .eq("store_id", ctx.store.id)
      .eq("key", key)
      .maybeSingle();
    if (pageError) throw pageError;
    if (!page) throw err("NOT_FOUND", "Page introuvable sur ce site");

    const content = (page as { content: Record<string, unknown> | null }).content;
    if (!content || !Array.isArray((content as { sections?: unknown[] }).sections)) {
      throw err("VALIDATION", "Aucun contenu à publier (brouillon vide).");
    }

    const nextVersion = ((page as { version: number }).version ?? 0) + 1;
    const now = new Date().toISOString();

    const { error: pubError } = await admin
      .from("pages")
      .update({
        published_content: content,
        version: nextVersion,
        published_at: now,
        updated_at: now,
      })
      .eq("id", (page as { id: string }).id);
    if (pubError) throw pubError;

    const { error: verError } = await admin.from("page_versions").insert({
      store_id: ctx.store.id,
      page_key: key,
      version: nextVersion,
      content,
      published_by: ctx.user.id,
    });
    if (verError) throw verError;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "page.published",
      entity: "page",
      entityId: (page as { id: string }).id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { page_key: key, version: nextVersion },
    });

    return NextResponse.json({ ok: true, version: nextVersion });
  } catch (e) {
    return toErrorResponse(e);
  }
}
