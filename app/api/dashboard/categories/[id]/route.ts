import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { categorySchema } from "@/lib/schemas";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Update a category (capability: categories.manage). */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "categories.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = categorySchema.parse(body);
    const admin = getAdminSupabase();

    const { data: current, error: curError } = await admin
      .from("categories")
      .select("id, slug")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (curError) throw curError;
    if (!current) throw err("NOT_FOUND", "Catégorie introuvable");

    const patch: Record<string, unknown> = {
      name: input.name,
      description: input.description || null,
      image_url: input.image_url,
      is_visible: input.is_visible,
      updated_at: new Date().toISOString(),
    };
    if (input.position != null) patch.position = input.position;
    if (input.slug) {
      const slug = slugify(input.slug);
      if (slug !== (current.slug as string)) {
        const { data: clash } = await admin
          .from("categories")
          .select("id")
          .eq("store_id", ctx.store.id)
          .eq("slug", slug)
          .neq("id", id)
          .maybeSingle();
        if (clash) throw err("CONFLICT", "Ce slug est déjà utilisé");
        patch.slug = slug;
      }
    }

    const { error } = await admin.from("categories").update(patch).eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "category.changed",
      entity: "category",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: input.name, op: "update" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

/** Soft-delete a category (capability: categories.manage). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "categories.manage");

    const admin = getAdminSupabase();
    const { data: current, error: curError } = await admin
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (curError) throw curError;
    if (!current) throw err("NOT_FOUND", "Catégorie introuvable");

    const { error } = await admin
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "category.changed",
      entity: "category",
      entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { name: (current.name as string) ?? null, op: "delete" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
