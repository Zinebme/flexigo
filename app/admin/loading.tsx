import { Skeleton } from "@/components/ui";

/** Streaming placeholder for the platform overview. */
export default function AdminOverviewLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-7 w-72" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="mt-4 h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-7 h-16 w-full rounded-2xl" />
      <span className="sr-only">Chargement de la plateforme…</span>
    </div>
  );
}
