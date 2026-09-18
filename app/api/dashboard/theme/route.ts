import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";
import { themeSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Update the store theme (capability: appearance.manage).
 * Only approved appearance options are accepted (colors, presets, shapes) —
 * no raw CSS/JS. Audited.
 */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "appearance.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = themeSchema.partial().parse(body);
    const admin = getAdminSupabase();

    const { data: current } = await admin.from("themes").select("logo_url, favicon_url, primary_color, secondary_color").eq("store_id", ctx.store.id).maybeSingle();

    const { error } = await admin
      .from("themes")
      .update({
        logo_url: input.logo_url !== undefined ? input.logo_url : (current?.logo_url as string | null),
        favicon_url: input.favicon_url !== undefined ? input.favicon_url : (current?.favicon_url as string | null),
        primary_color: input.primary_color ?? (current as { primary_color: string } | undefined)?.primary_color ?? "#1d4ed8",
        secondary_color: input.secondary_color ?? (current as { secondary_color: string } | undefined)?.secondary_color ?? "#f59e0b",
        background_color: input.background_color || null,
        typography: input.typography ?? "modern",
        button_shape: input.button_shape ?? "rounded",
        announcement: input.announcement || null,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", ctx.store.id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "store.appearance_changed",
      entity: "theme",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: {
        primary_color: input.primary_color ?? "unchanged",
        secondary_color: input.secondary_color ?? "unchanged",
        typography: input.typography ?? "unchanged",
        button_shape: input.button_shape ?? "unchanged",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
