import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { pageContentSchema, SECTION_DEFS } from "@/lib/sections/definitions";
import { PAGE_KEYS } from "@/lib/types";
import type { WebsiteType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  seo_title: z.string().max(160).optional().or(z.literal("")).nullable(),
  seo_description: z.string().max(300).optional().or(z.literal("")).nullable(),
  content: pageContentSchema.optional(),
});

/**
 * Update the DRAFT of a page (capability: content.manage).
 * The live site is never affected until an explicit publish.
 * Section types are revalidated against the store's website type — a
 * portfolio store cannot inject an e-commerce-only section, etc.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    if (!PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number])) throw err("NOT_FOUND", "Page inconnue");

    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = bodySchema.parse(body);

    const admin = getAdminSupabase();
    const { data: page, error: pageError } = await admin
      .from("pages")
      .select("*")
      .eq("store_id", ctx.store.id)
      .eq("key", key)
      .maybeSingle();
    if (pageError) throw pageError;
    if (!page) throw err("NOT_FOUND", "Page introuvable sur ce site");

    if (input.content) {
      const websiteType = ctx.store.website_type as WebsiteType;
      for (const section of input.content.sections) {
        const def = SECTION_DEFS[section.type as keyof typeof SECTION_DEFS];
        if (!def) throw err("VALIDATION", `Type de section inconnu : ${section.type}`);
        if (!def.allowedFor.includes(websiteType)) {
          throw err("VALIDATION", `La section « ${def.label} » n'est pas disponible pour ce type de site.`);
        }
      }
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title) patch.title = input.title;
    if (input.seo_title !== undefined) patch.seo_title = input.seo_title || null;
    if (input.seo_description !== undefined) patch.seo_description = input.seo_description || null;
    if (input.content) patch.content = input.content;

    const { error } = await admin.from("pages").update(patch).eq("id", (page as { id: string }).id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "page.updated",
      entity: "page",
      entityId: (page as { id: string }).id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { page_key: key, fields: Object.keys(patch) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
