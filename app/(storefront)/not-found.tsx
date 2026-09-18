import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-24 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Page introuvable</h1>
      <p className="mt-2 max-w-md text-slate-500">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-[var(--fx-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
