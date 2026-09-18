import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "../../../../lib/supabase/server";
import { getAdminSupabase } from "../../../../lib/supabase/admin";
import { toErrorResponse } from "../../../../lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    // Decide the landing zone: platform admin vs merchant vs nobody.
    const admin = getAdminSupabase();
    const [{ data: platform }, { data: memberships }] = await Promise.all([
      admin.from("platform_admins").select("role").eq("user_id", data.user.id).maybeSingle(),
      admin.from("store_members").select("store_id").eq("user_id", data.user.id).neq("status", "revoked"),
    ]);

    let redirect = "/dashboard";
    if (platform) redirect = "/admin";
    else if (!memberships || memberships.length === 0) redirect = "/dashboard?empty=1";

    const res = NextResponse.json({ redirect });
    return res;
  } catch (e) {
    return toErrorResponse(e);
  }
}
