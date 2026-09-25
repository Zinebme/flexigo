"use client";

import { useState } from "react";
import Link from "next/link";

export function RegisterClient({ allowPublic = false }: { allowPublic?: boolean }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 10) {
      setError("Le mot de passe doit contenir au moins 10 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Inscription impossible. Réessayez.");
        return;
      }
      setNotice(json.message ?? "Compte créé.");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">M</span>
          <span className="text-xl font-extrabold text-slate-900">Marqova</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Créer un compte marchand</h1>
          <p className="mt-1 text-sm text-slate-500">
            {allowPublic
              ? "Votre compte vous donne accès à votre espace de gestion. Un site Marqova vous est ensuite livré et configuré."
              : "Outil interne — création de comptes marchands par le super admin. L'inscription publique est désactivée pour le moment."}
          </p>

          {notice ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="name">Nom complet</label>
              <input id="name" className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required minLength={2} maxLength={80} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="reg-pass">Mot de passe</label>
              <input id="reg-pass" type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={10} />
              <p className="mt-1 text-xs text-slate-400">10 caractères minimum.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="reg-confirm">Confirmer le mot de passe</label>
              <input id="reg-confirm" type="password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Création…" : "Créer le compte marchand"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
          {!allowPublic && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Inscription publique désactivée — les comptes marchands sont créés par le super admin via le master dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
