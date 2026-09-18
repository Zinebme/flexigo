import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  language: z.enum(["fr", "ar", "en"]),
});

export async function PUT(req: Request) {
  try {
    const ctx = await getMerchantContext();
    const body = await req.json().catch(() => null);
    const input = bodySchema.parse(body);
    const admin = getAdminSupabase();

    const { error } = await admin.from("profiles").update({ dashboard_language: input.language }).eq("id", ctx.user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true, language: input.language });
  } catch (e) {
    return toErrorResponse(e);
  }
}
