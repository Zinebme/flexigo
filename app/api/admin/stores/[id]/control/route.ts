import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto/encrypt";
import { parseServiceAccount } from "@/lib/integrations/sheets";
import { slugify } from "@/lib/slug";
import { SHIPPING_PROVIDER_KEYS, MARKETING_PROVIDER_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("store"),
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(1).max(80),
    language: z.enum(["fr","ar","en"]),
    currency: z.string().trim().length(3),
  }),
  z.object({
    action: z.literal("theme"),
    logo_url: z.string().max(2000).optional().nullable(),
    favicon_url: z.string().max(2000).optional().nullable(),
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
    typography: z.enum(["modern","elegant","bold","minimal"]),
    button_shape: z.enum(["rounded","sharp","pill"]),
    announcement: z.string().max(160).optional().nullable(),
  }),
  z.object({
    action: z.literal("product"),
    product_id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    price: z.number().positive().max(10_000_000),
    compare_at_price: z.number().positive().max(10_000_000).optional().nullable(),
    stock: z.number().int().min(0).max(1_000_000),
    category_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean(),
    is_featured: z.boolean(),
  }),
  z.object({
    action: z.literal("category"),
    category_id: z.string().uuid(),
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().max(80).optional().nullable(),
    is_visible: z.boolean(),
    position: z.number().int().min(0).max(1000),
  }),
  z.object({
    action: z.literal("shipping"),
    provider_key: z.enum(SHIPPING_PROVIDER_KEYS),
    is_active: z.boolean(),
    api_base_url: z.string().url().max(300).optional().or(z.literal("")).nullable(),
    api_token: z.string().max(500).optional().or(z.literal("")).nullable(),
    account: z.string().max(120).optional().or(z.literal("")).nullable(),
  }),
  z.object({
    action: z.literal("marketing"),
    provider_key: z.enum(MARKETING_PROVIDER_KEYS),
    is_active: z.boolean(),
    pixel_id: z.string().max(80).regex(/^[A-Za-z0-9._-]*$/).optional().or(z.literal("")).nullable(),
  }),
  z.object({
    action: z.literal("sheets"),
    spreadsheet_id: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
    service_account_json: z.string().max(100_000).optional().or(z.literal("")).nullable(),
    is_active: z.boolean(),
  }),
  z.object({
    action: z.literal("telegram"),
    bot_token: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
    chat_id: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
    is_active: z.boolean(),
  }),
  z.object({
    action: z.literal("owner"),
    email: z.string().trim().email().max(120),
    full_name: z.string().trim().min(2).max(120),
    dashboard_language: z.enum(["fr","ar","en"]).default("fr"),
  }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: storeId } = await params;
    const ctx = await getAdminContext();
    const input = actionSchema.parse(await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: store } = await admin
      .from("stores")
      .select("id, organization_id, settings")
      .eq("id", storeId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable.");

    if (input.action === "store") {
      const slug = slugify(input.slug);
      if (!slug) throw err("VALIDATION", "Slug invalide.");
      const { data: clash } = await admin.from("stores").select("id").eq("slug", slug).neq("id", storeId).is("deleted_at", null).maybeSingle();
      if (clash) throw err("CONFLICT", "Ce slug est déjà utilisé.");
      const { error } = await admin.from("stores").update({
        name: input.name,
        slug,
        language: input.language,
        currency: input.currency.toUpperCase(),
        updated_at: new Date().toISOString(),
      } as never).eq("id", storeId);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "store.settings_changed", entity: "store", entityId: storeId, metadata: { fields: ["name","slug","language","currency"] } });
    }

    if (input.action === "theme") {
      const { error } = await admin.from("themes").update({
        logo_url: input.logo_url || null,
        favicon_url: input.favicon_url || null,
        primary_color: input.primary_color,
        secondary_color: input.secondary_color,
        background_color: input.background_color || null,
        typography: input.typography,
        button_shape: input.button_shape,
        announcement: input.announcement || null,
        updated_at: new Date().toISOString(),
      } as never).eq("store_id", storeId);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "store.appearance_changed", entity: "theme", entityId: storeId, metadata: { fields: ["logo","favicon","colors","typography","button_shape","announcement"] } });
    }

    if (input.action === "product") {
      const { data: current } = await admin.from("products").select("id, stock, price_cents").eq("id", input.product_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Produit introuvable.");
      const priceCents = Math.round(input.price * 100);
      const { error } = await admin.from("products").update({
        name: input.name,
        price_cents: priceCents,
        compare_at_price_cents: input.compare_at_price != null ? Math.round(input.compare_at_price * 100) : null,
        stock: input.stock,
        category_id: input.category_id || null,
        is_active: input.is_active,
        is_featured: input.is_featured,
        updated_at: new Date().toISOString(),
      } as never).eq("id", input.product_id).eq("store_id", storeId);
      if (error) throw error;

      const oldStock = Number((current as { stock: number }).stock);
      if (oldStock !== input.stock) {
        await admin.from("inventory_movements").insert({
          store_id: storeId,
          product_id: input.product_id,
          change: input.stock - oldStock,
          reason: "Ajustement Super Admin",
          actor_user_id: ctx.user.id,
        } as never);
      }
      await logAudit({ actorId: ctx.user.id, storeId, action: "product.updated", entity: "product", entityId: input.product_id, metadata: { price_cents: priceCents, stock: input.stock } });
    }

    if (input.action === "category") {
      const { data: current } = await admin.from("categories").select("id").eq("id", input.category_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Catégorie introuvable.");
      const { error } = await admin.from("categories").update({
        name: input.name,
        slug: slugify(input.slug || input.name),
        is_visible: input.is_visible,
        position: input.position,
        updated_at: new Date().toISOString(),
      } as never).eq("id", input.category_id).eq("store_id", storeId);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "category.changed", entity: "category", entityId: input.category_id, metadata: { op: "admin_update" } });
    }

    if (input.action === "shipping") {
      const { data: currentShipping } = await admin
        .from("shipping_integrations")
        .select("config")
        .eq("store_id", storeId)
        .eq("provider_key", input.provider_key)
        .maybeSingle();
      const config: Record<string, string> = {
        ...(((currentShipping as { config?: Record<string, string> } | null)?.config) ?? {}),
      };
      if (input.api_base_url !== undefined && input.api_base_url !== null) config.api_base_url = input.api_base_url;
      if (input.api_token) config.api_token = encryptSecret(input.api_token);
      if (input.account !== undefined && input.account !== null) config.account = input.account;
      const { error } = await admin.from("shipping_integrations").upsert({
        store_id: storeId,
        provider_key: input.provider_key,
        is_active: input.is_active,
        config,
        status: input.provider_key === "manual" || Object.keys(config).length ? "configured" : "unconfigured",
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id,provider_key" });
      if (error) throw error;
      if (input.is_active) {
        await admin.from("shipping_integrations").update({ is_active: false } as never).eq("store_id", storeId).neq("provider_key", input.provider_key);
      }
      await logAudit({ actorId: ctx.user.id, storeId, action: "integration.changed", entity: "shipping_integration", entityId: input.provider_key, metadata: { provider: input.provider_key, active: input.is_active } });
    }

    if (input.action === "marketing") {
      const config = input.provider_key === "ga4"
        ? { measurement_id: input.pixel_id || "" }
        : input.provider_key === "gtm"
          ? { container_id: input.pixel_id || "" }
          : input.provider_key === "google_ads"
            ? { customer_id: input.pixel_id || "" }
            : { pixel_id: input.pixel_id || "" };
      const { error } = await admin.from("marketing_integrations").upsert({
        store_id: storeId,
        provider_key: input.provider_key,
        is_active: input.is_active,
        config,
        events_enabled: ["PageView","ViewContent","AddToCart","InitiateCheckout","Purchase"],
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id,provider_key" });
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "integration.changed", entity: "marketing_integration", entityId: input.provider_key, metadata: { provider: input.provider_key, active: input.is_active } });
    }

    if (input.action === "sheets") {
      const { data: current } = await admin.from("google_sheet_integrations").select("credential_encrypted").eq("store_id", storeId).maybeSingle();
      let credential = (current as { credential_encrypted?: string | null } | null)?.credential_encrypted ?? null;
      if (input.service_account_json) {
        parseServiceAccount(input.service_account_json);
        credential = encryptSecret(input.service_account_json);
      }
      const { error } = await admin.from("google_sheet_integrations").upsert({
        store_id: storeId,
        spreadsheet_id: input.spreadsheet_id || null,
        credential_encrypted: credential,
        fields: ["numero","nom","telephone","wilaya","commune","livraison","total","statut","creee"],
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id" });
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "integration.changed", entity: "google_sheets_integration", entityId: storeId, metadata: { active: input.is_active, credential_updated: Boolean(input.service_account_json) } });
    }

    if (input.action === "telegram") {
      const { data: current } = await admin.from("telegram_integrations").select("bot_token_encrypted").eq("store_id", storeId).maybeSingle();
      let token = (current as { bot_token_encrypted?: string | null } | null)?.bot_token_encrypted ?? null;
      if (input.bot_token) token = encryptSecret(input.bot_token);
      if (!token || !input.chat_id) throw err("VALIDATION", "Telegram requiert un bot token et un chat ID.");
      const { error } = await admin.from("telegram_integrations").upsert({
        store_id: storeId,
        bot_token_encrypted: token,
        chat_id: input.chat_id,
        enabled_events: ["new_order","cancelled","delivered","low_stock","delivery_error"],
        is_active: input.is_active,
        status: "pending",
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id" });
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "integration.changed", entity: "telegram_integration", entityId: storeId, metadata: { active: input.is_active } });
    }

    if (input.action === "owner") {
      const email = input.email.toLowerCase();
      let userId: string | null = null;
      const { data: profile } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (profile) {
        userId = (profile as { id: string }).id;
      } else {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: input.full_name } });
        if (error || !data.user) throw err("VALIDATION", `Invitation impossible : ${error?.message ?? "erreur Auth"}`);
        userId = data.user.id;
        await admin.from("profiles").upsert({
          id: userId,
          full_name: input.full_name,
          email,
          dashboard_language: input.dashboard_language,
        } as never);
      }
      await admin.from("profiles").update({ dashboard_language: input.dashboard_language } as never).eq("id", userId);
      await admin.from("store_members").upsert({
        store_id: storeId,
        user_id: userId,
        role: "OWNER",
        status: "active",
        invited_by: ctx.user.id,
      } as never, { onConflict: "store_id,user_id" });
      if ((store as { organization_id: string | null }).organization_id) {
        await admin.from("organizations").update({ owner_user_id: userId } as never).eq("id", (store as { organization_id: string }).organization_id);
      }
      await logAudit({ actorId: ctx.user.id, storeId, action: "team.member_added", entity: "store_member", entityId: userId, metadata: { role: "OWNER", language: input.dashboard_language } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
