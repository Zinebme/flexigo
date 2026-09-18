"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE } from "@/lib/storefront/lang";
import type { StoreLanguage } from "@/lib/types";

const LANGS: Array<{ code: StoreLanguage; label: string }> = [
  { code: "fr", label: "FR" },
  { code: "ar", label: "ع" },
  { code: "en", label: "EN" },
];

/**
 * Storefront language switcher (FR / AR(RTL) / EN).
 * Sets the fx_lang cookie and revalidates the server render — no client-side
 * dictionary, the server always renders the active language.
 */
export function LangSwitcher({ current }: { current: StoreLanguage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function pick(code: StoreLanguage) {
    setOpen(false);
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    // eslint-disable-next-line react-hooks/immutability -- document.cookie is the standard way to set a non-httpOnly cookie
    document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=${maxAge}; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        aria-label="Langue"
      >
        {LANGS.find((l) => l.code === current)?.label ?? "FR"} ▾
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => pick(l.code)}
                className={`block w-full rounded-md px-3 py-1.5 text-left text-sm font-medium transition hover:bg-slate-50 ${
                  l.code === current ? "text-blue-700" : "text-slate-700"
                }`}
              >
                {l.code === "fr" ? "Français" : l.code === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
