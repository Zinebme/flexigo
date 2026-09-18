import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/auth/admin-context";
import { toErrorResponse } from "@/lib/errors";
import { encryptSecret } from "@/lib/crypto/encrypt";
import { validateBotTokenFormat, validateChatId, testTelegramConnection, type TelegramEvent } from "@/lib/integrations/telegram";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EVENTS: TelegramEvent[] = ["new_order", "cancelled", "delivered", "low_stock", "delivery_error"];

const bodySchema = z.object({
  bot_token: z.string().trim().max(500).optional().or(z.literal("")).nullable(),
  chat_id: z.string().trim().max(100),
  enabled_events: z.array(z.string()).max(10).default(["new_order"]),
  is_active: z.boolean().default(true),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCtx = await getAdminContext();
    const { id } = await params;
    const admin = getAdminSupabase();

    const { data: row, error } = await admin
      .from("telegram_integrations")
      .select("chat_id, enabled_events, is_active, status, last_error, last_test_at, created_at")
      .eq("store_id", id)
      .maybeSingle();
    if (error) throw error;

    void adminCtx;
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
            created_at: (row as { created_at: string }).created_at,
            has_token: true,
          }
        : null,
      available_events: EVENTS,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCtx = await getAdminContext();
    const { id } = await params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown>;
    const input = bodySchema.parse(body);
    const admin = getAdminSupabase();

    const { data: current } = await admin
      .from("telegram_integrations")
      .select("bot_token_encrypted")
      .eq("store_id", id)
      .maybeSingle();
    const currentEnc = (current as { bot_token_encrypted: string | null } | null)?.bot_token_encrypted ?? null;

    let tokenEnc: string | null = currentEnc;
    const rawToken = (input.bot_token ?? "").trim();
    if (rawToken.length > 0) {
      if (!validateBotTokenFormat(rawToken)) throw new Error("Format token invalide");
      tokenEnc = encryptSecret(rawToken);
    }
    if (!tokenEnc) throw new Error("Token requis");

    if (!validateChatId(input.chat_id)) throw new Error("Chat ID invalide");
    const events = input.enabled_events.filter((e) => EVENTS.includes(e as TelegramEvent)) as TelegramEvent[];

    const { error } = await admin.from("telegram_integrations").upsert(
      {
        store_id: id,
        bot_token_encrypted: tokenEnc,
        chat_id: input.chat_id,
        enabled_events: events,
        is_active: input.is_active,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id" },
    );
    if (error) throw error;

    void logAudit({
      actorId: adminCtx.user.id,
      storeId: id,
      action: "integration.changed",
      entity: "telegram_integration",
      entityId: id,
      supportSessionId: null,
      metadata: { chat_id: input.chat_id, events, is_active: input.is_active, admin: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCtx = await getAdminContext();
    const { id } = await params;
    const admin = getAdminSupabase();
    const { error } = await admin.from("telegram_integrations").delete().eq("store_id", id);
    if (error) throw error;

    void logAudit({
      actorId: adminCtx.user.id,
      storeId: id,
      action: "integration.reset",
      entity: "telegram_integration",
      entityId: id,
      supportSessionId: null,
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

// Test endpoint via POST with ?action=test
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getAdminContext();
    const { id } = await params;
    const admin = getAdminSupabase();

    const { data: row, error } = await admin
      .from("telegram_integrations")
      .select("bot_token_encrypted, chat_id")
      .eq("store_id", id)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Non configuré");

    const result = await testTelegramConnection({
      botTokenEncrypted: (row as { bot_token_encrypted: string }).bot_token_encrypted,
      chatId: (row as { chat_id: string }).chat_id,
    });

    const now = new Date().toISOString();
    await admin.from("telegram_integrations").update({
      status: result.ok ? "connected" : "error",
      last_error: result.ok ? null : (result.error ?? "Erreur").slice(0, 500),
      last_test_at: now,
      updated_at: now,
    }).eq("store_id", id);

    await admin.from("integration_logs").insert({
      store_id: id,
      integration_type: "telegram",
      action: "test",
      status: result.ok ? "success" : "failure",
      message: result.ok ? `Connecté @${result.botInfo?.username}` : (result.error ?? "Test échoué"),
      details: result.botInfo ? { bot: result.botInfo } : null,
      created_at: now,
    });

    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, bot: result.botInfo });
  } catch (e) {
    return toErrorResponse(e);
  }
}
