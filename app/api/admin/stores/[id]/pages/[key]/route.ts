import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; key: string }> }) {
  try {
    const { id: storeId, key } = await params;
    if (!PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number])) throw err("NOT_FOUND", "Page inconnue");
    const ctx = await getAdminContext();
    const input = bodySchema.parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("id, website_type").eq("id", storeId).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const { data: page } = await admin.from("pages").select("*").eq("store_id", storeId).eq("key", key).maybeSingle();
    if (!page) throw err("NOT_FOUND", "Page introuvable");

    if (input.content) {
      const websiteType = (store as { website_type: WebsiteType }).website_type;
      for (const section of input.content.sections) {
        const def = SECTION_DEFS[section.type as keyof typeof SECTION_DEFS];
        if (!def || !def.allowedFor.includes(websiteType)) {
          throw err("VALIDATION", `Section non autorisée : ${section.type}`);
        }
      }
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) patch.title = input.title;
    if (input.seo_title !== undefined) patch.seo_title = input.seo_title || null;
    if (input.seo_description !== undefined) patch.seo_description = input.seo_description || null;
    if (input.content !== undefined) patch.content = input.content;

    const { error } = await admin.from("pages").update(patch).eq("id", (page as { id: string }).id);
    if (error) throw error;

    await logAudit({
      actorId: ctx.user.id,
      storeId,
      action: "page.updated",
      entity: "page",
      entityId: (page as { id: string }).id,
      metadata: { page_key: key, fields: Object.keys(patch) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
