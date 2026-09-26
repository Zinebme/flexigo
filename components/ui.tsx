import { cn } from "../lib/utils";

/**
 * Minimal, dependency-free UI kit for the dashboards (French SaaS).
 * Server-friendly: everything here is plain markup + Tailwind.
 */

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "good" | "warn" | "bad" | "primary" }) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-red-600",
    primary: "text-blue-600",
  };
  return (
    <Card className="stat-card relative overflow-hidden p-5">
      <div className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-slate-200" aria-hidden="true" />
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className={cn("mt-3 text-[1.7rem] font-extrabold tracking-tight", tones[tone])}>{value}</div>
      {hint ? <div className="mt-1 text-sm text-slate-500">{hint}</div> : null}
    </Card>
  );
}

const badgeTones: Record<string, string> = {
  gray: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
  slate: "bg-slate-800 text-white",
};

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof badgeTones | string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone] ?? badgeTones.gray)}>
      {children}
    </span>
  );
}

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto fx-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{head}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("whitespace-nowrap bg-slate-50/70 px-5 py-3", className)}>{children}</th>;
}

export function Td({ children, className = "", colSpan, title }: { children?: React.ReactNode; className?: string; colSpan?: number; title?: string }) {
  return (
    <td className={cn("px-5 py-4 align-middle", className)} colSpan={colSpan} title={title}>
      {children}
    </td>
  );
}

export function EmptyState({ icon = "📭", title, text }: { icon?: string; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="mt-3 font-semibold text-slate-800">{title}</div>
      {text ? <div className="mt-1 max-w-sm text-sm text-slate-600">{text}</div> : null}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400";
export const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50";
