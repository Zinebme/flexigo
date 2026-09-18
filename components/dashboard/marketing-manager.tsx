"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETING_PROVIDER_KEYS, MARKETING_PROVIDER_LABELS, MARKETING_EVENTS, type MarketingProviderKey } from "@/lib/types";

interface PixelRow {
  provider_key: string;
  is_active: boolean;
  pixel_id: string | null;
  events_enabled: string[];
}
interface SheetsState {
  spreadsheet_id: string | null;
  has_credential: boolean;
  fields: string[];
  is_active: boolean;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
}
interface WhatsappState {
  is_active: boolean;
  phone: string | null;
  provider: string;
}

interface Props {
  pixels: PixelRow[];
  sheets: SheetsState | null;
  whatsapp: WhatsappState | null;
  columns: string[];
}

const EVENT_LABELS: Record<string, string> = {
  PageView: "PageView (vue de page)",
  ViewContent: "ViewContent (vue produit)",
  AddToCart: "AddToCart (ajout panier)",
  InitiateCheckout: "InitiateCheckout (début commande)",
  Purchase: "Purchase (achat — valeur recalculée serveur)",
};

const COLUMN_LABELS: Record<string, string> = {
  numero: "N° commande", nom: "Nom", telephone: "Téléphone", email: "Email",
  wilaya: "Wilaya", commune: "Commune", livraison: "Livraison",
  sous_total: "Sous-total", frais: "Frais", total: "Total", statut: "Statut", creee: "Créée le",
};

/**
 * Marketing manager: pixels (validated identifiers only — no code),
 * Google Sheets (server-side credential, sync), WhatsApp (pluggable, contact only).
 */
