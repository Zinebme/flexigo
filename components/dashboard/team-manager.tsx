"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MERCHANT_ROLES, type MerchantRole } from "@/lib/types";

export interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  email: string;
  full_name: string | null;
  is_self: boolean;
}

const ROLE_INFO: Record<string, { label: string; description: string }> = {
  OWNER: { label: "Propriétaire", description: "Accès complet, gère l'équipe et les paramètres du site." },
  MANAGER: { label: "Gestionnaire", description: "Gère commandes, produits, contenu et intégrations (pas l'équipe)." },
  ORDER_MANAGER: { label: "Gestionnaire de commandes", description: "Gère les commandes, l'expédition et les clients. Pas de produits ni de contenu." },
  CONTENT_EDITOR: { label: "Rédacteur", description: "Gère produits, catégories, contenu et apparence. Pas d'accès aux commandes." },
  VIEWER: { label: "Lecteur", description: "Consulte uniquement les commandes, les clients et les statistiques." },
};

/**
 * Team management (invites + roles + removal). Only the OWNER has
 * team.manage; SUPER_ADMIN is never an option here.
 */
export function TeamManager({ members, canManage }: { members: Member[]; canManage: boolean }) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MerchantRole>("VIEWER");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy("invite");
    setError(null);
    setOkMsg(null);
    const res = await fetch("/api/dashboard/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(null);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Invitation impossible"));
      return;
    }
    setInviteEmail("");
    setOkMsg("Invitation envoyée.");
    router.refresh();
  }

  async function changeRole(id: string, role: string) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/dashboard/team/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(null);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Modification impossible"));
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Retirer ce membre du site ? Il perdra immédiatement l'accès (historique conservé).")) return;
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/dashboard/team/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Retrait impossible"));
    }
    setBusy(null);
  }

  const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm";

  return (
    <div className="space-y-5">
      {canManage && (
        <form onSubmit={invite} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">Inviter un membre</div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              className={`${input} w-64 flex-1`}
              placeholder="email@exemple.dz"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select className={`${input} w-56`} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as MerchantRole)}>
              {MERCHANT_ROLES.filter((r) => r !== "OWNER").map((r) => (
                <option key={r} value={r}>{ROLE_INFO[r]?.label ?? r}</option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50" disabled={busy === "invite"}>
              {busy === "invite" ? "Invitation…" : "Inviter"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            La personne doit déjà avoir un compte FlexiGo avec cet email. {ROLE_INFO[inviteRole]?.description}
          </p>
        </form>
      )}

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {members.map((m) => {
          const info = ROLE_INFO[m.role] ?? { label: m.role, description: "" };
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                {(m.full_name ?? m.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{m.full_name || m.email}</span>
                  {m.is_self && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">Vous</span>}
                  {m.status === "invited" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">Invité</span>}
                  {m.status === "revoked" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Révoqué</span>}
                </div>
                <div className="text-sm text-slate-500">{m.email}</div>
                <div className="text-xs text-slate-400">{info.description}</div>
              </div>
              {canManage && m.role !== "OWNER" ? (
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm"
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    disabled={busy === m.id}
                  >
                    {MERCHANT_ROLES.filter((r) => r !== "OWNER").map((r) => (
                      <option key={r} value={r}>{ROLE_INFO[r]?.label ?? r}</option>
                    ))}
                  </select>
                  <button
                    className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => remove(m.id)}
                    disabled={busy === m.id || m.is_self}
                    title={m.is_self ? "Vous ne pouvez pas vous retirer vous-même" : "Retirer du site"}
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{info.label}</span>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
    </div>
  );
}
