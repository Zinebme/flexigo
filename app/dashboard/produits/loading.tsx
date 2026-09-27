import { Skeleton } from "@/components/ui";

/** Streaming placeholder for the product catalogue. */
export default function ProductsLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2.5 lg:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full lg:w-56" />
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="hidden divide-y divide-slate-100 md:block">
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-1.5 h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 4 }).map((_, r) => (
            <div key={r} className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement des produits…</span>
    </div>
  );
}
