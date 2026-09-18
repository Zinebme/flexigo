import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse } from "@/lib/errors";
import { testTelegramConnection } from "@/lib/integrations/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "marketing.manage");
    const admin = getAdminSupabase();

    const { data: row, error } = await admin
      .from("telegram_integrations")
      .select("bot_token_encrypted, chat_id")
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Intégration Telegram non configurée.");

    const result = await testTelegramConnection({
      botTokenEncrypted: (row as { bot_token_encrypted: string }).bot_token_encrypted,
      chatId: (row as { chat_id: string }).chat_id,
    });

    const now = new Date().toISOString();
    await admin.from("telegram_integrations").update({
      status: result.ok ? "connected" : "error",
      last_error: result.ok ? null : (result.error ?? "Erreur inconnue").slice(0, 500),
      last_test_at: now,
      updated_at: now,
    }).eq("store_id", ctx.store.id);

    await admin.from("integration_logs").insert({
      store_id: ctx.store.id,
      integration_type: "telegram",
      action: "test",
      status: result.ok ? "success" : "failure",
      message: result.ok ? `Connecté @${result.botInfo?.username}` : (result.error ?? "Test échoué"),
      details: result.botInfo ? { bot: result.botInfo } : null,
      created_at: now,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, bot: result.botInfo });
  } catch (e) {
    return toErrorResponse(e);
  }
}