export function MarketingManager({ pixels, sheets, whatsapp, columns }: Props) {
  const router = useRouter();
  const pixelMap = new Map(pixels.map((p) => [p.provider_key, p]));
  const [pixelDrafts, setPixelDrafts] = useState<Record<string, { id: string; active: boolean; events: string[] }>>(() => {
    const d: Record<string, { id: string; active: boolean; events: string[] }> = {};
    for (const key of MARKETING_PROVIDER_KEYS) {
      const p = pixelMap.get(key);
      d[key] = { id: p?.pixel_id ?? "", active: p?.is_active ?? false, events: p?.events_enabled ?? ["PageView"] };
    }
    return d;
  });
  const [sheetSpreadsheetId, setSheetSpreadsheetId] = useState(sheets?.spreadsheet_id ?? "");
  const [sheetSa, setSheetSa] = useState("");
  const [sheetFields, setSheetFields] = useState<string[]>(sheets?.fields ?? []);
  const [sheetActive, setSheetActive] = useState(sheets?.is_active ?? false);
  const [waPhone, setWaPhone] = useState(whatsapp?.phone ?? "");
  const [waActive, setWaActive] = useState(whatsapp?.is_active ?? false);

  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [ok, setOk] = useState<Record<string, string | null>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; message: string } | null>(null);

  function setErr(key: string, v: string | null) { setErrors((e) => ({ ...e, [key]: v })); }
  function setOkMsg(key: string, v: string | null) { setOk((e) => ({ ...e, [key]: v })); }

  async function savePixel(key: MarketingProviderKey) {
    const d = pixelDrafts[key] ?? { id: "", active: false, events: ["PageView"] };
    setBusy(key);
    setErr(key, null);
    setOkMsg(key, null);
    const res = await fetch("/api/dashboard/integrations/marketing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_key: key, is_active: d.active, pixel_id: d.id || null, events_enabled: d.events }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(null);
    if (!res.ok || !data.ok) setErr(key, typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
    else { setOkMsg(key, "Enregistré."); router.refresh(); }
  }

  async function saveSheets() {
    setBusy("sheets");
    setErr("sheets", null);
    setOkMsg("sheets", null);
    const res = await fetch("/api/dashboard/integrations/sheets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spreadsheet_id: sheetSpreadsheetId,
        service_account_json: sheetSa,
        fields: sheetFields,
        is_active: sheetActive,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(null);
    if (!res.ok || !data.ok) setErr("sheets", typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
    else { setOkMsg("sheets", "Enregistré."); setSheetSa(""); router.refresh(); }
  }

  async function runSync() {
    setSyncing(true);
    setSyncMsg(null);
    const res = await fetch("/api/dashboard/integrations/sheets/sync", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; rowsWritten?: number; error?: { message?: string } | string };
    setSyncing(false);
    if (res.ok && data.ok) setSyncMsg({ ok: true, message: data.message ?? "Synchronisation terminée." });
    else setSyncMsg({ ok: false, message: typeof data.error === "string" ? data.error : (data.error?.message ?? "Échec de la synchronisation") });
    router.refresh();
  }

  async function resetSheets() {
    if (!window.confirm("Déconnecter Google Sheets ? Le compte de service sera supprimé du stockage.")) return;
    const res = await fetch("/api/dashboard/integrations/sheets", { method: "DELETE" });
    if (res.ok) {
      setSheetSpreadsheetId("");
      setSheetFields([]);
      setSheetActive(false);
      setOkMsg("sheets", "Intégration réinitialisée.");
      router.refresh();
    }
  }

  async function saveWhatsapp() {
    setBusy("whatsapp");
    setErr("whatsapp", null);
    setOkMsg("whatsapp", null);
    const res = await fetch("/api/dashboard/integrations/whatsapp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: waActive, phone: waPhone || null, provider: "none" }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(null);
    if (!res.ok || !data.ok) setErr("whatsapp", typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
    else { setOkMsg("whatsapp", "Enregistré."); router.refresh(); }
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-base font-bold text-slate-900">Pixels & tags de marketing</h3>
        <p className="mb-3 text-sm text-slate-500">
          Seuls des <span className="font-semibold">identifiants</span> validés sont stockés (aucun code). Les pixels sont injectés côté serveur
          avec les événements autorisés ; la valeur de Purchase est recalculée côté serveur.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {MARKETING_PROVIDER_KEYS.map((key) => {
            const d = pixelDrafts[key] ?? { id: "", active: false, events: ["PageView"] };
            return (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{MARKETING_PROVIDER_LABELS[key]}</span>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={d.active} onChange={(e) => setPixelDrafts((p) => ({ ...p, [key]: { ...d, active: e.target.checked } }))} />
                    Actif
                  </label>
                </div>
                <input
                  className={input}
                  placeholder="Identifiant (ex : 1234567890, G-XXXX, G-XXXXXXX, G-XXXXXXXXXX)"
                  value={d.id}
                  maxLength={60}
                  onChange={(e) => setPixelDrafts((p) => ({ ...p, [key]: { ...d, id: e.target.value } }))}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {MARKETING_EVENTS.map((ev) => (
                    <label key={ev} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-300"
                        checked={d.events.includes(ev)}
                        onChange={(e) =>
                          setPixelDrafts((p) => ({
                            ...p,
                            [key]: { ...d, events: e.target.checked ? [...d.events, ev] : d.events.filter((x) => x !== ev) },
                          }))
                        }
                      />
                      {EVENT_LABELS[ev] ?? ev}
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50" onClick={() => savePixel(key)} disabled={busy === key}>
                    {busy === key ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  {ok[key] && <span className="text-xs text-emerald-600">{ok[key]}</span>}
                  {errors[key] && <span className="text-xs text-red-600">{errors[key]}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-900">Google Sheets — export des commandes</h3>
        <p className="mb-3 text-sm text-slate-500">
          Le compte de service est <span className="font-semibold">chiffré côté serveur</span> et jamais renvoyé au navigateur.
          {sheets?.has_credential ? " Un compte de service est déjà configuré (laissez le champ vide pour le conserver)." : ""}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Identifiant du classeur</label>
            <input className={input} placeholder="1AbCdEf…" value={sheetSpreadsheetId} maxLength={100} onChange={(e) => setSheetSpreadsheetId(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Compte de service (JSON) {sheets?.has_credential && "— optionnel si inchangé"}</label>
            <textarea className={`${input} h-24 font-mono text-xs`} placeholder={'{ "type": "service_account", "client_email": …, "private_key": … }'} value={sheetSa} onChange={(e) => setSheetSa(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-semibold text-slate-700">Colonnes exportées</label>
          <div className="flex flex-wrap gap-2">
            {columns.map((c) => (
              <label key={c} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  checked={sheetFields.includes(c)}
                  onChange={(e) => setSheetFields((f) => (e.target.checked ? [...f, c] : f.filter((x) => x !== c)))}
                />
                {COLUMN_LABELS[c] ?? c}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={sheetActive} onChange={(e) => setSheetActive(e.target.checked)} />
            Intégration active
          </label>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50" onClick={saveSheets} disabled={busy === "sheets"}>
            {busy === "sheets" ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" onClick={runSync} disabled={syncing || !sheets?.spreadsheet_id || !sheets?.has_credential}>
            {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
          </button>
          {sheets?.has_credential && (
            <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100" onClick={resetSheets}>
              Déconnecter
            </button>
          )}
        </div>
        {sheets?.last_synced_at && (
          <p className="mt-3 text-xs text-slate-400">
            Dernière synchro : {new Date(sheets.last_synced_at).toLocaleString("fr-FR")} — {sheets.last_status === "success" ? "✅ succès" : sheets.last_status === "failure" ? `❌ ${sheets.last_error}` : "—"}
          </p>
        )}
        {syncMsg && <p className={`mt-2 text-sm ${syncMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{syncMsg.message}</p>}
        {ok["sheets"] && <p className="mt-2 text-sm text-emerald-600">{ok["sheets"]}</p>}
        {errors["sheets"] && <p className="mt-2 text-sm text-red-600">{errors["sheets"]}</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-900">WhatsApp — bouton de contact</h3>
        <p className="mb-3 text-sm text-slate-500">
          Interface extensible (Swivigo non intégré pour l'instant). Le site affiche un bouton de contact vers ce numéro.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Numéro (ex : 0550123456)</label>
            <input className={input} value={waPhone} maxLength={20} onChange={(e) => setWaPhone(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={waActive} onChange={(e) => setWaActive(e.target.checked)} />
            Bouton actif
          </label>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50" onClick={saveWhatsapp} disabled={busy === "whatsapp"}>
            {busy === "whatsapp" ? "Enregistrement…" : "Enregistrer"}
          </button>
          {ok["whatsapp"] && <span className="text-xs text-emerald-600">{ok["whatsapp"]}</span>}
          {errors["whatsapp"] && <span className="text-xs text-red-600">{errors["whatsapp"]}</span>}
        </div>
      </section>
    </div>
  );
}
