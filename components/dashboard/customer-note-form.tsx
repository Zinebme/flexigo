"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Edit a customer's email/notes (capability: customers.manage). */
export function CustomerNoteForm({ customerId, initialEmail, initialNotes }: { customerId: string; initialEmail: string; initialNotes: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fetch(`/api/dashboard/customers/${customerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || null, notes: notes || null }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOkMsg("Enregistré.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Email (facultatif)</label>
        <input className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Notes internes</label>
        <textarea className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
      </div>
    </form>
  );
}
