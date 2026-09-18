import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse } from "@/lib/errors";
import { encryptSecret } from "@/lib/crypto/encrypt";
import { validateBotTokenFormat, validateChatId, type TelegramEvent } from "@/lib/integrations/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EVENTS: TelegramEvent[] = ["new_order", "cancelled", "delivered", "low_stock", "delivery_error"];

const bodySchema = z.object({
  bot_token: z.string().trim().max(500).optional().or(z.literal("")).nullable(),
  chat_id: z.string().trim().max(100).optional().or(z.literal("")).nullable(),
  enabled_events: z.array(z.string()).max(10).default(["new_order"]),
  is_active: z.boolean().default(true),
});

export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");

    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = bodySchema.parse(body);
    const admin = getAdminSupabase();

    const { data: current } = await admin
      .from("telegram_integrations")
      .select("bot_token_encrypted")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    const currentEnc = (current as { bot_token_encrypted: string | null } | null)?.bot_token_encrypted ?? null;

    let tokenEnc: string | null = currentEnc;
    const rawToken = (input.bot_token ?? "").trim();
    if (rawToken.length > 0) {
      if (!validateBotTokenFormat(rawToken)) {
        throw new Error("Format du token Telegram invalide. Exemple : 123456:ABC-DEF1234ghIkl...");
      }
      tokenEnc = encryptSecret(rawToken);
    }

    if (!tokenEnc) {
      throw new Error("Token Telegram requis.");
    }

    const chatId = (input.chat_id ?? "").trim();
    if (!chatId) throw new Error("Chat ID requis.");
    if (!validateChatId(chatId)) throw new Error("Chat ID invalide.");

    const events = input.enabled_events.filter((e) => EVENTS.includes(e as TelegramEvent)) as TelegramEvent[];
    if (events.length === 0) throw new Error("Au moins un événement doit être sélectionné.");

    const { error } = await admin
      .from("telegram_integrations")
      .upsert(
        {
          store_id: ctx.store.id,
          bot_token_encrypted: tokenEnc,
          chat_id: chatId,
          enabled_events: events,
          is_active: input.is_active,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id", ignoreDuplicates: false },
      );
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.changed",
      entity: "telegram_integration",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { chat_id: chatId, events, is_active: input.is_active, token_updated: rawToken.length > 0 },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function GET() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");
    const admin = getAdminSupabase();

    const { data: row, error } = await admin
      .from("telegram_integrations")
      .select("chat_id, enabled_events, is_active, status, last_error, last_test_at")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      integration: row
        ? {
            chat_id: (row as { chat_id: string }).chat_id,
            enabled_events: (row as { enabled_events: TelegramEvent[] }).enabled_events,
            is_active: (row as { is_active: boolean }).is_active,
            status: (row as { status: string }).status,
            last_error: (row as { last_error: string | null }).last_error,
            last_test_at: (row as { last_test_at: string | null }).last_test_at,
            has_token: true,
          }
        : null,
      available_events: EVENTS,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");
    const admin = getAdminSupabase();

    const { error } = await admin.from("telegram_integrations").delete().eq("store_id", ctx.store.id);
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "integration.reset",
      entity: "telegram_integration",
      entityId: ctx.store.id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
