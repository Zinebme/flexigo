"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputCls } from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actifs" },
  { value: "draft", label: "Brouillons" },
  { value: "suspended", label: "Suspendus" },
  { value: "archived", label: "Archivés" },
];

export function SitesFilter({ q, status }: { q: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function push(params: { q?: string; status?: string }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status) sp.set("status", params.status);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `/admin/sites?${qs}` : "/admin/sites");
    });
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        push({ q, status });
      }}
    >
      <input
        name="q"
        defaultValue={q}
        placeholder="Rechercher (nom, slug, client…)"
        className={`${inputCls} w-72`}
        onKeyUp={(e) => {
          if (e.key === "Enter") push({ q: (e.target as HTMLInputElement).value, status });
        }}
      />
      <select name="status" defaultValue={status} className={`${inputCls} w-44`} onChange={(e) => push({ q, status: e.target.value })}>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {(q || status) && (
        <button type="button" onClick={() => push({})} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Réinitialiser
        </button>
      )}
      {pending && <span className="text-xs text-slate-400">Chargement…</span>}
    </form>
  );
}
