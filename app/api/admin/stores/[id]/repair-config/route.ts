import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { getTemplate, defaultHomeSections, defaultSettings } from "@/lib/templates/defaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/stores/[id]/repair-config — Administration avancée.
 * Safe tools only, no raw SQL.
 *
 * Body peut contenir:
 * - { regenerate_sections: true } → régénère les sections homepage depuis le template
 * - { action: "disconnect_shipping" | "disconnect_sheets" | "reset_marketing" | "repair_invalid" }
 * - { fix_settings: true } → corrige settings JSON invalides
 *
 * Toujours audité.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const s = store as { id: string; template_key: string; website_type: string; name: string; settings: unknown };

    // --- regenerate homepage sections ---
    if (body.regenerate_sections) {
      const tpl = getTemplate(s.template_key);
      if (!tpl) throw err("NOT_FOUND", "Template introuvable");
      const sections = defaultHomeSections(s.template_key, s.website_type as never, s.name);
      const { data: page } = await admin.from("pages").select("id").eq("store_id", id).eq("key", "home").maybeSingle();
      if (!page) throw err("NOT_FOUND", "Page d'accueil introuvable");
      const { error } = await admin.from("pages").update({ content: { sections }, updated_at: new Date().toISOString() } as never).eq("id", (page as { id: string }).id);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId: id, action: "page.regenerated", entity: "page", entityId: "home", metadata: { template: s.template_key } });
      return NextResponse.json({ ok: true, action: "regenerate_sections" });
    }

    // --- fix settings ---
    if (body.fix_settings || body.action === "repair_invalid") {
      const currentSettings = (s.settings ?? {}) as Record<string, unknown>;
      // Ensure structure
      const contact = (currentSettings.contact as Record<string, unknown> | undefined) ?? {};
      const business = (currentSettings.business as Record<string, unknown> | undefined) ?? {};
      const fixed = defaultSettings(
        {
          email: (contact.email as string | null) ?? null,
          phone: (contact.phone as string | null) ?? null,
          whatsapp: (contact.whatsapp as string | null) ?? null,
          instagram: (contact.instagram as string | null) ?? null,
          facebook: (contact.facebook as string | null) ?? null,
          tiktok: (contact.tiktok as string | null) ?? null,
          address: (contact.address as string | null) ?? null,
        },
        {
          cod_enabled: (business.cod_enabled as boolean | undefined) ?? true,
          reviews_enabled: (business.reviews_enabled as boolean | undefined) ?? true,
          faq_enabled: (business.faq_enabled as boolean | undefined) ?? true,
        },
      );
      const { error } = await admin.from("stores").update({ settings: fixed as never, updated_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId: id, action: "store.settings_repaired", entity: "store", entityId: id, metadata: {} });
      return NextResponse.json({ ok: true, action: "fix_settings" });
    }

    // --- disconnect shipping ---
    if (body.action === "disconnect_shipping") {
      await admin.from("shipping_integrations").update({ is_active: false, status: "error", last_error: "Déconnecté par super admin" } as never).eq("store_id", id);
      await logAudit({ actorId: ctx.user.id, storeId: id, action: "integration.disconnected", entity: "shipping_integration", entityId: id, metadata: { provider: "all" } });
      return NextResponse.json({ ok: true, action: "disconnect_shipping" });
    }

    if (body.action === "disconnect_sheets") {
      await admin.from("google_sheet_integrations").update({ is_active: false, last_status: "failure", last_error: "Déconnecté par super admin" } as never).eq("store_id", id);
      await logAudit({ actorId: ctx.user.id, storeId: id, action: "integration.disconnected", entity: "google_sheet_integration", entityId: id, metadata: {} });
      return NextResponse.json({ ok: true, action: "disconnect_sheets" });
    }

    if (body.action === "reset_marketing") {
      await admin.from("marketing_integrations").update({ is_active: false } as never).eq("store_id", id);
      await logAudit({ actorId: ctx.user.id, storeId: id, action: "integration.reset", entity: "marketing_integration", entityId: id, metadata: {} });
      return NextResponse.json({ ok: true, action: "reset_marketing" });
    }

    // default: no-op repair
    await logAudit({ actorId: ctx.user.id, storeId: id, action: "store.repair_checked", entity: "store", entityId: id, metadata: body });
    return NextResponse.json({ ok: true, message: "Aucune action — payload vide, vérification OK." });
  } catch (e) {
    return toErrorResponse(e);
  }
}
