import { Skeleton } from "@/components/ui";

/** Streaming placeholder for the platform order list. */
export default function AdminOrdersLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-xs lg:flex-1" />
          <Skeleton className="h-10 w-full lg:w-64" />
          <Skeleton className="h-10 w-full lg:w-52" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden divide-y divide-slate-100 lg:block">
          {Array.from({ length: 10 }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-1.5 h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100 lg:hidden">
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} className="space-y-2.5 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-3 w-44" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement des commandes…</span>
    </div>
  );
}
