import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAnonSupabase } from "../../../lib/supabase/anon";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getAvailableOffices, isOfficeDeliveryAvailable } from "../../../lib/providers/shipping/offices";
import { resolveStoreBySlug } from "../../../lib/storefront/resolve";
import { hit, clientIpFromHeaders } from "../../../lib/rate-limit";
import { normalizeDZPhone } from "../../../lib/phone";
import { toErrorResponse } from "../../../lib/errors";
import { notifyTelegramEvent } from "../../../lib/integrations/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const checkoutBody = z.object({
  store_slug: z.string().trim().min(1).max(80),
  abandoned_session_key: z.string().uuid().optional(),
  lines: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(50),
        selected_options: z.record(z.string().max(40), z.array(z.string().max(60)).max(40)).optional(),
      }),
    )
    .min(1)
    .max(10),
  full_name: z.string().trim().min(3).max(80),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(120).optional().or(z.literal("")).nullable(),
  wilaya_code: z.number().int().min(1).max(58),
  commune: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
  delivery_type: z.enum(["home", "office"]).default("home"),
  office: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  utm_source: z.string().max(100).optional().or(z.literal("")).nullable(),
  utm_medium: z.string().max(100).optional().or(z.literal("")).nullable(),
  utm_campaign: z.string().max(100).optional().or(z.literal("")).nullable(),
  referrer: z.string().max(500).optional().or(z.literal("")).nullable(),
  // Honeypot — must remain empty for humans.
  website: z.string().max(200).optional().or(z.literal("")).nullable(),
  /**
   * Optional response locale (additive). Absent → historical French messages,
   * so every existing caller keeps byte-identical behavior. SOUQ (Arabic-first)
   * sends "ar" and receives Arabic messages instead of French ones.
   */
  locale: z.enum(["fr", "ar", "en"]).optional(),
});

/** Stable machine codes raised by fn_place_cod_order → French messages. */
const MESSAGES: Record<string, string> = {
  STORE_NOT_FOUND: "Ce site n'existe pas.",
  STORE_NOT_ACTIVE: "Ce site ne prend pas de commandes en ligne pour le moment.",
  COD_DISABLED: "Le paiement à la livraison est désactivé sur ce site.",
  EMPTY_CART: "Votre panier est vide.",
  TOO_MANY_LINES: "10 articles maximum par commande.",
  INVALID_NAME: "Veuillez indiquer votre nom complet.",
  INVALID_COMMUNE: "Veuillez indiquer votre commune.",
  INVALID_PHONE: "Numéro de téléphone invalide.",
  INVALID_MOBILE: "Merci d'indiquer un numéro de mobile algérien.",
  CUSTOMER_SUSPENDED: "Ce numéro ne peut pas passer de nouvelle commande. Contactez la boutique si vous pensez qu’il s’agit d’une erreur.",
  INVALID_QUANTITY: "Quantité invalide.",
  PRODUCT_NOT_FOUND: "Un article n'est plus disponible.",
  VARIANT_NOT_FOUND: "Cette variante n'est plus disponible.",
  OUT_OF_STOCK: "Stock insuffisant pour cette quantité.",
};

/** Same stable machine codes, Arabic wording (SOUQ storefront). */
const MESSAGES_AR: Record<string, string> = {
  STORE_NOT_FOUND: "هذا الموقع غير موجود.",
  STORE_NOT_ACTIVE: "هذا الموقع لا يستقبل طلبات حالياً.",
  COD_DISABLED: "الدفع عند الاستلام غير مفعّل في هذا المتجر.",
  EMPTY_CART: "سلتك فارغة.",
  TOO_MANY_LINES: "الحد الأقصى 10 منتجات في الطلب الواحد.",
  INVALID_NAME: "يرجى إدخال الاسم واللقب.",
  INVALID_COMMUNE: "يرجى إدخال البلدية.",
  INVALID_PHONE: "يرجى إدخال رقم هاتف صحيح",
  INVALID_MOBILE: "يرجى إدخال رقم هاتف محمول جزائري صحيح (05/06/07)",
  CUSTOMER_SUSPENDED: "لا يمكن لهذا الرقم إرسال طلب جديد. تواصل مع المتجر إذا كنت تعتقد أن هناك خطأ.",
  INVALID_QUANTITY: "الكمية غير صحيحة.",
  PRODUCT_NOT_FOUND: "هذا المنتج لم يعد متوفراً.",
  VARIANT_NOT_FOUND: "هذه المواصفات لم تعد متوفرة.",
  OUT_OF_STOCK: "هذا المنتج غير متوفر حالياً",
};

