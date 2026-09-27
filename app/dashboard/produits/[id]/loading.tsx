import { Skeleton } from "@/components/ui";

/** Streaming placeholder for the product editor. */
export default function ProductEditLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2.5 h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="space-y-4 px-5 py-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="px-5 py-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-64" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="space-y-3 px-5 py-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement du produit…</span>
    </div>
  );
}
