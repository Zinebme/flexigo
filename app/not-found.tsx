import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="text-6xl">🧭</div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Page introuvable</h1>
      <p className="mt-2 max-w-md text-slate-500">
        Cette page n'existe pas. Vérifiez l'adresse ou retournez à l'accueil.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
