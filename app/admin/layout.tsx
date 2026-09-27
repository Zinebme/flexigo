import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin-context";
import { isAppError } from "@/lib/errors";
import { Icon } from "@/components/ui/icons";
import { NavProvider } from "@/components/dashboard/nav-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const metadata = { title: "Administration — Marqova" };
export const dynamic = "force-dynamic";

/** Full-screen gate card (dark admin theme). */
function GateCard({
  icon,
  tone,
  title,
  text,
  actionHref,
  actionLabel,
}: {
  icon: "lock" | "alert";
  tone: "violet" | "red";
  title: string;
  text: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="fx-anim-fade-up w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl shadow-slate-950/60">
        <div
          className={
            tone === "violet"
              ? "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-500/30"
              : "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/30"
          }
        >
          <Icon name={icon} size={24} />
        </div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
        <div className="mt-6">
          <Link
            href={actionHref}
            className={
              tone === "violet"
                ? "inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
                : "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-600"
            }
          >
            {actionLabel}
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await getAdminContext();
  } catch (e) {
    if (isAppError(e) && e.code === "UNAUTHORIZED") {
      return (
        <GateCard
          icon="lock"
          tone="violet"
          title="Connexion requise"
          text="Connectez-vous pour accéder à l'administration de la plateforme."
          actionHref="/login"
          actionLabel="Se connecter"
        />
      );
    }
    if (isAppError(e) && e.code === "FORBIDDEN") {
      redirect("/dashboard");
    }
    return (
      <GateCard
        icon="alert"
        tone="red"
        title="Accès refusé"
        text={isAppError(e) ? e.message : "Vous n'avez pas les droits pour accéder à cette zone."}
        actionHref="/dashboard"
        actionLabel="Espace marchand"
      />
    );
  }

  return (
    <NavProvider>
      <div className="min-h-screen bg-slate-950">
        <AdminSidebar />
        <div className="lg:ps-64">
          <AdminTopbar userEmail={ctx.user.email ?? "admin"} />
          <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
          </main>
        </div>
      </div>
    </NavProvider>
  );
}
