"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner, inputCls } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "draft", label: "Brouillons" },
  { value: "suspended", label: "Suspendus" },
  { value: "archived", label: "Archivés" },
];

/**
 * Site list filters — URL driven (`?q=&status=`), same parameters as before:
 * - one-click status pills with live counts (replaces the status dropdown),
 * - debounced search with clear button,
 * - reset when any filter is active.
 */
export function SitesFilter({
  q,
  status,
  counts,
}: {
  q: string;
  status: string;
  counts?: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(q);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(nextQ: string, nextStatus: string) {
    const sp = new URLSearchParams();
    if (nextQ) sp.set("q", nextQ);
    if (nextStatus) sp.set("status", nextStatus);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `/admin/sites?${qs}` : "/admin/sites");
    });
  }

  // Debounced search (skips the first render so mounting never navigates).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    timer.current = setTimeout(() => navigate(value, status), 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const count = (key: string) => (counts ? counts[key] ?? 0 : undefined);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 lg:max-w-sm lg:flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            type="search"
            value={value}
            placeholder="Rechercher (nom, slug, client…)"
            aria-label="Rechercher un site"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                navigate(value, status);
              }
            }}
            className={cn(inputCls, "ps-9", value ? "pe-9" : "")}
          />
          {value ? (
            <button
              type="button"
              onClick={() => {
                setValue("");
                navigate("", status);
              }}
              className="absolute top-1/2 end-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Effacer la recherche"
            >
              <Icon name="x" size={13} />
            </button>
          ) : null}
        </div>

        <div className="fx-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            const total = count(tab.value);
            return (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => {
                  // Cancel any pending debounced search so the pill wins.
                  if (timer.current) clearTimeout(timer.current);
                  navigate(value, tab.value);
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {tab.label}
                {total !== undefined ? (
                  <span
                    className={cn(
                      "fx-num rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {total}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:ms-auto">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Spinner size={13} />
              Filtrage…
            </span>
          ) : null}
          {q || status ? (
            <button
              type="button"
              onClick={() => {
                setValue("");
                navigate("", "");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Icon name="refresh" size={13} />
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
