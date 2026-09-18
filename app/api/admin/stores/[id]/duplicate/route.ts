import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import { slugify, isValidSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional().or(z.literal("")).nullable(),
});

/**
 * Duplicate a store (config + catalog, NO customers/orders/secrets) via the
 * trusted fn_copy_store (service role). The copy is created as draft with
 * products inactive. SUPER_ADMIN only, audited.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();

    const input = bodySchema.parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const slug = input.slug ? slugify(input.slug) : "";
    if (!slug || !isValidSlug(slug)) throw err("VALIDATION", "Slug invalide pour le nouveau site.");

    // fn_copy_store raises SLUG_TAKEN when needed; check first for a friendly message.
    const { data: clash } = await admin.from("stores").select("id").eq("slug", slug).is("deleted_at", null).maybeSingle();
    if (clash) throw err("CONFLICT", "Ce slug est déjà utilisé.");

    const { data: result, error } = await admin.rpc("fn_copy_store", {
      p_source_store_id: id,
      p_new_slug: slug,
      p_new_name: input.name,
      p_actor_id: ctx.user.id,
    });
    if (error) {
      if (/SLUG_TAKEN/i.test(error.message)) throw err("CONFLICT", "Ce slug est déjà utilisé.");
      if (/STORE_NOT_FOUND/i.test(error.message)) throw err("NOT_FOUND", "Site source introuvable");
      throw error;
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: (result as string) ?? id,
      action: "store.duplicated",
      entity: "store",
      entityId: (result as string) ?? null,
      metadata: { source_store_id: id, name: input.name, slug, by: "platform_admin" },
    });

    return NextResponse.json({ ok: true, id: result as string, slug });
  } catch (e) {
    return toErrorResponse(e);
  }
}
