import { NextResponse } from "next/server";
import { getInviteRedirectUrl } from "@/lib/app-url";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto/encrypt";
import { parseServiceAccount } from "@/lib/integrations/sheets";
import { slugify } from "@/lib/slug";
import { normalizeDZPhone } from "@/lib/phone";
import { SHIPPING_PROVIDER_KEYS, MARKETING_PROVIDER_KEYS } from "@/lib/types";
import { souqCheckoutSettingsSchema } from "@/lib/storefront/souq/checkout-settings";
import { parseBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const adminStoreControlActionSchema = z.discriminatedUnion("action", [
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
    action: z.literal("product_create"),
    name: z.string().trim().min(2).max(120),
    price: z.number().positive().max(10_000_000),
    stock: z.number().int().min(0).max(1_000_000),
    category_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("product_delete"),
    product_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("category"),
    category_id: z.string().uuid(),
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().max(80).optional().nullable(),
    description: z.string().trim().max(500).optional().or(z.literal("")).nullable(),
    image_url: z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
    is_visible: z.boolean(),
    position: z.number().int().min(0).max(1000),
  }),
  z.object({
    action: z.literal("category_create"),
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().max(80).optional().nullable(),
    description: z.string().trim().max(500).optional().or(z.literal("")).nullable(),
    image_url: z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
    is_visible: z.boolean().default(true),
    position: z.number().int().min(0).max(1000).default(0),
  }),
  z.object({
    action: z.literal("category_delete"),
    category_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("customer_create"),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(20),
    email: z.string().trim().email().max(120).optional().or(z.literal("")).nullable(),
    notes: z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
  }),
  z.object({
    action: z.literal("customer_update"),
    customer_id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(20),
    email: z.string().trim().email().max(120).optional().or(z.literal("")).nullable(),
    notes: z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
  }),
  z.object({
    action: z.literal("customer_status"),
    customer_id: z.string().uuid(),
    status: z.enum(["active","suspended"]),
  }),
  z.object({
    action: z.literal("customer_delete"),
    customer_id: z.string().uuid(),
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
    action: z.literal("shipping_offices"),
    offices: z.array(z.object({
      wilaya_code: z.number().int().min(1).max(58),
      name: z.string().trim().min(2).max(40),
      address: z.string().trim().min(5).max(75),
    })).max(200),
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
    full_name: z.string().trim().max(120).default(""),
    dashboard_language: z.enum(["fr","ar","en"]).default("fr"),
  }),
  z.object({
    action: z.literal("member_update"),
    member_id: z.string().uuid(),
    full_name: z.string().trim().max(120),
    dashboard_language: z.enum(["fr","ar","en"]),
    role: z.enum(["OWNER","MANAGER","ORDER_MANAGER","CONTENT_EDITOR","VIEWER"]),
  }),
  z.object({
    action: z.literal("member_status"),
    member_id: z.string().uuid(),
    status: z.enum(["active","revoked"]),
  }),
  z.object({
    action: z.literal("member_remove"),
    member_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("member_send_access_email"),
    member_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("member_access_link"),
    member_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("checkout"),
    checkout: souqCheckoutSettingsSchema,
  }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: storeId } = await params;
    const ctx = await getAdminContext();
    const input = parseBody(adminStoreControlActionSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();
    let ownerAccount: "invited" | "attached" | "resent" | undefined;
    let accessLink: string | undefined;

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

    if (input.action === "checkout") {
      const currentSettings = ((store as unknown as { settings?: Record<string, unknown> }).settings ?? {});
      const nextSettings = { ...currentSettings, checkout: input.checkout };
      const { error } = await admin.from("stores").update({
        settings: nextSettings,
        updated_at: new Date().toISOString(),
      } as never).eq("id", storeId);
      if (error) throw error;
      await logAudit({
        actorId: ctx.user.id,
        storeId,
        action: "store.settings_changed",
        entity: "store",
        entityId: storeId,
        metadata: { fields: Object.keys(input.checkout) },
      });
    }

    if (input.action === "product") {
      const { data: current } = await admin.from("products").select("id, stock, price_cents").eq("id", input.product_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Produit introuvable.");
      const priceCents = Math.round(input.price * 100);
      if (input.category_id) {
        const { data: category } = await admin.from("categories").select("id").eq("id", input.category_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
        if (!category) throw err("VALIDATION", "Catégorie invalide pour cette boutique.");
      }
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

    if (input.action === "product_create") {
      if (input.category_id) {
        const { data: category } = await admin.from("categories").select("id").eq("id", input.category_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
        if (!category) throw err("VALIDATION", "Catégorie invalide pour cette boutique.");
      }
      let productSlug = slugify(input.name) || `produit-${Date.now().toString(36)}`;
      for (let suffix = 1; suffix <= 25; suffix += 1) {
        const candidate = suffix === 1 ? productSlug : `${productSlug}-${suffix}`;
        const { data: clash } = await admin.from("products").select("id").eq("store_id", storeId).eq("slug", candidate).maybeSingle();
        if (!clash) { productSlug = candidate; break; }
        if (suffix === 25) throw err("CONFLICT", "Impossible de générer un slug produit unique.");
      }
      const priceCents = Math.round(input.price * 100);
      const { data: created, error } = await admin.from("products").insert({
        store_id: storeId,
        category_id: input.category_id || null,
        name: input.name,
        slug: productSlug,
        price_cents: priceCents,
        stock: input.stock,
        is_active: input.is_active,
        is_featured: false,
      } as never).select("id").single();
      if (error) throw error;
      const productId = (created as { id: string }).id;
      if (input.stock > 0) {
        const { error: movementError } = await admin.from("inventory_movements").insert({
          store_id: storeId,
          product_id: productId,
          change: input.stock,
          reason: "Stock initial Super Admin",
          actor_user_id: ctx.user.id,
        } as never);
        if (movementError) throw movementError;
      }
      await logAudit({ actorId: ctx.user.id, storeId, action: "product.created", entity: "product", entityId: productId, metadata: { name: input.name, price_cents: priceCents } });
    }

    if (input.action === "product_delete") {
      const { data: current } = await admin.from("products").select("id, name").eq("id", input.product_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Produit introuvable.");
      const { error } = await admin.from("products").update({ deleted_at: new Date().toISOString(), is_active: false } as never).eq("id", input.product_id).eq("store_id", storeId);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "product.deleted", entity: "product", entityId: input.product_id, metadata: { name: (current as { name: string }).name } });
    }

    if (input.action === "category") {
      const { data: current } = await admin.from("categories").select("id").eq("id", input.category_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Catégorie introuvable.");
      const { error } = await admin.from("categories").update({
        name: input.name,
        slug: slugify(input.slug || input.name),
        description: input.description || null,
        image_url: input.image_url || null,
        is_visible: input.is_visible,
        position: input.position,
        updated_at: new Date().toISOString(),
      } as never).eq("id", input.category_id).eq("store_id", storeId);
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "category.changed", entity: "category", entityId: input.category_id, metadata: { op: "admin_update" } });
    }

    if (input.action === "category_create") {
      let categorySlug = slugify(input.slug || input.name) || `categorie-${Date.now().toString(36)}`;
      for (let suffix = 1; suffix <= 25; suffix += 1) {
        const candidate = suffix === 1 ? categorySlug : `${categorySlug}-${suffix}`;
        const { data: clash } = await admin.from("categories").select("id").eq("store_id", storeId).eq("slug", candidate).maybeSingle();
        if (!clash) { categorySlug = candidate; break; }
        if (suffix === 25) throw err("CONFLICT", "Impossible de générer un slug catégorie unique.");
      }
      const { data: created, error } = await admin.from("categories").insert({
        store_id: storeId,
        name: input.name,
        slug: categorySlug,
        description: input.description || null,
        image_url: input.image_url || null,
        is_visible: input.is_visible,
        position: input.position,
      } as never).select("id").single();
      if (error) throw error;
      await logAudit({ actorId: ctx.user.id, storeId, action: "category.changed", entity: "category", entityId: (created as { id: string }).id, metadata: { name: input.name, op: "admin_create" } });
    }

    if (input.action === "category_delete") {
      const { data: current } = await admin.from("categories").select("id, name").eq("id", input.category_id).eq("store_id", storeId).is("deleted_at", null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Catégorie introuvable.");
      const now = new Date().toISOString();
      const { error } = await admin.from("categories").update({ deleted_at: now, is_visible: false } as never).eq("id", input.category_id).eq("store_id", storeId);
      if (error) throw error;
      const { error: productError } = await admin.from("products").update({ category_id: null, updated_at: now } as never).eq("store_id", storeId).eq("category_id", input.category_id).is("deleted_at", null);
      if (productError) throw productError;
      await logAudit({ actorId: ctx.user.id, storeId, action: "category.changed", entity: "category", entityId: input.category_id, metadata: { name: (current as { name: string }).name, op: "admin_delete" } });
    }

    if (input.action === "customer_create") {
      const normalizedPhone = normalizeDZPhone(input.phone);
      if (!normalizedPhone) throw err("VALIDATION", "Numéro de téléphone algérien invalide.");
      const { data: existing } = await admin.from("customers").select("id, deleted_at").eq("store_id", storeId).eq("normalized_phone", normalizedPhone).maybeSingle();
      if (existing && !(existing as { deleted_at: string | null }).deleted_at) throw err("CONFLICT", "Ce client existe déjà dans cette boutique.");
      let customerId: string;
      if (existing) {
        customerId = (existing as { id: string }).id;
        const { error } = await admin.from("customers").update({name:input.name,phone:input.phone,normalized_phone:normalizedPhone,email:input.email||null,notes:input.notes||null,status:"active",deleted_at:null,updated_at:new Date().toISOString()} as never).eq("id", customerId).eq("store_id", storeId);
        if (error) throw error;
      } else {
        const { data: created, error } = await admin.from("customers").insert({store_id:storeId,name:input.name,phone:input.phone,normalized_phone:normalizedPhone,email:input.email||null,notes:input.notes||null,status:"active"} as never).select("id").single();
        if (error) throw error;
        customerId = (created as { id: string }).id;
      }
      await logAudit({actorId:ctx.user.id,storeId,action:"customer.updated",entity:"customer",entityId:customerId,metadata:{operation:"admin_create"}});
    }

    if (input.action === "customer_update") {
      const normalizedPhone = normalizeDZPhone(input.phone);
      if (!normalizedPhone) throw err("VALIDATION", "Numéro de téléphone algérien invalide.");
      const { data: current } = await admin.from("customers").select("id").eq("id",input.customer_id).eq("store_id",storeId).is("deleted_at",null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Client introuvable.");
      const { data: clash } = await admin.from("customers").select("id").eq("store_id",storeId).eq("normalized_phone",normalizedPhone).neq("id",input.customer_id).is("deleted_at",null).maybeSingle();
      if (clash) throw err("CONFLICT", "Ce numéro appartient déjà à un autre client.");
      const { error } = await admin.from("customers").update({name:input.name,phone:input.phone,normalized_phone:normalizedPhone,email:input.email||null,notes:input.notes||null,updated_at:new Date().toISOString()} as never).eq("id",input.customer_id).eq("store_id",storeId);
      if (error) throw error;
      await logAudit({actorId:ctx.user.id,storeId,action:"customer.updated",entity:"customer",entityId:input.customer_id,metadata:{operation:"admin_update"}});
    }

    if (input.action === "customer_status") {
      const { data: current } = await admin.from("customers").select("id, status").eq("id",input.customer_id).eq("store_id",storeId).is("deleted_at",null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Client introuvable.");
      const { error } = await admin.from("customers").update({status:input.status,updated_at:new Date().toISOString()} as never).eq("id",input.customer_id).eq("store_id",storeId);
      if (error) throw error;
      await logAudit({actorId:ctx.user.id,storeId,action:"customer.updated",entity:"customer",entityId:input.customer_id,metadata:{operation:"status_change",from:(current as {status:string}).status,to:input.status}});
    }

    if (input.action === "customer_delete") {
      const { data: current } = await admin.from("customers").select("id").eq("id",input.customer_id).eq("store_id",storeId).is("deleted_at",null).maybeSingle();
      if (!current) throw err("NOT_FOUND", "Client introuvable.");
      const { error } = await admin.from("customers").update({status:"suspended",deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()} as never).eq("id",input.customer_id).eq("store_id",storeId);
      if (error) throw error;
      await logAudit({actorId:ctx.user.id,storeId,action:"customer.updated",entity:"customer",entityId:input.customer_id,metadata:{operation:"admin_delete",soft_delete:true}});
    }

    if (input.action === "shipping") {
      // Credentials may be prepared ahead of time, but an undocumented adapter
      // must never be activated as if it could create real shipments.
      if (input.is_active && input.provider_key !== "manual" && input.provider_key !== "mock") {
        throw err("UNSUPPORTED", "Ce transporteur est enregistré, mais son API d'envoi n'est pas encore intégrée. Activez le mode manuel.");
      }
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

    if (input.action === "shipping_offices") {
      const unique = new Set(input.offices.map((office) => `${office.wilaya_code}:${office.name.toLocaleLowerCase("fr")}:${office.address.toLocaleLowerCase("fr")}`));
      if (unique.size !== input.offices.length) throw err("VALIDATION", "Ce bureau est présent plusieurs fois.");
      const { data: manual, error: manualReadError } = await admin.from("shipping_integrations")
        .select("config, is_active").eq("store_id", storeId).eq("provider_key", "manual").maybeSingle();
      if (manualReadError) throw manualReadError;
      const { data: active, error: activeError } = await admin.from("shipping_integrations")
        .select("provider_key").eq("store_id", storeId).eq("is_active", true).limit(1).maybeSingle();
      if (activeError) throw activeError;
      const config = { ...((manual?.config as Record<string, unknown> | null) ?? {}), pickup_offices: input.offices };
      const { error: saveError } = await admin.from("shipping_integrations").upsert({
        store_id: storeId, provider_key: "manual", is_active: manual?.is_active ?? !active,
        status: "configured", config, updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id,provider_key" });
      if (saveError) throw saveError;
      await logAudit({ actorId: ctx.user.id, storeId, action: "integration.changed", entity: "shipping_integration", entityId: "manual", metadata: { pickup_offices_count: input.offices.length } });
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
        ownerAccount = "attached";
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        if (!authUser.user?.email_confirmed_at) {
          const { error: resendError } = await admin.auth.resetPasswordForEmail(email, { redirectTo: getInviteRedirectUrl() });
          if (resendError) throw err("UPSTREAM_ERROR", `Email d’accès impossible : ${resendError.message}`);
          ownerAccount = "resent";
        }
      } else {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: input.full_name },
          redirectTo: getInviteRedirectUrl(),
        });
        if (error || !data.user) throw err("VALIDATION", `Invitation impossible : ${error?.message ?? "erreur Auth"}`);
        userId = data.user.id;
        ownerAccount = "invited";
        await admin.from("profiles").upsert({
          id: userId,
          full_name: input.full_name || null,
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

    if (input.action === "member_update") {
      const { data: member } = await admin.from("store_members").select("id, user_id, role").eq("id", input.member_id).eq("store_id", storeId).maybeSingle();
      if (!member) throw err("NOT_FOUND", "Membre introuvable.");
      const userId = (member as { user_id: string }).user_id;
      const { error: profileError } = await admin.from("profiles").update({
        full_name: input.full_name || null,
        dashboard_language: input.dashboard_language,
      } as never).eq("id", userId);
      if (profileError) throw profileError;
      const { error: memberError } = await admin.from("store_members").update({ role: input.role } as never).eq("id", input.member_id).eq("store_id", storeId);
      if (memberError) throw memberError;
      const organizationId = (store as { organization_id: string | null }).organization_id;
      if (organizationId) {
        const { data: owner } = await admin.from("store_members").select("user_id").eq("store_id", storeId).eq("role", "OWNER").eq("status", "active").order("created_at", { ascending: true }).limit(1).maybeSingle();
        await admin.from("organizations").update({ owner_user_id: (owner as { user_id: string } | null)?.user_id ?? null } as never).eq("id", organizationId);
      }
      await logAudit({ actorId: ctx.user.id, storeId, action: "team.member_role_changed", entity: "store_member", entityId: input.member_id, metadata: { user_id: userId, from: (member as { role: string }).role, to: input.role, profile_updated: true } });
    }

    if (input.action === "member_send_access_email" || input.action === "member_access_link") {
      const { data: member } = await admin.from("store_members").select("id, user_id").eq("id", input.member_id).eq("store_id", storeId).maybeSingle();
      if (!member) throw err("NOT_FOUND", "Membre introuvable.");
      const userId = (member as { user_id: string }).user_id;
      const { data: profile } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
      const email = (profile as { email: string | null } | null)?.email?.trim().toLowerCase();
      if (!email) throw err("VALIDATION", "Ce compte ne possède pas d’adresse email.");

      if (input.action === "member_send_access_email") {
        const { error: emailError } = await admin.auth.resetPasswordForEmail(email, { redirectTo: getInviteRedirectUrl() });
        if (emailError) throw err("UPSTREAM_ERROR", `Email d’accès impossible : ${emailError.message}`);
      } else {
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        const params = authUser.user?.email_confirmed_at
          ? { type: "recovery" as const, email, options: { redirectTo: getInviteRedirectUrl() } }
          : { type: "invite" as const, email, options: { redirectTo: getInviteRedirectUrl() } };
        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink(params);
        if (linkError || !linkData.properties?.action_link) throw err("UPSTREAM_ERROR", `Lien d’accès impossible : ${linkError?.message ?? "erreur Auth"}`);
        accessLink = linkData.properties.action_link;
        await logAudit({ actorId: ctx.user.id, storeId, action: "team.access_link_generated", entity: "store_member", entityId: input.member_id, metadata: { user_id: userId } });
      }
    }

    if (input.action === "member_status" || input.action === "member_remove") {
      const { data: member } = await admin.from("store_members").select("id, user_id, role, status").eq("id", input.member_id).eq("store_id", storeId).maybeSingle();
      if (!member) throw err("NOT_FOUND", "Membre introuvable.");
      const removing = input.action === "member_remove";
      const nextStatus = removing ? "removed" : input.status;
      const mutation = removing
        ? admin.from("store_members").delete().eq("id", input.member_id).eq("store_id", storeId)
        : admin.from("store_members").update({ status: input.status } as never).eq("id", input.member_id).eq("store_id", storeId);
      const { error } = await mutation;
      if (error) throw error;

      const organizationId = (store as { organization_id: string | null }).organization_id;
      if (organizationId) {
        const { data: owner } = await admin.from("store_members").select("user_id").eq("store_id", storeId).eq("role", "OWNER").eq("status", "active").order("created_at", { ascending: true }).limit(1).maybeSingle();
        await admin.from("organizations").update({ owner_user_id: (owner as { user_id: string } | null)?.user_id ?? null } as never).eq("id", organizationId);
      }
      await logAudit({ actorId: ctx.user.id, storeId, action: "team.member_removed", entity: "store_member", entityId: input.member_id, metadata: { operation: removing ? "remove" : "status_change", user_id: (member as { user_id: string }).user_id, from: (member as { status: string }).status, to: nextStatus } });
    }

    return NextResponse.json({ ok: true, ...(ownerAccount ? { owner_account: ownerAccount } : {}), ...(accessLink ? { access_link: accessLink } : {}) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
