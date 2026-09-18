import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAppError } from "@/lib/errors";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar, type StoreOption } from "@/components/dashboard/topbar";

export const metadata = { title: "Espace marchand" };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Throws UNAUTHORIZED / FORBIDDEN with a French message when not allowed.
  let ctx;
  try {
    ctx = await getMerchantContext();
  } catch (e) {
    // UNAUTHORIZED: not logged in → the login page handles it.
    if (isAppError(e) && e.code === "UNAUTHORIZED") throw e;
    // FORBIDDEN (e.g. no membership / archived store): friendly empty state
    // instead of a stack trace.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">🔒</div>
          <h1 className="text-lg font-bold text-slate-900">
            {isAppError(e) && e.code === "NOT_FOUND" ? "Site introuvable" : "Accès non disponible"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isAppError(e) ? e.message : "Vous n'avez pas accès à un site marchand."}
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link href="/" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              Retour à l'accueil
            </Link>
            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:underline">
              Se connecter avec un autre compte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Store switcher options: the user's own active memberships (never shown
  // in support mode — the admin is only in the impersonated store).
  let stores: StoreOption[] = [];
  if (ctx.mode !== "support" && ctx.memberships.length > 0) {
    const admin = getAdminSupabase();
    const ids = ctx.memberships.map((m) => m.store_id);
    const { data: rows } = await admin
      .from("stores")
      .select("id, name")
      .in("id", ids)
      .is("deleted_at", null);
    const nameById = new Map((rows ?? []).map((r) => [r.id, r.name]));
    stores = ctx.memberships
      .map((m) => ({ store_id: m.store_id, store_name: nameById.get(m.store_id) ?? "Site", role: m.role }))
      .filter((s) => s.store_id !== ctx.store.id || ctx.memberships.length > 1);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar storeName={ctx.store.name} role={ctx.role} previewUrl={`/s/${ctx.store.slug}`} />
      <div className="lg:pl-60">
        <DashboardTopbar
          storeName={ctx.store.name}
          storeId={ctx.store.id}
          stores={stores}
          userEmail={ctx.user.email ?? "compte"}
          supportMode={ctx.mode === "support"}
          supportStoreName={ctx.store.name}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
