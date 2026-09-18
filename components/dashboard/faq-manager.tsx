"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimary } from "@/components/ui";
import { Btn } from "@/components/admin/ui";

interface Faq { id: string; question: string; answer: string; position: number; is_visible: boolean }

export function FaqManager({ faqs: initial }: { faqs: Faq[] }) {
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>(initial);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!question.trim() || !answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim(), position: faqs.length }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: { message?: string } | string };
      if (!res.ok || !data.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error as { message?: string })?.message ?? "Erreur");
      setFaqs([...faqs, { id: data.id ?? Math.random().toString(36), question: question.trim(), answer: answer.trim(), position: faqs.length, is_visible: true }]);
      setQuestion("");
      setAnswer("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, visible: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/faq/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: visible }),
      });
      if (!res.ok) throw new Error("Erreur");
      setFaqs(faqs.map((f) => f.id === id ? { ...f, is_visible: visible } : f));
      router.refresh();
    } catch {
      setError("Erreur mise à jour");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Supprimer cette question ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/faq/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      setFaqs(faqs.filter((f) => f.id !== id));
      router.refresh();
    } catch {
      setError("Erreur suppression");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={labelCls}>Question</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} className={inputCls} placeholder="Ex: Livrez-vous dans les 58 wilayas ?" maxLength={200} />
        </div>
        <div>
          <label className={labelCls}>Réponse</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} className={inputCls} rows={2} placeholder="Oui, livraison..." maxLength={1000} />
        </div>
      </div>
      <button onClick={add} disabled={busy || !question.trim() || !answer.trim()} className={btnPrimary}>{busy ? "…" : "+ Ajouter"}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {faqs.map((f, idx) => (
          <div key={f.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-800">{idx + 1}. {f.question}</div>
                <div className="mt-1 text-sm text-slate-600">{f.answer}</div>
              </div>
              <div className="flex gap-1">
                <Btn size="sm" variant="secondary" disabled={busy} onClick={() => toggle(f.id, !f.is_visible)}>{f.is_visible ? "Masquer" : "Afficher"}</Btn>
                <Btn size="sm" variant="danger" disabled={busy} onClick={() => del(f.id)}>Suppr.</Btn>
              </div>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-sm text-slate-400">Aucune question — ajoutez-en ci-dessus.</p>}
      </div>
    </div>
  );
}
