import { cn } from "@/lib/utils";

/**
 * Dependency-free bar chart for the merchant dashboard.
 * Pure presentation — data is precomputed server-side.
 *
 * CSS bars (instead of a stretched SVG) keep rounded corners crisp at any
 * width, and each bar gets a hover tooltip + accessible title.
 */
export function BarChart({
  data,
  height = 168,
  tone = "blue",
  formatValue,
  labelEvery,
}: {
  data: Array<{ label: string; value: number; title?: string }>;
  height?: number;
  tone?: "blue" | "violet" | "slate";
  formatValue?: (value: number) => string;
  labelEvery?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const tones: Record<string, string> = {
    blue: "bg-gradient-to-t from-blue-500 to-blue-400 group-hover:from-blue-600 group-hover:to-blue-500",
    violet: "bg-gradient-to-t from-violet-500 to-violet-400 group-hover:from-violet-600 group-hover:to-violet-500",
    slate: "bg-gradient-to-t from-slate-600 to-slate-500 group-hover:from-slate-800 group-hover:to-slate-600",
  };
  const fmt = formatValue ?? ((v: number) => v.toLocaleString("fr-FR"));
  // Show every Nth label so the axis stays readable on narrow screens.
  const step = labelEvery ?? (data.length > 10 ? 2 : 1);

  return (
    <div dir="ltr">
      <div className="relative" style={{ height }}>
        {/* gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-slate-100" />
          ))}
        </div>

        <div className="relative flex h-full items-end gap-[3px] sm:gap-1.5">
          {data.map((d, i) => {
            const pct = (d.value / max) * 100;
            const tip = d.title ?? `${d.label} — ${fmt(d.value)}`;
            return (
              <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={tip}>
                <div
                  className={cn(
                    "w-full rounded-t-[4px] transition-all duration-200",
                    d.value > 0 ? tones[tone] : "bg-slate-100",
                  )}
                  style={{ height: d.value > 0 ? `${Math.max(pct, 2)}%` : "2px" }}
                />
                {/* hover tooltip */}
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {tip}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] font-medium text-slate-400 tabular-nums">
            {i % step === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
