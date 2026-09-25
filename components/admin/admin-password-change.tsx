type SecurityStatus = string | undefined;

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  "code-sent": { tone: "success", text: "Code envoyé. Vérifiez votre boîte de réception et les courriers indésirables." },
  "email-error": { tone: "error", text: "Le code n’a pas pu être envoyé. Vérifiez la configuration e-mail Supabase." },
  "rate-limited": { tone: "error", text: "Trop de codes ont été demandés. Réessayez dans quelques minutes." },
  "invalid-code": { tone: "error", text: "Le code est invalide ou a expiré. Demandez un nouveau code." },
  "invalid-password": { tone: "error", text: "Vérifiez le code et les critères du nouveau mot de passe." },
  "too-many-attempts": { tone: "error", text: "Trop de tentatives. Réessayez plus tard." },
};

export function AdminPasswordChange({ email, status }: { email: string; status?: SecurityStatus }) {
  const message = status ? messages[status] : undefined;
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

      {message ? (
        <div className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      ) : null}

      <form action="/api/admin/security/reauthenticate" method="post" className="mt-5">
        <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 active:bg-violet-800">
          Recevoir le code de vérification
        </button>
      </form>

      <div className="my-6 border-t border-slate-200" />

      <form action="/api/admin/security/password" method="post" className="space-y-4">
        <div>
          <label htmlFor="admin-password-code" className="text-sm font-semibold text-slate-700">Code reçu par e-mail</label>
          <input id="admin-password-code" name="nonce" className={input} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="admin-new-password" className="text-sm font-semibold text-slate-700">Nouveau mot de passe</label>
            <input id="admin-new-password" name="password" type="password" className={input} autoComplete="new-password" minLength={12} maxLength={200} required />
          </div>
          <div>
            <label htmlFor="admin-confirm-password" className="text-sm font-semibold text-slate-700">Confirmer le mot de passe</label>
            <input id="admin-confirm-password" name="confirmation" type="password" className={input} autoComplete="new-password" minLength={12} maxLength={200} required />
          </div>
        </div>
        <p className="text-xs text-slate-500">12 caractères minimum, avec majuscule, minuscule, chiffre et symbole. Après validation, toutes les sessions seront déconnectées.</p>
        <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 active:bg-violet-800">
          Changer le mot de passe
        </button>
      </form>
    </div>
  );
}
