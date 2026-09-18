import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";
import type { StoreSettings } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const social = z
  .string()
  .max(200)
  .regex(/^(https?:\/\/)?(www\.)?(instagram\.com|facebook\.com|tiktok\.com|wa\.me)\/[^\s"'<>]+$/, "Lien social invalide")
  .optional()
  .or(z.literal(""))
  .nullable();

const bodySchema = z
  .object({
    contact: z
      .object({
        email: z.string().trim().email("Email invalide").max(120).optional().or(z.literal("")).nullable(),
        phone: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
        whatsapp: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
        instagram: social,
        facebook: social,
        tiktok: social,
        address: z.string().trim().max(300).optional().or(z.literal("")).nullable(),
      })
      .optional(),
    business: z
      .object({
        cod_enabled: z.boolean().optional(),
        reviews_enabled: z.boolean().optional(),
        faq_enabled: z.boolean().optional(),
        allow_negative_stock: z.boolean().optional(),
        max_items_per_order: z.number().int().min(1).max(999).optional(),
      })
      .optional(),
  })
  .refine((b) => b.contact || b.business, { message: "Rien à enregistrer" });

/**
 * Update store settings (capability: settings.manage → OWNER).
 * Partial merge — only provided keys change. Audited.
 */
export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "settings.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = bodySchema.parse(body);
    const admin = getAdminSupabase();

    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("settings")
      .eq("id", ctx.store.id)
      .maybeSingle();
    if (storeError) throw storeError;
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const current = (store as { settings: StoreSettings }).settings;
    const next: StoreSettings = {
      contact: { ...current.contact, ...(input.contact ? {
        email: input.contact.email || null,
        phone: input.contact.phone || null,
        whatsapp: input.contact.whatsapp || null,
        instagram: input.contact.instagram || null,
        facebook: input.contact.facebook || null,
        tiktok: input.contact.tiktok || null,
        address: input.contact.address || null,
      } : {}) },
      business: { ...current.business, ...(input.business ?? {}) },
    };

    const { error } = await admin.from("stores").update({ settings: next as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", ctx.store.id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "store.settings_changed",
      entity: "store",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: {
        contact_fields: input.contact ? Object.keys(input.contact) : [],
        business_fields: input.business ? Object.keys(input.business) : [],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
