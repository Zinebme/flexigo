/**
 * Telegram integration — server-side ONLY.
 * Bot token is stored ENCRYPTED (fxenc1) in telegram_integrations.bot_token_encrypted
 * and only decrypted here. Never returned to browser.
 *
 * Events: new_order, cancelled, delivered, low_stock, delivery_error
 */

import { getAdminSupabase } from "../supabase/admin";
import { decryptSecret, encryptSecret } from "../crypto/encrypt";

export type TelegramEvent = "new_order" | "cancelled" | "delivered" | "low_stock" | "delivery_error";

export interface TelegramIntegration {
  id: string;
  store_id: string;
  chat_id: string;
  enabled_events: TelegramEvent[];
  is_active: boolean;
  status: "pending" | "connected" | "error";
  last_error: string | null;
  last_test_at: string | null;
}

const TELEGRAM_API = "https://api.telegram.org";

function getBotToken(encrypted: string | null): string | null {
  if (!encrypted) return null;
  return decryptSecret(encrypted);
}

export async function sendTelegramMessage(args: {
  botTokenEncrypted: string;
  chatId: string;
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
}): Promise<{ ok: boolean; error?: string }> {
  const token = getBotToken(args.botTokenEncrypted);
  if (!token) return { ok: false, error: "Token Telegram invalide" };

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: args.chatId,
        text: args.text,
        parse_mode: args.parseMode ?? "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau Telegram" };
  }
}

export async function testTelegramConnection(args: {
  botTokenEncrypted: string;
  chatId: string;
}): Promise<{ ok: boolean; error?: string; botInfo?: { username: string; first_name: string } }> {
  const token = getBotToken(args.botTokenEncrypted);
  if (!token) return { ok: false, error: "Token invalide" };

  try {
    // First getMe to validate token
    const meRes = await fetch(`${TELEGRAM_API}/bot${token}/getMe`);
    const meData = (await meRes.json().catch(() => ({}))) as { ok?: boolean; result?: { username: string; first_name: string }; description?: string };
    if (!meRes.ok || !meData.ok || !meData.result) {
      return { ok: false, error: meData.description ?? `Token invalide (HTTP ${meRes.status})` };
    }

    // Then send test message
    const sendRes = await sendTelegramMessage({
      botTokenEncrypted: args.botTokenEncrypted,
      chatId: args.chatId,
      text: `✅ <b>FlexiGo — Test Telegram</b>\n\nBot connecté avec succès : @${meData.result.username}\nChat ID : <code>${args.chatId}</code>\n\nVous recevrez les notifications de commandes ici.`,
      parseMode: "HTML",
    });

    if (!sendRes.ok) {
      return { ok: false, error: sendRes.error, botInfo: meData.result };
    }

    return { ok: true, botInfo: meData.result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

export async function notifyTelegramEvent(args: {
  storeId: string;
  event: TelegramEvent;
  payload: {
    orderNumber?: string | number;
    customerName?: string;
    totalCents?: number;
    wilaya?: string;
    productName?: string;
    stockQty?: number;
    errorMessage?: string;
  };
}): Promise<void> {
  const admin = getAdminSupabase();
  const { data: integration } = await admin
    .from("telegram_integrations")
    .select("bot_token_encrypted, chat_id, enabled_events, is_active, status")
    .eq("store_id", args.storeId)
    .eq("is_active", true)
    .single();

  if (!integration) return;
  const events = integration.enabled_events as TelegramEvent[];
  if (!events.includes(args.event)) return;

  let text = "";
  switch (args.event) {
    case "new_order":
      text = `🛒 <b>Nouvelle commande #${args.payload.orderNumber ?? "?"}</b>\n\n` +
        `👤 ${args.payload.customerName ?? "Client"}\n` +
        `📍 ${args.payload.wilaya ?? ""}\n` +
        `💰 ${args.payload.totalCents ? (args.payload.totalCents / 100).toFixed(2) + " DA" : ""}\n\n` +
        `<i>FlexiGo — vérifiez votre dashboard</i>`;
      break;
    case "cancelled":
      text = `❌ <b>Commande annulée #${args.payload.orderNumber ?? "?"}</b>\n\n${args.payload.customerName ?? ""}`;
      break;
    case "delivered":
      text = `✅ <b>Commande livrée #${args.payload.orderNumber ?? "?"}</b>\n\n${args.payload.customerName ?? ""} — ${args.payload.totalCents ? (args.payload.totalCents / 100).toFixed(2) + " DA" : ""}`;
      break;
    case "low_stock":
      text = `⚠️ <b>Stock faible</b>\n\n${args.payload.productName ?? "Produit"} — reste ${args.payload.stockQty ?? 0} unité(s)`;
      break;
    case "delivery_error":
      text = `🚨 <b>Erreur livraison</b>\n\nCommande #${args.payload.orderNumber ?? "?"} — ${args.payload.errorMessage ?? "erreur inconnue"}`;
      break;
  }

  const result = await sendTelegramMessage({
    botTokenEncrypted: integration.bot_token_encrypted as string,
    chatId: integration.chat_id as string,
    text,
  });

  // Log result
  await admin.from("integration_logs").insert({
    store_id: args.storeId,
    integration_type: "telegram",
    action: args.event,
    status: result.ok ? "success" : "failure",
    message: result.ok ? text.slice(0, 200) : (result.error ?? "Échec envoi Telegram"),
    details: { event: args.event, chat_id: integration.chat_id },
    created_at: new Date().toISOString(),
  });

  if (!result.ok) {
    await admin.from("telegram_integrations").update({
      status: "error",
      last_error: (result.error ?? "Erreur inconnue").slice(0, 500),
    }).eq("store_id", args.storeId);
  }
}

export function encryptBotToken(token: string): string {
  return encryptSecret(token);
}

export function validateBotTokenFormat(token: string): boolean {
  // Telegram bot tokens: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
  return /^\d+:[A-Za-z0-9_-]{30,}$/.test(token);
}

export function validateChatId(chatId: string): boolean {
  // Can be numeric or @channel, but typically numeric for private/group
  return chatId.trim().length > 0 && chatId.trim().length < 100;
}
