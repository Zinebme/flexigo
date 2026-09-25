import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getServerSupabase } from "@/lib/supabase/server";
import { hit } from "@/lib/rate-limit";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ctx = await getAdminContext();
    const rate = hit(`admin-password-code:${ctx.user.id}`, 3, 10 * 60 * 1000);
    if (!rate.ok) {
      return NextResponse.redirect(new URL("/admin/parametres?security=rate-limited", request.url), 303);
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.reauthenticate();
    if (error) {
      console.error("[flexigo:auth] reauthentication failed:", error.message);
      return NextResponse.redirect(new URL("/admin/parametres?security=email-error", request.url), 303);
    }

    return NextResponse.redirect(new URL("/admin/parametres?security=code-sent", request.url), 303);
  } catch (error) {
    return toErrorResponse(error);
  }
}
