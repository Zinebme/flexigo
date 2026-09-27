"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Tiny shared state for the dashboard navigation drawer.
 * The hamburger lives in the topbar, the drawer in the sidebar — this keeps
 * them in sync without lifting state into the server layout.
 * Mobile only: on `lg:` screens the sidebar is always visible.
 */

interface NavState {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

const NavContext = createContext<NavState | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close on Escape and lock background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

const FALLBACK: NavState = { open: false, setOpen: () => {}, toggle: () => {} };

export function useNav(): NavState {
  return useContext(NavContext) ?? FALLBACK;
}
