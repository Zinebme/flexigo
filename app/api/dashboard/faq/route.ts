import { NextResponse } from "next/server";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse } from "@/lib/errors";
import { faqSchema, parseBody } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    requireCapability(ctx, "content.manage");
    const input = parseBody(faqSchema, await req.json().catch(() => null));

    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from("faq_items")
      .insert({
        store_id: ctx.store.id,
        question: input.question,
        answer: input.answer,
        position: input.position ?? 0,
        is_visible: input.is_visible ?? true,
      } as never)
      .select("id")
      .single();
    if (error) throw error;

    void logAudit({
      actorId: ctx.user.id,
      storeId: ctx.store.id,
      action: "faq.changed",
      entity: "faq",
      entityId: (data as { id: string }).id,
      supportSessionId: ctx.supportSession?.id ?? null,
      metadata: { question: input.question },
    });

    return NextResponse.json({ ok: true, id: (data as { id: string }).id });
  } catch (e) {
    return toErrorResponse(e);
  }
}
