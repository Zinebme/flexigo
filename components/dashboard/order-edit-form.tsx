"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

type EditableOrder = { id: string; full_name: string; phone: string; commune: string; address: string | null; office: string | null; delivery_type: string; status: string };
const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

export function OrderEditForm({ order }: { order: EditableOrder }) {
  const router = useRouter();
  const [name, setName] = useState(order.full_name);
  const [phone, setPhone] = useState(order.phone);
  const [commune, setCommune] = useState(order.commune);
  const [address, setAddress] = useState(order.address ?? "");
  const [office, setOffice] = useState(order.office ?? "");
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/dashboard/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: name, phone, commune, address: address || null, office: office || null, status, note }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || "Enregistrement impossible");
      setNote(""); setMessage("Commande enregistrée."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible"); }
    finally { setBusy(false); }
  }

  return <form onSubmit={(e) => void save(e)} className="grid gap-4 p-5 sm:grid-cols-2">
    <label className="text-sm font-semibold text-slate-700">Nom du client<input required minLength={2} maxLength={120} className={`mt-1.5 ${field}`} value={name} onChange={(e) => setName(e.target.value)} /></label>
    <label className="text-sm font-semibold text-slate-700">Téléphone<input required minLength={8} maxLength={24} className={`mt-1.5 ${field}`} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
    <label className="text-sm font-semibold text-slate-700">Commune<input required minLength={2} maxLength={120} className={`mt-1.5 ${field}`} value={commune} onChange={(e) => setCommune(e.target.value)} /></label>
    <label className="text-sm font-semibold text-slate-700">Statut<select className={`mt-1.5 ${field}`} value={status} onChange={(e) => setStatus(e.target.value)}>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value as OrderStatus]}</option>)}</select></label>
    {order.delivery_type === "home" && <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Adresse de livraison<input className={`mt-1.5 ${field}`} maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)} /></label>}
    {order.delivery_type === "office" && <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Bureau de retrait confirmé<input className={`mt-1.5 ${field}`} maxLength={120} value={office} onChange={(e) => setOffice(e.target.value)} placeholder="Nom et adresse du bureau" /></label>}
    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Ajouter une note interne<textarea className={`mt-1.5 ${field}`} maxLength={2000} rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 sm:col-span-2"><button type="submit" disabled={busy} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer les modifications"}</button>{message && <span role="status" className={`text-sm ${message === "Commande enregistrée." ? "text-emerald-700" : "text-red-700"}`}>{message}</span>}</div>
  </form>;
}
