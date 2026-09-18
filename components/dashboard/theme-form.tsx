"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TYPOGRAPHY_PRESETS, BUTTON_SHAPES } from "@/lib/types";
import type { ThemeRow } from "@/lib/supabase/database.types";

const TYPOGRAPHY_LABELS: Record<string, string> = {
  modern: "Moderne (sans-serif)",
  elegant: "Élégante (serif)",
  bold: "Agréssive (grosse graisse)",
  minimal: "Minimale (légère)",
};
const SHAPE_LABELS: Record<string, string> = {
  rounded: "Arrondie",
  sharp: "Anguleuse",
  pill: "Pill (très arrondie)",
};

export function ThemeForm({ initial }: { initial: ThemeRow }) {
  const router = useRouter();
  const [logo, setLogo] = useState(initial.logo_url ?? "");
  const [favicon, setFavicon] = useState(initial.favicon_url ?? "");
  const [primary, setPrimary] = useState(initial.primary_color);
  const [secondary, setSecondary] = useState(initial.secondary_color);
  const [background, setBackground] = useState(initial.background_color ?? "");
  const [typography, setTypography] = useState(initial.typography);
  const [shape, setShape] = useState(initial.button_shape);
  const [announcement, setAnnouncement] = useState(initial.announcement ?? "");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  async function upload(ref: React.RefObject<HTMLInputElement | null>, field: "logo" | "favicon") {
    const file = ref.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", field);
    setError(null);
    const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: { message?: string } | string };
    if (!res.ok || !data.ok || !data.url) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Téléversement impossible"));
      return;
    }
    if (field === "logo") setLogo(data.url);
    else setFavicon(data.url);
    if (ref.current) ref.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const payload: Record<string, unknown> = {
      primary_color: primary,
      secondary_color: secondary,
      background_color: background || null,
      typography,
      button_shape: shape,
      announcement: announcement.trim(),
    };
    if (logo) payload.logo_url = logo;
    if (favicon) payload.favicon_url = favicon;

    const res = await fetch("/api/dashboard/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(typeof data.error === "string" ? data.error : (data.error?.message ?? "Enregistrement impossible"));
      return;
    }
    setOkMsg("Apparence enregistrée — visible immédiatement sur le site.");
    router.refresh();
  }

  const label = "mb-1 block text-sm font-semibold text-slate-700";
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm";

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>Logo</label>
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" className="h-12 w-24 rounded-lg border border-slate-200 bg-white object-contain p-1" />
            ) : (
              <div className="flex h-12 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">Aucun logo</div>
            )}
            <input ref={logoRef} type="file" accept="image/png,image/webp,image/jpeg,image/svg+xml" className="text-sm" onChange={() => upload(logoRef, "logo")} />
            {logo && (
              <button type="button" className="text-sm font-semibold text-red-500 hover:underline" onClick={() => setLogo("")}>
                Retirer
              </button>
            )}
          </div>
        </div>
        <div>
          <label className={label}>Favicon</label>
          <div className="flex items-center gap-3">
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon} alt="Favicon" className="h-10 w-10 rounded-lg border border-slate-200 bg-white object-contain p-1" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">—</div>
            )}
            <input ref={faviconRef} type="file" accept="image/png,image/webp,image/jpeg,image/svg+xml" className="text-sm" onChange={() => upload(faviconRef, "favicon")} />
            {favicon && (
              <button type="button" className="text-sm font-semibold text-red-500 hover:underline" onClick={() => setFavicon("")}>
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={label}>Couleur principale</label>
          <div className="flex items-center gap-2">
            <input type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300" value={primary} onChange={(e) => setPrimary(e.target.value)} />
            <input className={`${input} font-mono`} value={primary} maxLength={7} onChange={(e) => setPrimary(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Couleur secondaire</label>
          <div className="flex items-center gap-2">
            <input type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
            <input className={`${input} font-mono`} value={secondary} maxLength={7} onChange={(e) => setSecondary(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Couleur de fond (optionnel)</label>
          <div className="flex items-center gap-2">
            <input type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300" value={background || "#ffffff"} onChange={(e) => setBackground(e.target.value)} />
            <button type="button" className="text-sm text-slate-400 hover:text-slate-600" onClick={() => setBackground("")}>
              Effacer
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>Typographie (préréglages approuvés)</label>
          <select className={input} value={typography} onChange={(e) => setTypography(e.target.value)}>
            {TYPOGRAPHY_PRESETS.map((t) => (
              <option key={t} value={t}>{TYPOGRAPHY_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Forme des boutons</label>
          <select className={input} value={shape} onChange={(e) => setShape(e.target.value)}>
            {BUTTON_SHAPES.map((s) => (
              <option key={s} value={s}>{SHAPE_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Bandeau d'annonce (optionnel)</label>
        <input className={input} maxLength={160} placeholder="Ex : Livraison gratuite à Alger dès 10 000 DA" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer l'apparence"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
      </div>
    </form>
  );
}
