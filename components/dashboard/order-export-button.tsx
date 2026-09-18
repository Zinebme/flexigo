"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { btnSecondary } from "../ui";

/** Exports the CURRENTLY FILTERED order list as CSV (server-side route). */
export function OrderExportButton() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  return (
    <a
      href={`${pathname}/export${query ? `?${query}` : ""}`}
      className={btnSecondary}
    >
      ⬇️ Exporter (CSV)
    </a>
  );
}
