"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/lib/supabase/database.types";
import { CheckoutSettingsEditor } from "./checkout-settings-editor";

export function SettingsForm({ initial, canManage }: { initial: StoreSettings; canManage: boolean }) {
  const router = useRouter();
  const [contact, setContact] = useState({
    email: initial.contact.email ?? "",
    phone: initial.contact.phone ?? "",
    whatsapp: initial.contact.whatsapp ?? "",
    instagram: initial.contact.instagram ?? "",
    facebook: initial.contact.facebook ?? "",
    tiktok: initial.contact.tiktok ?? "",
    address: initial.contact.address ?? "",
  });
  const [business, setBusiness] = useState({
    cod_enabled: initial.business.cod_enabled,
    reviews_enabled: initial.business.reviews_enabled,
    faq_enabled: initial.business.faq_enabled,
    allow_negative_stock: initial.business.allow_negative_stock,
    max_items_per_order: initial.business.max_items_per_order,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: {
          email: contact.email,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          instagram: contact.instagram,
          facebook: contact.facebook,
          tiktok: contact.tiktok,
          address: contact.address,
        },
        business,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOkMsg("Paramètres enregistrés.");
    router.refresh();
  }

  if (!canManage) return null;

  const label = "mb-1 block text-sm font-semibold text-slate-700";
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm";

  return (
    <div className="space-y-8">
    <form onSubmit={save} className="space-y-6">
      <section>
        <h3 className="mb-3 text-base font-bold text-slate-900">Coordonnées de contact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={label}>Email de contact</label>
            <input type="email" className={input} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </div>
          <div>
            <label className={label}>Téléphone</label>
            <input className={input} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="0550 12 34 56" />
          </div>
          <div>
            <label className={label}>WhatsApp</label>
            <input className={input} value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} placeholder="0550 12 34 56" />
          </div>
          <div>
            <label className={label}>Adresse</label>
            <input className={input} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          </div>
          <div>
            <label className={label}>Instagram</label>
            <input className={input} value={contact.instagram} onChange={(e) => setContact({ ...contact, instagram: e.target.value })} placeholder="https://instagram.com/…" />
          </div>
          <div>
            <label className={label}>Facebook</label>
            <input className={input} value={contact.facebook} onChange={(e) => setContact({ ...contact, facebook: e.target.value })} placeholder="https://facebook.com/…" />
          </div>
          <div>
            <label className={label}>TikTok</label>
            <input className={input} value={contact.tiktok} onChange={(e) => setContact({ ...contact, tiktok: e.target.value })} placeholder="https://tiktok.com/…" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-base font-bold text-slate-900">Options commerciales</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={business.cod_enabled} onChange={(e) => setBusiness({ ...business, cod_enabled: e.target.checked })} />
            Paiement à la livraison (COD) activé
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={business.reviews_enabled} onChange={(e) => setBusiness({ ...business, reviews_enabled: e.target.checked })} />
            Avis clients activés
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={business.faq_enabled} onChange={(e) => setBusiness({ ...business, faq_enabled: e.target.checked })} />
            FAQ activée
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={business.allow_negative_stock} onChange={(e) => setBusiness({ ...business, allow_negative_stock: e.target.checked })} />
            Autoriser le stock négatif
          </label>
          <div className="pt-2">
            <label className={label}>Articles max par commande</label>
            <input type="number" min={1} max={999} className={`${input} w-40`} value={business.max_items_per_order} onChange={(e) => setBusiness({ ...business, max_items_per_order: Number.parseInt(e.target.value, 10) || 1 })} />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
      </div>
    </form>
    <section className="border-t border-slate-200 pt-6">
      <CheckoutSettingsEditor
        initial={initial.checkout}
        onSave={async (checkout) => {
          const res = await fetch("/api/dashboard/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkout }),
          });
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
          if (!res.ok || !data.ok) throw new Error(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
          router.refresh();
        }}
      />
    </section>
    </div>
  );
}
