"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/admin/ui";

interface Review { id: string; product_id: string | null; customer_name: string; rating: number; title: string | null; body: string | null; is_approved: boolean; created_at: string }

export function ReviewsManager({ reviews, productMap, canManage }: { reviews: Review[]; productMap: Map<string, string>; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string, approve: boolean) {
    if (!canManage) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: approve }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function del(id: string) {
    if (!canManage || !confirm("Supprimer cet avis ?")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/reviews/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  if (!canManage) return <p className="text-sm text-slate-400">Accès restreint.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {reviews.length === 0 && <p className="text-sm text-slate-400">Aucun avis à modérer.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">{r.customer_name} · {"⭐".repeat(r.rating)}</div>
              <div className="text-xs text-slate-500">{productMap.get(r.product_id ?? "") ?? "Général"} · {new Date(r.created_at).toLocaleDateString("fr-DZ")}</div>
              {r.title && <div className="mt-1 font-medium text-slate-700">{r.title}</div>}
              {r.body && <div className="mt-1 text-sm text-slate-600">{r.body}</div>}
            </div>
            <div className="flex gap-1">
              <Btn size="sm" variant={r.is_approved ? "secondary" : "primary"} disabled={busy === r.id} onClick={() => toggle(r.id, !r.is_approved)}>
                {busy === r.id ? "…" : r.is_approved ? "Désapprouver" : "Approuver"}
              </Btn>
              <Btn size="sm" variant="danger" disabled={busy === r.id} onClick={() => del(r.id)}>Suppr.</Btn>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
