import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../../lib/supabase/server";
import { endSupportSession, getOpenSupportSession } from "../../../../lib/auth/support";
import { STORE_COOKIE, SUPPORT_COOKIE } from "../../../../lib/auth/merchant-context";
import { toErrorResponse } from "../../../../lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = await getServerSupabase();
    const { data: userData } = await supabase.auth.getUser();

    // Close any open support session (audited in support_sessions + audit_logs).
    const supportCookie = cookieStore.get(SUPPORT_COOKIE)?.value;
    if (userData.user && supportCookie) {
      const session = await getOpenSupportSession(supportCookie, userData.user.id);
      if (session) await endSupportSession(session.id, userData.user.id);
    }

    await supabase.auth.signOut();

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(STORE_COOKIE);
    res.cookies.delete(SUPPORT_COOKIE);
    return res;
  } catch (e) {
    return toErrorResponse(e);
  }
}
