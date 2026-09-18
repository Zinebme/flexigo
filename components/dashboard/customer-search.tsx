"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { btnSecondary } from "../ui";

export function CustomerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  function update(value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set("q", value);
    else p.delete("q");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Recherche (nom, téléphone, email)</label>
        <input
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
          placeholder="Ex : Karim, 0770…"
          defaultValue={q}
          onKeyDown={(e) => e.key === "Enter" && update((e.target as HTMLInputElement).value)}
        />
      </div>
      <button className={btnSecondary} onClick={() => update("")}>
        Réinitialiser
      </button>
    </div>
  );
}
