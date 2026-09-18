import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../../lib/supabase/server";
import { toErrorResponse } from "../../../../lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PKCE code exchange for OAuth providers (Google, Apple, GitHub…). */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=code_missing", req.url));
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e) {
    return toErrorResponse(e);
  }
}
