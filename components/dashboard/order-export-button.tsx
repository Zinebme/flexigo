"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { btnSecondary, btnSm } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Exports the CURRENTLY FILTERED order list as CSV (server-side route).
 * The `stage` tab is forwarded too, so the file matches what is on screen.
 */
export function OrderExportButton() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  return (
    <a href={`${pathname}/export${query ? `?${query}` : ""}`} className={cn(btnSecondary, btnSm)} download>
      <Icon name="download" size={15} />
      Exporter (CSV)
    </a>
  );
}
