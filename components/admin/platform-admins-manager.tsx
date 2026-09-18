"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnPrimary } from "@/components/ui";
import { Btn, Confirm } from "@/components/admin/ui";

interface PA { user_id: string; role: string; created_at: string }
interface Profile { id: string; email: string | null }

export function PlatformAdminsManager({ currentUserId, platformAdmins, profiles }: { currentUserId: string; platformAdmins: PA[]; profiles: Profile[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; action: () => Promise<void> }>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "SUPER_ADMIN" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      setEmail("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/platform-admins/${userId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-64">
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email (doit exister)</label>
          <input list="pa-profiles" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="admin@example.com" />
          <datalist id="pa-profiles">
            {profiles.map((p) => p.email && <option key={p.id} value={p.email} />)}
          </datalist>
        </div>
        <button onClick={add} disabled={busy || !email} className={btnPrimary}>{busy ? "…" : "Ajouter SUPER_ADMIN"}</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-slate-200">
        {platformAdmins.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">Aucun administrateur plateforme.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {platformAdmins.map((pa) => {
              const prof = profiles.find((p) => p.id === pa.user_id);
              return (
                <li key={pa.user_id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-800">{prof?.email ?? pa.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-slate-400">{pa.role} · depuis {new Date(pa.created_at).toLocaleDateString("fr-DZ")}</div>
                  </div>
                  <Btn
                    variant="danger"
                    size="sm"
                    disabled={busy || pa.user_id === currentUserId}
                    title={pa.user_id === currentUserId ? "Vous ne pouvez pas vous retirer vous-même" : undefined}
                    onClick={() => setConfirm({
                      title: "Retirer SUPER_ADMIN ?",
                      message: `Retirer les droits super-admin de ${prof?.email ?? pa.user_id} ? Cette action est audité.`,
                      action: () => remove(pa.user_id),
                    })}
                  >
                    Retirer
                  </Btn>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Confirm
        open={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel="Confirmer"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm;
          setConfirm(null);
          if (!c) return;
          await c.action();
        }}
      />
    </div>
  );
}
