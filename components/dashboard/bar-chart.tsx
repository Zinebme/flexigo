/**
 * Dependency-free SVG bar chart for the merchant dashboard.
 * Pure presentation — data is precomputed server-side.
 */
export function BarChart({
  data,
  height = 160,
}: {
  data: Array<{ label: string; value: number; title?: string }>;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 100 ${height / 2}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 2 - 6);
          return (
            <rect
              key={i}
              x={i * w + w * 0.15}
              y={height / 2 - h}
              width={w * 0.7}
              height={Math.max(h, d.value > 0 ? 1 : 0)}
              rx={0.8}
              className="fill-blue-500"
              opacity={0.9}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center" title={d.title}>
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
