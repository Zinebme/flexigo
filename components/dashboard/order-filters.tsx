"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Order list filters — URL-driven (shareable, refresh-safe).
 *
 * Improvements over the previous version, same parameters (`q`, `status`,
 * `wilaya`, `from`, `to`) plus `stage` used by the status tabs:
 * - debounced search with a clear button (no need to press Enter / blur),
 * - period presets (Aujourd'hui, 7 j, 30 j, ce mois) → far fewer clicks,
 * - active filters shown as removable chips,
 * - picking a precise status clears the stage tab and vice-versa.
 */

const selectCls =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white ps-3 pe-8 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function iso(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const today = iso(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: iso(d), to: today };
  }
  if (preset === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { from: iso(d), to: today };
  }
  if (preset === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: iso(d), to: today };
  }
  return null;
}

const PRESETS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "month", label: "Ce mois" },
];

export function OrderFilters({
  statuses,
  wilayas,
}: {
  statuses: Array<{ value: string; label: string }>;
  wilayas: Array<{ code: number; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [term, setTerm] = useState(params.get("q") ?? "");
  const [period, setPeriod] = useState("detect");

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  function update(entries: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Debounced search.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (term === current) return;
    const t = setTimeout(() => update({ q: term.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  // Detect which preset (if any) matches the current from/to.
  const detectedPreset = useMemo(() => {
    if (!from && !to) return "";
    for (const preset of PRESETS) {
      const range = presetRange(preset.value);
      if (range && range.from === from && range.to === to) return preset.value;
    }
    return "custom";
  }, [from, to]);

  const effectivePeriod = period === "detect" ? detectedPreset : period;

  function applyPeriod(value: string) {
    setPeriod(value);
    if (!value) {
      update({ from: null, to: null });
      return;
    }
    if (value === "custom") return; // the two date inputs take over
    const range = presetRange(value);
    if (range) update({ from: range.from, to: range.to });
  }

  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (params.get("q")) activeChips.push({ key: "q", label: `Recherche : ${params.get("q")}`, onRemove: () => { setTerm(""); update({ q: null }); } });
  if (params.get("status")) {
    const label = statuses.find((s) => s.value === params.get("status"))?.label ?? params.get("status");
    activeChips.push({ key: "status", label: `Statut : ${label}`, onRemove: () => update({ status: null }) });
  }
  if (params.get("wilaya")) {
    const w = wilayas.find((x) => String(x.code) === params.get("wilaya"));
    activeChips.push({ key: "wilaya", label: `Wilaya : ${w?.name ?? params.get("wilaya")}`, onRemove: () => update({ wilaya: null }) });
  }
  if (from || to) {
    activeChips.push({
      key: "period",
      label: `Période : ${from || "…"} → ${to || "…"}`,
      onRemove: () => { setPeriod(""); update({ from: null, to: null }); },
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                update({ q: term.trim() });
              }
            }}
            placeholder="N° commande, nom ou téléphone…"
            aria-label="Rechercher une commande"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white ps-9 pe-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          {term ? (
            <button
              type="button"
              onClick={() => { setTerm(""); update({ q: null }); }}
              aria-label="Effacer la recherche"
              className="absolute top-1/2 end-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>

        {/* Precise status */}
        <div className="relative lg:w-48">
          <select
            aria-label="Filtrer par statut"
            className={selectCls}
            value={params.get("status") ?? ""}
            onChange={(e) => update({ status: e.target.value || null, stage: null })}
          >
            <option value="">Tous les statuts</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Icon name="chevronDown" size={15} className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Wilaya */}
        <div className="relative lg:w-44">
          <select
            aria-label="Filtrer par wilaya"
            className={selectCls}
            value={params.get("wilaya") ?? ""}
            onChange={(e) => update({ wilaya: e.target.value || null })}
          >
            <option value="">Toutes les wilayas</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
          <Icon name="chevronDown" size={15} className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Period */}
        <div className="relative lg:w-52">
          <select
            aria-label="Filtrer par période"
            className={selectCls}
            value={effectivePeriod}
            onChange={(e) => applyPeriod(e.target.value)}
          >
            <option value="">Toute la période</option>
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <option value="custom">Dates personnalisées…</option>
          </select>
          <Icon name="calendar" size={15} className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {effectivePeriod === "custom" ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            Du
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => update({ from: e.target.value || null })}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            Au
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => update({ to: e.target.value || null })}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </div>
      ) : null}

      {activeChips.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-400">Filtres actifs</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100",
              )}
            >
              {chip.label}
              <Icon name="x" size={12} strokeWidth={2.4} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setTerm(""); setPeriod(""); router.replace(pathname, { scroll: false }); }}
            className="ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Icon name="refresh" size={13} />
            Tout réinitialiser
          </button>
        </div>
      ) : null}
    </div>
  );
}