const GENERIC_AR = "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى";
const VALIDATION_AR = "يرجى التحقق من المعلومات المدخلة";

function messageFor(code: string, locale: string | undefined): string {
  if (locale === "ar") return MESSAGES_AR[code] ?? GENERIC_AR;
  return MESSAGES[code] ?? "Une erreur est survenue. Réessayez.";
}

async function detectDuplicate(service: ReturnType<typeof getAdminSupabase>, storeId: string, phone: string, lines: z.infer<typeof checkoutBody>["lines"]): Promise<boolean> {
  // Server-side check with the service client: the anon role cannot read
  // orders (RLS), and duplicate detection must not be bypassable.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await service
    .from("orders")
    .select("id")
    .eq("store_id", storeId)
    .eq("normalized_phone", phone)
    .gte("created_at", since)
    .limit(20);
  if (!recent || recent.length === 0) return false;
  const ids = recent.map((o) => o.id);
  const { data: items } = await service
    .from("order_items")
    .select("product_id, variant_id")
    .in("order_id", ids);
  const wanted = new Set(lines.map((l) => `${l.product_id}:${l.variant_id ?? ""}`));
  return (items ?? []).some((it) => wanted.has(`${it.product_id}:${it.variant_id ?? ""}`));
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const requestedLocale =
      raw && typeof raw === "object" && "locale" in raw && (raw as { locale?: unknown }).locale === "ar" ? "ar" : undefined;
    const parsed = checkoutBody.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return Response.json(
        { ok: false, error: requestedLocale === "ar" ? VALIDATION_AR : first?.message ?? "Demande invalide." },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const locale = body.locale;

    // Rate limit per IP (anti-spam / anti-automation).
    const ip = clientIpFromHeaders(req.headers);
    const rl = hit(`checkout:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return Response.json(
        { ok: false, error: locale === "ar" ? "تم إرسال عدة طلبات من نفس الجهاز، حاول بعد قليل" : "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterMs / 1000) } },
      );
    }

    // Honeypot: bots fill the hidden field.
    if ((body.website ?? "").trim() !== "") {
      return Response.json({ ok: false, error: locale === "ar" ? VALIDATION_AR : "Demande invalide." }, { status: 400 });
    }

    // Phone must normalize to a valid Algerian number.
    const normalized = normalizeDZPhone(body.phone);
    if (!normalized) {
      return Response.json({ ok: false, error: messageFor("INVALID_PHONE", locale) }, { status: 400 });
    }

    // Store must exist and be active.
    const store = await resolveStoreBySlug(body.store_slug);
    if (!store || store.status !== "active") {
      return Response.json({ ok: false, error: messageFor("STORE_NOT_ACTIVE", locale) }, { status: 400 });
    }

    let selectedOffice: string | null = null;
    if (body.delivery_type === "office") {
      if (!await isOfficeDeliveryAvailable(store.id, body.wilaya_code)) {
        return Response.json({ ok: false, error: locale === "ar" ? "التوصيل إلى المكتب غير متاح لهذه الولاية حالياً" : "Aucun bureau de livraison disponible pour cette wilaya." }, { status: 400 });
      }
      const offices = await getAvailableOffices(store.id, body.wilaya_code);
      if (offices.length > 0) {
        const selected = offices.find((office) => office.value === body.office);
        if (!selected) return Response.json({ ok: false, error: locale === "ar" ? "يرجى اختيار مكتب الاستلام" : "Choisissez un bureau de retrait." }, { status: 400 });
        selectedOffice = `${selected.name} — ${selected.address}`.slice(0, 120);
      } else if (body.office) {
        return Response.json({ ok: false, error: locale === "ar" ? "مكتب غير متاح" : "Bureau non disponible." }, { status: 400 });
      }
    }

    const service = getAdminSupabase();
    const { data: suspendedCustomer, error: customerStatusError } = await service
      .from("customers")
      .select("id")
      .eq("store_id", store.id)
      .eq("normalized_phone", normalized)
      .eq("status", "suspended")
      .is("deleted_at", null)
      .maybeSingle();
    if (customerStatusError) throw customerStatusError;
    if (suspendedCustomer) {
      return Response.json({ ok: false, error: messageFor("CUSTOMER_SUSPENDED", locale) }, { status: 403 });
    }

    const anon = getAnonSupabase();

    // Revalidate buyer choices against the product's saved rules. Client-side
    // limits are only a convenience and must never authorize an order.
    const productIds = [...new Set(body.lines.map((line) => line.product_id))];
    const { data: products, error: productsError } = await service.from("products")
      .select("id, store_id, option_groups, free_shipping")
      .eq("store_id", store.id).is("deleted_at", null).in("id", productIds);
    if (productsError) throw productsError;
    const productMap = new Map((products ?? []).map((product) => [product.id, product]));
    for (const line of body.lines) {
      const product = productMap.get(line.product_id);
      if (!product) return Response.json({ ok: false, error: messageFor("PRODUCT_NOT_FOUND", locale) }, { status: 400 });
      const configured = Array.isArray(product.option_groups) ? product.option_groups as Array<Record<string, unknown>> : [];
      const selected = line.selected_options ?? {};
      const allowedKeys = new Set(configured.filter((group) => group.selection_mode === "multiple").map((group) => String(group.key)));
      if (Object.keys(selected).some((key) => !allowedKeys.has(key))) return Response.json({ ok: false, error: messageFor("INVALID_QUANTITY", locale) }, { status: 400 });
      for (const group of configured) {
        if (group.selection_mode !== "multiple") continue;
        const key = String(group.key);
        const values = selected[key] ?? [];
        const allowed = new Set((Array.isArray(group.values) ? group.values : []).map((value) => String((value as { value?: unknown }).value ?? "")));
        if (values.length !== new Set(values).size || values.some((value) => !allowed.has(value))) return Response.json({ ok: false, error: messageFor("INVALID_QUANTITY", locale) }, { status: 400 });
        const exact = group.selection_count_mode === "order_quantity";
        if (group.required === false && values.length === 0) continue;
        const min = exact ? line.quantity : Number(group.min_selections ?? (group.required ? 1 : 0));
        const max = exact ? line.quantity : Number(group.max_selections ?? allowed.size);
        if (values.length < min || values.length > max) return Response.json({ ok: false, error: messageFor("INVALID_QUANTITY", locale) }, { status: 400 });
      }
    }

    // Duplicate detection (same phone + same lines within 10 minutes).
    const dup = await detectDuplicate(service, store.id, normalized, body.lines);
    if (dup) {
      return Response.json(
        {
          ok: false,
          error:
            locale === "ar"
              ? "تم تسجيل طلبك للتو، لا تكرر الإرسال"
              : "Cette commande vient d'être enregistrée. Évitez d'envoyer le formulaire deux fois.",
        },
        { status: 409 },
      );
    }

    // The authoritative pricing + stock logic lives in the database function.
    const { data, error } = await anon.rpc("fn_place_cod_order", {
      p_store_id: store.id,
      p_lines: body.lines.map((l) => ({ product_id: l.product_id, variant_id: l.variant_id ?? null, quantity: l.quantity })),
      p_full_name: body.full_name,
      p_phone: body.phone,
      p_email: body.email ?? null,
      p_wilaya_code: body.wilaya_code,
      p_commune: body.commune,
      p_address: body.address ?? null,
      p_delivery_type: body.delivery_type,
      p_office: selectedOffice,
      p_utm_source: body.utm_source ?? null,
      p_utm_medium: body.utm_medium ?? null,
      p_utm_campaign: body.utm_campaign ?? null,
      p_referrer: body.referrer ?? null,
      p_source: "storefront",
    });

    if (error) {
      const code = (String(error.message ?? "").split("\n")[0] ?? "").split(":")[0]?.trim() ?? "";
      return Response.json({ ok: false, error: messageFor(code, locale) }, { status: 400 });
    }
    const out = data as { order_id: string; order_number: string; subtotal_cents: number; shipping_fee_cents: number; total_cents: number; status: string };

    const selectedLines = body.lines.filter((line) => line.selected_options && Object.keys(line.selected_options).length > 0);
    if (selectedLines.length) {
      const { data: createdItems, error: itemsError } = await service.from("order_items")
        .select("id, product_id, variant_id").eq("order_id", out.order_id);
      if (itemsError) throw itemsError;
      const remaining = [...(createdItems ?? [])];
      for (const line of selectedLines) {
        const index = remaining.findIndex((item) => item.product_id === line.product_id && (item.variant_id ?? null) === (line.variant_id ?? null));
        if (index < 0) continue;
        const [item] = remaining.splice(index, 1);
        if (!item) continue;
        const { error: updateError } = await service.from("order_items").update({ selected_options: line.selected_options ?? {} }).eq("id", item.id);
        if (updateError) throw updateError;
      }
    }

    const { data: offerRows, error: offersError } = await service.from("quantity_offers")
      .select("product_id, min_quantity, free_shipping")
      .eq("store_id", store.id).eq("is_active", true).in("product_id", productIds);
    if (offersError) throw offersError;
    const freeShipping = body.lines.some((line) => {
      if (productMap.get(line.product_id)?.free_shipping) return true;
      const applicable = (offerRows ?? []).filter((offer) => offer.product_id === line.product_id && offer.min_quantity <= line.quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0];
      return applicable?.free_shipping === true;
    });
    if (freeShipping && out.shipping_fee_cents > 0) {
      const { error: feeError } = await service.from("orders").update({ shipping_fee_cents: 0, total_cents: out.total_cents - out.shipping_fee_cents }).eq("store_id", store.id).eq("id", out.order_id);
      if (feeError) throw feeError;
      out.total_cents -= out.shipping_fee_cents;
      out.shipping_fee_cents = 0;
    }
    if (body.abandoned_session_key) {
      await service.from("abandoned_checkouts").update({
        converted_order_id: out.order_id, stage: "converted", reason_code: null, updated_at: new Date().toISOString(),
      }).eq("store_id", store.id).eq("session_key", body.abandoned_session_key);
    }

    // Async Telegram notification (non-blocking for checkout, errors logged internally)
    // Fire-and-forget but await in background to ensure logging
    void (async () => {
      try {
        await notifyTelegramEvent({
          storeId: store.id,
          event: "new_order",
          payload: {
            orderNumber: out.order_number,
            customerName: body.full_name,
            totalCents: out.total_cents,
            wilaya: String(body.wilaya_code),
          },
        });
      } catch {
        // Never fail checkout on notification error
      }
    })();

    return Response.json({
      ok: true,
      order_id: out.order_id,
      order_number: out.order_number,
      subtotal_cents: out.subtotal_cents,
      shipping_fee_cents: out.shipping_fee_cents,
      total_cents: out.total_cents,
      status: out.status,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
