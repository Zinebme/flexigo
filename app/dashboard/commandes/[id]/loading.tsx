import { Skeleton } from "@/components/ui";

/** Streaming placeholder for a single order sheet. */
export default function OrderDetailLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Skeleton className="h-3 w-40" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-44" />
            <div className="mt-4 divide-y divide-slate-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <Skeleton className="ms-auto h-4 w-40" />
              <Skeleton className="ms-auto h-4 w-40" />
              <Skeleton className="ms-auto h-7 w-52" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
            <Skeleton className="mt-4 h-16 w-full" />
            <Skeleton className="mt-3 h-9 w-44" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-5 w-40" />
            <Skeleton className="mt-3 h-9 w-full" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Chargement de la commande…</span>
    </div>
  );
}
