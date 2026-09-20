import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { READY_TEMPLATES, templatePreviewPath } from "@/lib/templates/defaults";
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
      <PageHeader title="Templates" subtitle="Uniquement les templates réellement prêts à livrer. Cliquez sur Visualiser avant de les utiliser pour un client." />
      <div className="grid gap-4 md:grid-cols-2">
        {READY_TEMPLATES.map((tpl) => (
          <Card key={tpl.key} className="overflow-hidden p-0">
            {tpl.screenshotUrl ? (
              <div className="relative flex items-start gap-3 border-b border-slate-100 bg-slate-50 p-3">
                {/* Desktop preview */}
                {/* eslint-disable-next-line @next/next/no-img-element -- static template previews from /public */}
                <img
                  src={tpl.screenshotUrl}
                  alt={`Aperçu ${tpl.name}`}
                  className="h-32 w-full max-w-[320px] flex-1 rounded-lg border border-slate-200 bg-white object-cover object-top"
                  loading="lazy"
                />
                {/* Mobile preview (when the template provides one) */}
                {tpl.previewMobileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static template previews from /public
                  <img
                    src={tpl.previewMobileUrl}
                    alt={`Aperçu mobile ${tpl.name}`}
                    className="hidden h-32 w-[80px] shrink-0 rounded-lg border border-slate-200 bg-white object-cover object-top sm:block"
                    loading="lazy"
                  />
                ) : null}
                {tpl.direction === "rtl" ? (
                  <span className="absolute bottom-4 start-5 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
                    RTL — العربية
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="p-5">
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
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {templatePreviewPath(tpl.key) ? (
                <>
                  <a
                    href={templatePreviewPath(tpl.key) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Visualiser
                  </a>
                  <a
                    href={`${templatePreviewPath(tpl.key)}/produit`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Voir page produit
                  </a>
                </>
              ) : null}
              <span className="text-xs text-slate-400">Aperçu démo — aucune commande réelle.</span>
            </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
