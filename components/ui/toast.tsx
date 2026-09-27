"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";

/**
 * Dependency-free toast notifications for the dashboards.
 * Replaces the ad-hoc `window.alert` / inline green-red sentences: one
 * consistent, auto-dismissing feedback channel for every mutation.
 *
 * Usage: wrap the tree in <ToastProvider> (done in the dashboard layouts) then
 * `const toast = useToast(); toast.success("Statut mis à jour")`.
 * Outside a provider the hook is a no-op, so nothing ever crashes.
 */

export type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  push: (tone: ToastTone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLE: Record<ToastTone, { box: string; icon: IconName; iconCls: string }> = {
  success: { box: "border-emerald-200 bg-white", icon: "checkCircle", iconCls: "bg-emerald-50 text-emerald-600" },
  error: { box: "border-red-200 bg-white", icon: "alert", iconCls: "bg-red-50 text-red-600" },
  warning: { box: "border-amber-200 bg-white", icon: "alert", iconCls: "bg-amber-50 text-amber-600" },
  info: { box: "border-slate-200 bg-white", icon: "info", iconCls: "bg-blue-50 text-blue-600" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      seq.current += 1;
      const id = seq.current;
      setItems((list) => [...list.slice(-2), { id, tone, title, description }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      info: (title, description) => push("info", title, description),
      warning: (title, description) => push("warning", title, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fx-no-print pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end rtl:sm:right-auto rtl:sm:left-4"
        role="region"
        aria-live="polite"
      >
        {items.map((t) => {
          const style = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                "fx-anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/10",
                style.box,
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.iconCls)}>
                <Icon name={style.icon} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{t.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-me-1 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer la notification"
              >
                <Icon name="x" size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const NOOP: ToastApi = {
  push: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
};

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP;
}

/** Normalises the `{error: string | {message}}` shapes returned by the API routes. */
export function apiErrorMessage(data: unknown, fallback: string): string {
  const d = data as { error?: { message?: string } | string; message?: string } | null;
  if (!d) return fallback;
  if (typeof d.error === "string" && d.error) return d.error;
  if (d.error && typeof d.error === "object" && d.error.message) return d.error.message;
  if (typeof d.message === "string" && d.message) return d.message;
  return fallback;
}
