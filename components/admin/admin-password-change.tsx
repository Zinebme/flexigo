"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Step = "request" | "verify" | "saving" | "done";

export function AdminPasswordChange({ email }: { email: string }) {
  const [step, setStep] = useState<Step>("request");
  const [nonce, setNonce] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    setError(null);
    const { error: reauthError } = await getBrowserSupabase().auth.reauthenticate();
    if (reauthError) {
      setError("Le code n’a pas pu être envoyé. Réessayez dans quelques minutes.");
      return;
    }
    setNonce("");
    setStep("verify");
    setCooldown(60);
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(nonce)) {
      setError("Saisissez le code de vérification à 6 chiffres reçu par e-mail.");
      return;
    }
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Le mot de passe doit contenir au moins 12 caractères, avec une majuscule, une minuscule, un chiffre et un symbole.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setStep("saving");
    const { error: updateError } = await getBrowserSupabase().auth.updateUser({
      email,
      password,
      nonce,
    });
    if (updateError) {
      setError(updateError.message.toLowerCase().includes("nonce")
        ? "Le code est invalide ou a expiré. Demandez un nouveau code."
        : "Le mot de passe n’a pas pu être modifié. Vérifiez les critères puis réessayez.");
      setStep("verify");
      return;
    }

    setPassword("");
    setConfirmation("");
    setNonce("");
    setStep("done");
    await getBrowserSupabase().auth.signOut({ scope: "global" });
    window.setTimeout(() => window.location.assign("/login"), 1200);
  }

  const input = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900">Mot de passe Super Admin</h3>
          <p className="mt-1 text-sm text-slate-600">Un code à usage unique sera envoyé à <strong>{email}</strong> avant toute modification.</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Double vérification</span>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div> : null}

      {step === "request" ? (
        <button type="button" onClick={() => void sendCode()} className="mt-5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">
          Recevoir le code de vérification
        </button>
      ) : null}

      {step === "verify" || step === "saving" ? (
        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <div>
            <label htmlFor="admin-password-code" className="text-sm font-semibold text-slate-700">Code reçu par e-mail</label>
            <input id="admin-password-code" className={input} value={nonce} onChange={(event) => setNonce(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="admin-new-password" className="text-sm font-semibold text-slate-700">Nouveau mot de passe</label>
              <input id="admin-new-password" type="password" className={input} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} required />
            </div>
            <div>
              <label htmlFor="admin-confirm-password" className="text-sm font-semibold text-slate-700">Confirmer le mot de passe</label>
              <input id="admin-confirm-password" type="password" className={input} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} required />
            </div>
          </div>
          <p className="text-xs text-slate-500">12 caractères minimum, avec majuscule, minuscule, chiffre et symbole. Après validation, toutes les sessions seront déconnectées.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={step === "saving"} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
              {step === "saving" ? "Modification…" : "Changer le mot de passe"}
            </button>
            <button type="button" onClick={() => void sendCode()} disabled={cooldown > 0 || step === "saving"} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "done" ? <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800" role="status">Mot de passe modifié. Déconnexion sécurisée en cours…</div> : null}
    </div>
  );
}
