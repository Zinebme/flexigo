"use client";

import Link from "next/link";
import { useState } from "react";
import { getInviteRedirectUrl } from "@/lib/app-url";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await getBrowserSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getInviteRedirectUrl(),
    });

    setLoading(false);
    if (resetError) {
      setError("Impossible d’envoyer le lien pour le moment. Réessayez dans quelques minutes.");
      return;
    }
    setSent(true);
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">M</span>
          <span className="text-xl font-extrabold text-slate-900">Marqova</span>
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Créer un nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-slate-500">Nous vous enverrons un lien sécurisé à l’adresse de votre compte marchand.</p>

          {error ? <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div> : null}

          {sent ? (
            <div className="mt-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                Si cette adresse correspond à un compte, le lien vient d’être envoyé. Vérifiez aussi vos courriers indésirables.
              </div>
              <Link href="/login" className="mt-5 inline-flex text-sm font-semibold text-blue-600 hover:underline">Retour à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="email">Adresse email</label>
                <input id="email" type="email" className={input} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
                {loading ? "Envoi…" : "Recevoir le lien"}
              </button>
              <Link href="/login" className="block text-center text-sm font-semibold text-slate-600 hover:underline">Retour à la connexion</Link>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
