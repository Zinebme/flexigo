import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { RegisterClient } from "./register-client";

export const dynamic = "force-dynamic";

/**
 * Registration page — INTERNAL ONLY for this pivot.
 * Public merchant signup is disabled. Only SUPER_ADMIN can create merchant accounts
 * via this page or via the master dashboard wizard.
 * Unauthenticated users see a disabled message with link to login.
 */
export default async function RegisterPage() {
  const supabase = await getServerSupabase();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">🔒</div>
          <h1 className="text-lg font-bold text-slate-900">Inscription publique désactivée</h1>
          <p className="mt-2 text-sm text-slate-500">
            FlexiGo est actuellement une plateforme interne de production de sites. Les comptes marchands sont créés par l&apos;administrateur.
          </p>
          <p className="mt-2 text-xs text-slate-400">Si vous êtes client, votre accès vous sera communiqué après livraison de votre site.</p>
          <div className="mt-6 flex flex-col gap-2">
            <a href="/login" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              Se connecter
            </a>
            <a href="/login" className="text-sm font-semibold text-blue-600 hover:underline">
              J&apos;ai déjà un compte
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-400">Code d&apos;inscription conservé en interne pour évolution future SaaS.</p>
        </div>
      </div>
    );
  }

  // Check if SUPER_ADMIN
  let isSuperAdmin = false;
  try {
    const admin = getAdminSupabase();
    const { data: pa } = await admin.from("platform_admins").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (pa?.role === "SUPER_ADMIN") isSuperAdmin = true;
  } catch {
    // ignore
  }

  if (isSuperAdmin) {
    return <RegisterClient allowPublic={false} />;
  }

  // Authenticated merchant → dashboard
  redirect("/dashboard");
}
