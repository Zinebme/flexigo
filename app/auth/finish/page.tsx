"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type PageState = "loading" | "ready" | "invalid" | "saving" | "done";

export default function FinishAuthPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const supabase = getBrowserSupabase();
      const { data, error: sessionError } = await supabase.auth.getSession();

      // Supabase returns invite/recovery credentials in the URL fragment. The
      // browser client consumes them; remove any remaining fragment immediately
      // so credentials are not left in copied URLs or browser history.
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      if (!active) return;
      if (sessionError || !data.session) {
        setError("Ce lien est invalide ou a expiré. Demandez une nouvelle invitation à votre administrateur.");
        setState("invalid");
        return;
      }
      setState("ready");
    }

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setState("saving");
    const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password });
    if (updateError) {
      setError("Impossible d’enregistrer le mot de passe. Réessayez ou demandez une nouvelle invitation.");
      setState("ready");
      return;
    }

    setState("done");
    router.replace("/dashboard");
    router.refresh();
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
          <h1 className="text-xl font-bold text-slate-900">Activez votre espace marchand</h1>
          <p className="mt-1 text-sm text-slate-500">Choisissez votre mot de passe pour accéder au tableau de bord de votre boutique.</p>

          {state === "loading" ? (
            <p className="mt-6 text-sm text-slate-600" role="status">Vérification de votre invitation…</p>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          {state === "ready" || state === "saving" ? (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="password">Nouveau mot de passe</label>
                <input id="password" type="password" className={input} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="confirmation">Confirmer le mot de passe</label>
                <input id="confirmation" type="password" className={input} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required />
              </div>
              <button type="submit" disabled={state === "saving"} className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
                {state === "saving" ? "Enregistrement…" : "Activer mon compte"}
              </button>
            </form>
          ) : null}

          {state === "done" ? <p className="mt-6 text-sm text-emerald-700" role="status">Compte activé. Redirection vers votre tableau de bord…</p> : null}

          {state === "invalid" ? (
            <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-blue-600 hover:underline">Retour à la connexion</Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}
