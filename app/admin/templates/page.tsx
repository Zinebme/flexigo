import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { TEMPLATES } from "@/lib/templates/defaults";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await getAdminContext();
  const admin = getAdminSupabase();
  const { data: stores } = await admin.from("stores").select("template_key").is("deleted_at", null);
  const countByTpl = new Map<string, number>();
  for (const s of (stores ?? []) as Array<{ template_key: string }>) {
    countByTpl.set(s.template_key, (countByTpl.get(s.template_key) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader title="Templates" subtitle="4 modèles visuellement distincts — pas de simples recolorations." />
      <div className="grid gap-4 md:grid-cols-2">
        {TEMPLATES.map((tpl) => (
          <Card key={tpl.key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl" style={{ background: tpl.theme.primaryColor }} />
                <div>
                  <div className="font-bold text-slate-900">{tpl.name}</div>
                  <div className="font-mono text-xs text-slate-400">{tpl.key}</div>
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {countByTpl.get(tpl.key) ?? 0} site(s)
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{tpl.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Types: {tpl.websiteTypes.join(", ")}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Typo: {tpl.theme.typography}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Boutons: {tpl.theme.buttonShape}</span>
              <span className="rounded-full px-2 py-1 text-white" style={{ background: tpl.theme.primaryColor }}>Primaire</span>
              <span className="rounded-full px-2 py-1 text-white" style={{ background: tpl.theme.secondaryColor }}>Secondaire</span>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              Sections par défaut générées via <code className="font-mono">defaultHomeSections()</code> — bannières 1600×700 desktop / 800×1000 mobile recommandées.
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
