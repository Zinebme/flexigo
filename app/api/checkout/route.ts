import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAnonSupabase } from "../../../lib/supabase/anon";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { resolveStoreBySlug } from "../../../lib/storefront/resolve";
import { hit, clientIpFromHeaders } from "../../../lib/rate-limit";
import { normalizeDZPhone } from "../../../lib/phone";
import { toErrorResponse } from "../../../lib/errors";
import { notifyTelegramEvent } from "../../../lib/integrations/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const checkoutBody = z.object({
  store_slug: z.string().trim().min(1).max(80),
  lines: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(50),
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
  INVALID_QUANTITY: "Quantité invalide.",
  PRODUCT_NOT_FOUND: "Un article n'est plus disponible.",
  VARIANT_NOT_FOUND: "Cette variante n'est plus disponible.",
  OUT_OF_STOCK: "Stock insuffisant pour cette quantité.",
};

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
    const parsed = checkoutBody.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return Response.json({ ok: false, error: first?.message ?? "Demande invalide." }, { status: 400 });
    }
    const body = parsed.data;

    // Rate limit per IP (anti-spam / anti-automation).
    const ip = clientIpFromHeaders(req.headers);
    const rl = hit(`checkout:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return Response.json(
        { ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterMs / 1000) } },
      );
    }

    // Honeypot: bots fill the hidden field.
    if ((body.website ?? "").trim() !== "") {
      return Response.json({ ok: false, error: "Demande invalide." }, { status: 400 });
    }

    // Phone must normalize to a valid Algerian number.
    const normalized = normalizeDZPhone(body.phone);
    if (!normalized) {
      return Response.json({ ok: false, error: MESSAGES.INVALID_PHONE }, { status: 400 });
    }

    // Store must exist and be active.
    const store = await resolveStoreBySlug(body.store_slug);
    if (!store || store.status !== "active") {
      return Response.json({ ok: false, error: MESSAGES.STORE_NOT_ACTIVE }, { status: 400 });
    }

    const anon = getAnonSupabase();

    // Duplicate detection (same phone + same lines within 10 minutes).
    const dup = await detectDuplicate(getAdminSupabase(), store.id, normalized, body.lines);
    if (dup) {
      return Response.json(
        { ok: false, error: "Cette commande vient d'être enregistrée. Évitez d'envoyer le formulaire deux fois." },
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
      p_office: body.office ?? null,
      p_utm_source: body.utm_source ?? null,
      p_utm_medium: body.utm_medium ?? null,
      p_utm_campaign: body.utm_campaign ?? null,
      p_referrer: body.referrer ?? null,
      p_source: "storefront",
    });

    if (error) {
      const code = (String(error.message ?? "").split("\n")[0] ?? "").split(":")[0]?.trim() ?? "";
      return Response.json({ ok: false, error: MESSAGES[code] ?? "Une erreur est survenue. Réessayez." }, { status: 400 });
    }
    const out = data as { order_id: string; order_number: string; subtotal_cents: number; shipping_fee_cents: number; total_cents: number; status: string };

    // Async Telegram notification (non-blocking for checkout, errors logged internally)
    // Fire-and-forget but await in background to ensure logging
    void (async () => {
      try {
        await notifyTelegramEvent({
          storeId: store.id,
          event: "new_order",
          payload: {
            orderNumber: Number(out.order_number),
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
