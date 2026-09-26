export function PageLoading({ title = "Chargement" }: { title?: string }) {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-5">
      <div>
        <span className="sr-only">{title}…</span>
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-64 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-5"><div className="h-4 w-24 rounded bg-slate-100" /><div className="mt-5 h-7 w-32 rounded bg-slate-100" /></div>)}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-5 w-40 rounded bg-slate-100" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100" />)}
        </div>
      </div>
    </div>
  );
}
