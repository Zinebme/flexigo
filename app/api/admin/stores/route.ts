import { NextResponse } from "next/server";
import { canonicalTemplateKey } from "@/lib/templates/souq";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { wizardSchema, parseBody } from "@/lib/schemas";
import { slugify, isValidSlug } from "@/lib/slug";
import { getTemplate, defaultPages, defaultSettings, defaultShippingZones } from "@/lib/templates/defaults";
import { logAudit } from "@/lib/audit";
import { encryptSecret, generateToken } from "@/lib/crypto/encrypt";
import { parseServiceAccount } from "@/lib/integrations/sheets";
import { getInviteRedirectUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_SHEET_FIELDS = [
  "numero",
  "nom",
  "telephone",
  "wilaya",
  "commune",
  "livraison",
  "sous_total",
  "frais",
  "total",
  "statut",
  "creee",
];

function applyHomepageOverrides(
  pages: ReturnType<typeof defaultPages>,
  overrides: Array<{ id: string; type: string; title: string; enabled: boolean }>,
) {
  if (overrides.length === 0) return pages;
  return pages.map((page) => {
    if (page.key !== "home") return page;
    const byId = new Map(overrides.map((o) => [o.id, o]));
    const sections = page.content.sections.map((section) => {
      const override = byId.get(section.id);
      if (!override) return section;
      return {
        ...section,
        enabled: override.enabled,
        ...(override.title ? { title: override.title } : {}),
      };
    });
    return { ...page, content: { sections } };
  });
}

async function resolveOrInviteOwner(args: {
  admin: ReturnType<typeof getAdminSupabase>;
  email: string | null | undefined;
  fullName: string | null | undefined;
  accountMode: "create_now" | "invite_later";
}) {
  const email = args.email?.trim().toLowerCase();
  if (!email || args.accountMode === "invite_later") return null;

  const { data: existing } = await args.admin
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data, error } = await args.admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: args.fullName?.trim() || "" },
    redirectTo: getInviteRedirectUrl(),
  });
  if (error || !data.user) {
    throw err("VALIDATION", `Impossible de créer/inviter le compte client : ${error?.message ?? "erreur Auth"}`);
  }

  await args.admin.from("profiles").upsert({
    id: data.user.id,
    full_name: args.fullName?.trim() || null,
    email,
  } as never);

  return data.user.id;
}

