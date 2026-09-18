import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Root routing — INTERNAL PRODUCTION PLATFORM pivot:
 * - Unauthenticated → /login
 * - Authenticated SUPER_ADMIN → /admin
 * - Authenticated merchant → /dashboard
 *
 * Public SaaS landing is removed for this stage. Registration code is kept
 * internally but not linked publicly.
 */
export default async function RootPage() {
  const supabase = await getServerSupabase();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  // Check if SUPER_ADMIN
  try {
    const admin = getAdminSupabase();
    const { data: pa } = await admin.from("platform_admins").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (pa?.role === "SUPER_ADMIN") {
      redirect("/admin");
    }
  } catch {
    // ignore, fall through to merchant
  }

  // Authenticated merchant
  redirect("/dashboard");
}
