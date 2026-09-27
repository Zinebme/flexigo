import { Skeleton } from "@/components/ui";

/** Streaming placeholder for the order list (tabs + filters + rows). */
export default function OrdersLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="mb-3 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2.5 lg:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-10 w-full lg:w-44" />
          <Skeleton className="h-10 w-full lg:w-52" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="hidden divide-y divide-slate-100 lg:block">
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ms-auto h-4 w-20" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100 lg:hidden">
          {Array.from({ length: 4 }).map((_, r) => (
            <div key={r} className="space-y-2 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement des commandes…</span>
    </div>
  );
}