/**
 * POST /api/admin/stores
 *
 * Complete 11-step internal production flow. "Finish" persists the catalog,
 * shipping, pixels, Google Sheets, Telegram, domain and merchant preferences.
 * The client account may intentionally be attached later.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const raw = await req.json().catch(() => null);
    const input = parseBody(wizardSchema, raw);
    // Whether the caller picked a language explicitly (the schema has a "fr"
    // default, so a silent caller must still get the template's own language).
    const languageExplicit =
      Boolean(raw) && typeof raw === "object" && typeof (raw as { language?: unknown }).language === "string";
    const admin = getAdminSupabase();

    // Template aliases (e.g. `souq` → `souq-v1`) are canonicalized before the
    // store is written, so the DB registry only needs the canonical row.
    const templateKey = canonicalTemplateKey(input.template_key);
    const tpl = getTemplate(templateKey);
    if (!tpl) throw err("VALIDATION", "Modèle invalide.");
    if (!tpl.websiteTypes.includes(input.website_type as never)) {
      throw err("VALIDATION", `Le modèle ${tpl.name} n'est pas compatible avec le type ${input.website_type}.`);
    }

    const ownerUserId = await resolveOrInviteOwner({
      admin,
      email: input.owner_email,
      fullName: input.owner_name,
      accountMode: input.account_mode,
    });

    let organizationId: string | null = input.organization_id ?? null;
    if (!organizationId && input.create_new_client) {
      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({
          name: input.client_name,
          owner_user_id: ownerUserId,
          created_by: ctx.user.id,
        } as never)
        .select("id")
        .single();
      if (orgErr) throw orgErr;
      organizationId = (org as { id: string }).id;
    }
    if (!organizationId) {
      const { data: existingOrg } = await admin
        .from("organizations")
        .select("id")
        .ilike("name", input.client_name)
        .maybeSingle();
      if (existingOrg) organizationId = (existingOrg as { id: string }).id;
      else throw err("VALIDATION", "Organisation requise — créez un nouveau client ou sélectionnez une organisation existante.");
    }

    const rawSlug = (input.slug?.trim() || slugify(input.business_name) || "").toLowerCase();
    const finalSlug = rawSlug.slice(0, 80);
    if (!isValidSlug(finalSlug)) {
      throw err("VALIDATION", "Slug invalide — utilisez uniquement lettres minuscules, chiffres et tirets.");
    }
    const { data: clash } = await admin
      .from("stores")
      .select("id")
      .eq("slug", finalSlug)
      .is("deleted_at", null)
      .maybeSingle();
    if (clash) throw err("CONFLICT", `Slug « ${finalSlug} » déjà utilisé.`);

    const identity = {
      logo_url: input.logo_url || null,
      favicon_url: input.favicon_url || null,
      primary_color: input.primary_color || tpl.theme.primaryColor,
      secondary_color: input.secondary_color || tpl.theme.secondaryColor,
      background_color: tpl.theme.backgroundColor,
      typography: tpl.theme.typography,
      button_shape: tpl.theme.buttonShape,
    };

    const contact = {
      email: input.contact_email || input.owner_email || null,
      phone: input.contact_phone || input.owner_phone || null,
      whatsapp: input.whatsapp || input.owner_whatsapp || null,
      instagram: input.instagram || null,
      facebook: input.facebook || null,
      tiktok: input.tiktok || null,
      address: input.address || null,
    };

    const business = {
      cod_enabled: input.cod_enabled ?? true,
      reviews_enabled: input.reviews_enabled ?? true,
      faq_enabled: input.faq_enabled ?? true,
      allow_negative_stock: false,
      max_items_per_order: 10,
      office_delivery_enabled: input.office_delivery_enabled,
      accent_color: input.accent_color || null,
    };

    const settings = defaultSettings(contact as Record<string, string | null>, business);
    const basePages = defaultPages(templateKey, input.website_type as never, input.business_name);
    const pages = applyHomepageOverrides(basePages, input.homepage_sections).map((p) => ({
      key: p.key,
      title: p.title,
      content: p.content,
    }));

    const zones = input.shipping_provider === "manual" && input.manual_shipping_zones.length > 0
      ? [
          ...input.manual_shipping_zones.map((zone) => ({
            wilaya_code: zone.wilaya_code,
            home_fee_cents: Math.round(zone.home_fee * 100),
            office_fee_cents: Math.round(zone.office_fee * 100),
            is_active: zone.is_active,
          })),
          { wilaya_code: 0, home_fee_cents: Math.round(input.default_home_fee * 100), office_fee_cents: Math.round(input.default_office_fee * 100), is_active: true },
        ]
      : defaultShippingZones(input.default_home_fee, input.default_office_fee);

    const { data: storeId, error: rpcErr } = await (admin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>)("fn_create_store", {
      p_organization_id: organizationId,
      p_name: input.business_name,
      p_slug: finalSlug,
      p_website_type: input.website_type,
      p_template_key: templateKey,
      p_language: languageExplicit ? input.language : (tpl.language ?? input.language),
      p_currency: input.currency || "DZD",
      p_identity: identity,
      p_settings: settings,
      p_pages: pages,
      p_zones: zones,
      p_owner_user_id: ownerUserId,
      p_creator_id: ctx.user.id,
    });

    if (rpcErr) {
      const msg = (rpcErr as { message?: string }).message ?? "";
      if (msg.includes("SLUG_TAKEN")) throw err("CONFLICT", `Slug « ${finalSlug} » déjà utilisé.`);
      if (msg.includes("TEMPLATE_NOT_FOUND")) throw err("NOT_FOUND", "Modèle introuvable.");
      if (msg.includes("INVALID_SLUG")) throw err("VALIDATION", "Slug invalide.");
      throw rpcErr;
    }

    const newStoreId = storeId as string;

    if (ownerUserId) {
      await admin
        .from("profiles")
        .update({ dashboard_language: input.dashboard_language } as never)
        .eq("id", ownerUserId);
      await admin
        .from("organizations")
        .update({ owner_user_id: ownerUserId } as never)
        .eq("id", organizationId);
    }

    // Categories
    for (const [idx, cat] of input.initial_categories.entries()) {
      const slug = slugify(cat.slug || cat.name) || `categorie-${idx + 1}`;
      const { error } = await admin.from("categories").insert({
        store_id: newStoreId,
        name: cat.name,
        slug,
        image_url: cat.image_url || null,
        position: cat.position ?? idx,
        is_visible: cat.is_visible,
      } as never);
      if (error) throw error;
    }

    const { data: allCats } = await admin
      .from("categories")
      .select("id, name")
      .eq("store_id", newStoreId);
    const catMap = new Map<string, string>();
    for (const cat of (allCats ?? []) as Array<{ id: string; name: string }>) {
      catMap.set(cat.name.toLowerCase(), cat.id);
    }

    // Products — create full merchandising data, then link related/cross-sell in a second pass.
    const createdProducts = new Map<string, string>();
    const pendingLinks: Array<{ id: string; related_names: string[]; cross_sell_names: string[] }> = [];

    for (const [idx, product] of input.initial_products.entries()) {
      const baseSlug = slugify(product.name) || `produit-${idx + 1}`;
      const slug = `${baseSlug}-${idx + 1}`;
      const { data: prodRow, error: prodErr } = await admin
        .from("products")
        .insert({
          store_id: newStoreId,
          category_id: product.category ? catMap.get(product.category.toLowerCase()) ?? null : null,
          name: product.name,
          slug,
          short_description: product.short_description || null,
          description: product.description || null,
          price_cents: Math.round(product.price * 100),
          compare_at_price_cents: product.compare_price != null ? Math.round(product.compare_price * 100) : null,
          cost_cents: product.cost != null ? Math.round(product.cost * 100) : null,
          sku: product.sku || null,
          stock: product.stock,
          is_active: input.publish_mode !== "draft",
          is_featured: product.featured,
          is_digital: product.is_digital,
          free_shipping: product.free_shipping,
          gallery_mode: product.gallery_mode,
          stock_tracking_mode: product.stock_tracking_mode,
          min_order_quantity: product.min_order_quantity,
          option_groups: product.option_groups,
          position: idx,
        } as never)
        .select("id")
        .single();
      if (prodErr) throw prodErr;

      const productId = (prodRow as { id: string }).id;
      createdProducts.set(product.name.trim().toLowerCase(), productId);
      pendingLinks.push({ id: productId, related_names: product.related_names, cross_sell_names: product.cross_sell_names });

      const imageUrls = product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
      if (imageUrls.length > 0) {
        const { error: imgErr } = await admin.from("product_images").insert(
          imageUrls.map((url, position) => ({ product_id: productId, store_id: newStoreId, url, position })) as never,
        );
        if (imgErr) throw imgErr;
      }

      if (product.variants.length > 0) {
        const { error: variantsErr } = await admin.from("product_variants").insert(
          product.variants.map((variant, position) => ({
            product_id: productId,
            name: variant.name,
            options: variant.options,
            price_cents: variant.price_cents ?? null,
            sku: variant.sku || null,
            stock: variant.stock,
            is_active: variant.is_active,
            position,
          })) as never,
        );
        if (variantsErr) throw variantsErr;
      }

      if (product.offers.length > 0) {
        const { error: offersErr } = await admin.from("quantity_offers").insert(
          product.offers.map((offer, position) => ({
            store_id: newStoreId,
            product_id: productId,
            min_quantity: offer.min_quantity,
            total_price_cents: offer.total_price_cents,
            label: offer.label || `Offre ${offer.min_quantity}+`,
            is_active: offer.is_active,
            free_shipping: offer.free_shipping,
            position,
          })) as never,
        );
        if (offersErr) throw offersErr;
      }

      if (product.stock > 0 && product.stock_tracking_mode === "global") {
        await admin.from("inventory_movements").insert({
          store_id: newStoreId,
          product_id: productId,
          change: product.stock,
          reason: "Stock initial (studio)",
          actor_user_id: ctx.user.id,
        } as never);
      }
    }

    for (const link of pendingLinks) {
      const related = link.related_names.map((name) => createdProducts.get(name.toLowerCase())).filter((id): id is string => Boolean(id) && id !== link.id);
      const crossSell = link.cross_sell_names.map((name) => createdProducts.get(name.toLowerCase())).filter((id): id is string => Boolean(id) && id !== link.id);
      if (related.length || crossSell.length) {
        const { error: linkErr } = await admin.from("products").update({
          related_product_ids: related,
          cross_sell_product_ids: crossSell,
        } as never).eq("id", link.id);
        if (linkErr) throw linkErr;
      }
    }

    // Shipping provider config — secrets encrypted at rest.
    const shippingConfig: Record<string, string> = {};
    if (input.shipping_api_base) shippingConfig.api_base_url = input.shipping_api_base;
    if (input.shipping_api_token) shippingConfig.api_token = encryptSecret(input.shipping_api_token);
    if (input.shipping_account) shippingConfig.account = input.shipping_account;

    await admin.from("shipping_integrations").upsert({
      store_id: newStoreId,
      provider_key: input.shipping_provider,
      is_active: input.shipping_provider === "manual",
      config: shippingConfig,
      status: input.shipping_provider === "manual"
        ? "configured"
        : Object.keys(shippingConfig).length > 0
          ? "configured"
          : "unconfigured",
      updated_at: new Date().toISOString(),
    } as never, { onConflict: "store_id,provider_key" });
    if (input.shipping_provider !== "manual") {
      const { error: manualError } = await admin.from("shipping_integrations").upsert({
        store_id: newStoreId, provider_key: "manual", is_active: true,
        config: {}, status: "configured", updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id,provider_key" });
      if (manualError) throw manualError;
    }

    // Marketing integrations
    const marketing: Array<{ provider_key: string; config: Record<string, string> }> = [];
    if (input.meta_pixel_id) marketing.push({ provider_key: "meta_pixel", config: { pixel_id: input.meta_pixel_id } });
    if (input.tiktok_pixel_id) marketing.push({ provider_key: "tiktok_pixel", config: { pixel_id: input.tiktok_pixel_id } });
    if (input.snapchat_pixel_id) marketing.push({ provider_key: "snapchat_pixel", config: { pixel_id: input.snapchat_pixel_id } });
    if (input.pinterest_tag_id) marketing.push({ provider_key: "pinterest_tag", config: { pixel_id: input.pinterest_tag_id } });
    if (input.ga4_measurement_id) marketing.push({ provider_key: "ga4", config: { measurement_id: input.ga4_measurement_id } });
    if (input.gtm_container_id) marketing.push({ provider_key: "gtm", config: { container_id: input.gtm_container_id } });
    if (input.google_ads_customer_id) marketing.push({ provider_key: "google_ads", config: { customer_id: input.google_ads_customer_id } });

    for (const item of marketing) {
      const { error } = await admin.from("marketing_integrations").upsert({
        store_id: newStoreId,
        provider_key: item.provider_key,
        is_active: true,
        config: item.config,
        events_enabled: ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"],
      } as never, { onConflict: "store_id,provider_key" });
      if (error) throw error;
    }

    // Google Sheets — canonical singular table.
    if (input.google_sheets_id || input.google_sheets_json) {
      let credentialEncrypted: string | null = null;
      if (input.google_sheets_json) {
        parseServiceAccount(input.google_sheets_json);
        credentialEncrypted = encryptSecret(input.google_sheets_json);
      }
      const { error } = await admin.from("google_sheet_integrations").upsert({
        store_id: newStoreId,
        spreadsheet_id: input.google_sheets_id || null,
        credential_encrypted: credentialEncrypted,
        fields: DEFAULT_SHEET_FIELDS,
        is_active: Boolean(input.google_sheets_id && credentialEncrypted),
        last_status: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id" });
      if (error) throw error;
    }

    // Telegram
    if (input.telegram_bot_token || input.telegram_chat_id) {
      if (!input.telegram_bot_token || !input.telegram_chat_id) {
        throw err("VALIDATION", "Telegram : le bot token et le chat ID doivent être renseignés ensemble.");
      }
      const { error } = await admin.from("telegram_integrations").upsert({
        store_id: newStoreId,
        bot_token_encrypted: encryptSecret(input.telegram_bot_token),
        chat_id: input.telegram_chat_id,
        enabled_events: ["new_order", "cancelled", "delivered", "low_stock", "delivery_error"],
        is_active: true,
        status: "pending",
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "store_id" });
      if (error) throw error;
    }

    // Custom domain: pending until DNS TXT verification succeeds.
    if (input.custom_domain) {
      const hostname = input.custom_domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
      if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(hostname)) {
        throw err("VALIDATION", "Nom de domaine personnalisé invalide.");
      }
      const { error } = await admin.from("domains").insert({
        store_id: newStoreId,
        hostname,
        is_primary: false,
        status: "pending",
        verification_token: generateToken(24),
      } as never);
      if (error) throw error;
    }

    // Publish every page snapshot if requested, then activate the store.
    if (input.publish_mode !== "draft") {
      const { data: createdPages, error: pageErr } = await admin
        .from("pages")
        .select("key, version")
        .eq("store_id", newStoreId);
      if (pageErr) throw pageErr;

      for (const page of (createdPages ?? []) as Array<{ key: string; version: number }>) {
        const { error: publishErr } = await (admin.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: { message?: string } | null }>)("fn_publish_page", {
          p_store_id: newStoreId,
          p_page_key: page.key,
          p_expected_version: page.version,
          p_actor_id: ctx.user.id,
        });
        if (publishErr) throw publishErr;
      }

      const { error: statusErr } = await admin
        .from("stores")
        .update({ status: "active", updated_at: new Date().toISOString() } as never)
        .eq("id", newStoreId);
      if (statusErr) throw statusErr;
    }

    await logAudit({
      actorId: ctx.user.id,
      storeId: newStoreId,
      action: "store.created",
      entity: "store",
      entityId: newStoreId,
      metadata: {
        name: input.business_name,
        slug: finalSlug,
        template: templateKey,
        type: input.website_type,
        publish_mode: input.publish_mode,
        owner_attached: Boolean(ownerUserId),
        shipping_provider: input.shipping_provider,
        domain_requested: Boolean(input.custom_domain),
        sheets_configured: Boolean(input.google_sheets_id),
        telegram_configured: Boolean(input.telegram_bot_token),
      },
    });

    return NextResponse.json({
      ok: true,
      store_id: newStoreId,
      slug: finalSlug,
      preview_url: `/s/${finalSlug}`,
      status: input.publish_mode === "draft" ? "draft" : "active",
      merchant_account: ownerUserId ? "attached" : "pending",
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
