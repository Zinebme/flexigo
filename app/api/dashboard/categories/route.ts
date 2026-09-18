import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { categorySchema, parseBody } from "@/lib/schemas";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Create a category (capability: categories.manage). */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "categories.manage");

    const input = parseBody(categorySchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) slug = `categorie-${Date.now().toString(36)}`;
    for (let i = 2; ; i++) {
      const candidate = i === 1 ? slug : `${slug}-${i}`;
      const { data: existing } = await admin
        .from("categories")
        .select("id")
        .eq("store_id", ctx.store.id)
        .eq("slug", candidate)
        .maybeSingle();
      if (!existing) {
        slug = candidate;
        break;
      }
      if (i > 25) throw err("CONFLICT", "Impossible de générer un slug unique");
    }

    const { data: cat, error } = await admin
      .from("categories")
      .insert({
        store_id: ctx.store.id,
        name: input.name,
        slug,
        description: input.description || null,
        image_url: input.image_url,
        is_visible: input.is_visible,
        position: input.position ?? 0,
      })
      .select("id")
      .single();
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "category.changed",
      entity: "category",
      entityId: (cat as { id: string }).id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: input.name, op: "create" },
    });

    return NextResponse.json({ ok: true, id: (cat as { id: string }).id, slug });
  } catch (e) {
    return toErrorResponse(e);
  }
}
