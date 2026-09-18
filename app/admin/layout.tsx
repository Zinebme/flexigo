import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin-context";
import { isAppError } from "@/lib/errors";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const metadata = { title: "Administration — FlexiGo" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await getAdminContext();
  } catch (e) {
    if (isAppError(e) && e.code === "UNAUTHORIZED") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">🔐</div>
            <h1 className="text-lg font-bold text-white">Connexion requise</h1>
            <p className="mt-2 text-sm text-slate-400">Connectez-vous pour accéder à l'administration de la plateforme.</p>
            <div className="mt-6">
              <Link href="/login" className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      );
    }
    if (isAppError(e) && e.code === "FORBIDDEN") {
      redirect("/dashboard");
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">⛔</div>
          <h1 className="text-lg font-bold text-white">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isAppError(e) ? e.message : "Vous n'avez pas les droits pour accéder à cette zone."}
          </p>
          <div className="mt-6">
            <Link href="/dashboard" className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600">
              Espace marchand
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminTopbar userEmail={ctx.user.email ?? "admin"} />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
