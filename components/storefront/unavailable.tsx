import Link from "next/link";
import type { StoreStatus } from "../../lib/types";

/**
 * Generic screen for stores that are not live. Deliberately shows no tenant
 * data (name, logo, content) for draft/suspended/archived stores.
 */
export function UnavailableScreen({ kind }: { kind: StoreStatus }) {
  const messages: Record<StoreStatus, { title: string; text: string }> = {
    draft: {
      title: "Ce site est en préparation",
      text: "La mise en ligne est en cours. Revenez très bientôt !",
    },
    active: { title: "", text: "" },
    suspended: {
      title: "Service temporairement indisponible",
      text: "Ce site est momentanément hors ligne. Merci de votre compréhension.",
    },
    archived: {
      title: "Ce site n'est plus en ligne",
      text: "Cette page a été archivée par son propriétaire.",
    },
  };
  const m = messages[kind] ?? messages.draft!;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="text-6xl">🛠️</div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">{m.title}</h1>
      <p className="mt-2 max-w-md text-slate-500">{m.text}</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
