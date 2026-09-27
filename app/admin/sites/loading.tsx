import { Skeleton } from "@/components/ui";

/** Streaming placeholder for the platform site list. */
export default function AdminSitesLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2.5 h-7 w-28" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm lg:flex-1" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden divide-y divide-slate-100 lg:block">
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100 lg:hidden">
          {Array.from({ length: 4 }).map((_, r) => (
            <div key={r} className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-2 h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement des sites…</span>
    </div>
  );
}
