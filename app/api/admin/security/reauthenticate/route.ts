import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getServerSupabase } from "@/lib/supabase/server";
import { hit } from "@/lib/rate-limit";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const ctx = await getAdminContext();
    const rate = hit(`admin-password-code:${ctx.user.id}`, 3, 10 * 60 * 1000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Trop de codes demandés. Réessayez dans quelques minutes." },
        { status: 429, headers: { "retry-after": String(Math.ceil(rate.retryAfterMs / 1000)) } },
      );
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.reauthenticate();
    if (error) {
      console.error("[flexigo:auth] reauthentication failed:", error.message);
      return NextResponse.json(
        { error: "Le code n’a pas pu être envoyé. Vérifiez la configuration e-mail Supabase." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
