import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { wizardSchema, parseBody } from "@/lib/schemas";
import { slugify, isValidSlug } from "@/lib/slug";
import { getTemplate, defaultPages, defaultSettings, defaultShippingZones } from "@/lib/templates/defaults";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/stores — wizard de création de site (SUPER_ADMIN only).
 *
 * Flux:
 * 1. Valide le payload avec wizardSchema (8 étapes côté client).
 * 2. Résout le propriétaire: owner_email DOIT correspondre à un profil existant.
 *    Message français clair si absent: "le client doit d'abord créer son compte".
 * 3. Organisation: utilise organization_id si fourni, sinon crée une nouvelle org
 *    si create_new_client=true (nom = client_name).
 * 4. Génère le slug (business_name → slugify) + vérifie unicité.
 * 5. Appelle fn_create_store (service_role) — crée store, theme, membership OWNER,
 *    pages (v0), shipping_zones, store_counters.
 * 6. Insère catégories / produits initiaux si fournis (prix DA → cents).
 * 7. Configure les pixels marketing si fournis (marketing_integrations).
 * 8. Audit + retour {ok, store_id, slug, preview_url}.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const raw = await req.json().catch(() => null);
    const input = parseBody(wizardSchema, raw);

    const admin = getAdminSupabase();

    // --- template validation ---
    const tpl = getTemplate(input.template_key);
    if (!tpl) throw err("VALIDATION", "Modèle invalide.");
    if (!tpl.websiteTypes.includes(input.website_type as never)) {
      throw err("VALIDATION", `Le modèle ${tpl.name} n'est pas compatible avec le type ${input.website_type}.`);
    }

    // --- owner lookup ---
    let ownerUserId: string | null = null;
    if (input.owner_email) {
      const { data: prof } = await admin.from("profiles").select("id, email").ilike("email", input.owner_email.trim()).maybeSingle();
      if (!prof) {
        throw err("NOT_FOUND", "Le client doit d'abord créer son compte (email introuvable). Demandez-lui de s'inscrire puis réessayez.");
      }
      ownerUserId = (prof as { id: string }).id;
    } else {
      throw err("VALIDATION", "Email du propriétaire requis — le client doit d'abord créer son compte.");
    }

    // --- organization ---
    let organizationId: string | null = (input.organization_id as string | null) ?? null;
    if (!organizationId && input.create_new_client) {
      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({ name: input.client_name })
        .select("id")
        .single();
      if (orgErr) throw orgErr;
      organizationId = (org as { id: string }).id;
    }
    if (!organizationId) {
      // Fallback: try to find org by name (idempotent) or require one
      const { data: existingOrg } = await admin.from("organizations").select("id").ilike("name", input.client_name).maybeSingle();
      if (existingOrg) organizationId = (existingOrg as { id: string }).id;
      else throw err("VALIDATION", "Organisation requise — créez un nouveau client ou sélectionnez une organisation existante.");
    }

    // --- slug ---
    const rawSlug = (input.slug?.trim() || slugify(input.business_name) || "").toLowerCase();
    const finalSlug = rawSlug.slice(0, 80);
    if (!isValidSlug(finalSlug)) throw err("VALIDATION", "Slug invalide — utilisez uniquement lettres minuscules, chiffres et tirets (ex: maison-almasa).");
    const { data: clash } = await admin.from("stores").select("id").eq("slug", finalSlug).is("deleted_at", null).maybeSingle();
    if (clash) throw err("CONFLICT", `Slug « ${finalSlug} » déjà utilisé.`);

    // --- identity / settings / pages / zones ---
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
      whatsapp: input.whatsapp || null,
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
    };

    const settings = defaultSettings(contact as Record<string, string | null>, business);
    const pages = defaultPages(input.template_key, input.website_type as never, input.business_name).map((p) => ({
      key: p.key,
      title: p.title,
      content: p.content,
    }));

    const homeFee = typeof input.default_home_fee === "number" ? input.default_home_fee : 400;
    const officeFee = typeof input.default_office_fee === "number" ? input.default_office_fee : 600;
    const zones = defaultShippingZones(homeFee, officeFee);

    // --- fn_create_store (service_role RPC) ---
    const { data: storeId, error: rpcErr } = await (admin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)(
      "fn_create_store",
      {
        p_organization_id: organizationId,
        p_name: input.business_name,
        p_slug: finalSlug,
        p_website_type: input.website_type,
        p_template_key: input.template_key,
        p_language: input.language || "fr",
        p_currency: input.currency || "DZD",
        p_identity: identity,
        p_settings: settings,
        p_pages: pages,
        p_zones: zones,
        p_owner_user_id: ownerUserId,
        p_creator_id: ctx.user.id,
      },
    );
    if (rpcErr) {
      const msg = (rpcErr as { message?: string }).message ?? "";
      if (msg.includes("SLUG_TAKEN")) throw err("CONFLICT", `Slug « ${finalSlug} » déjà utilisé.`);
      if (msg.includes("OWNER_NOT_FOUND")) throw err("NOT_FOUND", "Le client doit d'abord créer son compte.");
      if (msg.includes("TEMPLATE_NOT_FOUND")) throw err("NOT_FOUND", "Modèle introuvable.");
      if (msg.includes("INVALID_SLUG")) throw err("VALIDATION", "Slug invalide.");
      throw rpcErr;
    }

    const newStoreId = storeId as string;

    // --- initial categories ---
    if (input.initial_categories?.length) {
      const cats = input.initial_categories.slice(0, 10).map((c, idx) => ({
        store_id: newStoreId,
        name: c.name,
        slug: slugify(c.name),
        position: idx,
      }));
      // insert ignoring duplicates
      for (const cat of cats) {
        await admin.from("categories").insert(cat).select().maybeSingle().then(() => {});
      }
    }

    // --- initial products ---
    if (input.initial_products?.length) {
      // Resolve category slugs to ids
      const { data: allCats } = await admin.from("categories").select("id, name").eq("store_id", newStoreId);
      const catMap = new Map<string, string>();
      for (const c of (allCats ?? []) as Array<{ id: string; name: string }>) catMap.set(c.name.toLowerCase(), c.id);

      for (const p of input.initial_products.slice(0, 20)) {
        const priceCents = Math.round((p.price as number) * 100);
        let categoryId: string | null = null;
        if (p.category) categoryId = catMap.get(p.category.toLowerCase()) ?? null;
        const prodInsert = {
          store_id: newStoreId,
          category_id: categoryId,
          name: p.name,
          slug: `${slugify(p.name)}-${Math.random().toString(36).slice(2, 6)}`,
          description: p.description || null,
          price_cents: priceCents,
          stock: typeof p.stock === "number" ? p.stock : 0,
          is_active: false,
          is_featured: false,
        };
        const { data: prodRow, error: prodErr } = await admin.from("products").insert(prodInsert).select("id").single();
        if (prodErr) continue;
        const prodId = (prodRow as { id: string }).id;
        if (p.image_url) {
          await admin.from("product_images").insert({
            product_id: prodId,
            store_id: newStoreId,
            url: p.image_url,
            position: 0,
          });
        }
      }
    }

    // --- marketing integrations (config only, no code) ---
    const marketing: Array<{ provider_key: string; config: Record<string, string>; is_active: boolean }> = [];
    if (input.meta_pixel_id) marketing.push({ provider_key: "meta_pixel", config: { pixel_id: input.meta_pixel_id }, is_active: true });
    if (input.tiktok_pixel_id) marketing.push({ provider_key: "tiktok_pixel", config: { pixel_id: input.tiktok_pixel_id }, is_active: true });
    if (input.ga4_measurement_id) marketing.push({ provider_key: "ga4", config: { measurement_id: input.ga4_measurement_id }, is_active: true });
    if (input.gtm_container_id) marketing.push({ provider_key: "gtm", config: { container_id: input.gtm_container_id }, is_active: true });
    if (input.google_ads_customer_id) marketing.push({ provider_key: "google_ads", config: { customer_id: input.google_ads_customer_id }, is_active: true });

    for (const m of marketing) {
      await admin.from("marketing_integrations").upsert({
        store_id: newStoreId,
        provider_key: m.provider_key,
        is_active: m.is_active,
        config: m.config,
      } as never, { onConflict: "store_id,provider_key" });
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: newStoreId,
      action: "store.created",
      entity: "store",
      entityId: newStoreId,
      metadata: { name: input.business_name, slug: finalSlug, template: input.template_key, type: input.website_type },
    });

    return NextResponse.json({
      ok: true,
      store_id: newStoreId,
      slug: finalSlug,
      preview_url: `/s/${finalSlug}`,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
