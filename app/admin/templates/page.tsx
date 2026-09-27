import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { READY_TEMPLATES, templatePreviewPath } from "@/lib/templates/defaults";
import { PageHeader, Card, Badge } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { adminBtnCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await getAdminContext();
  const admin = getAdminSupabase();
  const { data: stores } = await admin.from("stores").select("template_key").is("deleted_at", null);
  const countByTpl = new Map<string, number>();
  for (const s of (stores ?? []) as Array<{ template_key: string }>) {
    countByTpl.set(s.template_key, (countByTpl.get(s.template_key) ?? 0) + 1);
  }
  const totalSites = (stores ?? []).length;

  return (
    <>
      <PageHeader
        eyebrow="Plateforme"
        icon="palette"
        title="Templates"
        subtitle="Uniquement les templates réellement prêts à livrer. Visualisez avant de les utiliser pour un client."
      >
        <Badge tone="violet" size="sm">{READY_TEMPLATES.length} modèle(s)</Badge>
        <Badge tone="gray" size="sm">{totalSites} site(s) créé(s)</Badge>
        <Link href="/preview" target="_blank" className={adminBtnCls("secondary", "md")}>
          <Icon name="eye" size={15} />
          Comparer
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        {READY_TEMPLATES.map((tpl) => {
          const preview = templatePreviewPath(tpl.key);
          const used = countByTpl.get(tpl.key) ?? 0;
          return (
            <Card key={tpl.key} className="overflow-hidden p-0" hover>
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
                    <span className="absolute bottom-4 start-5 inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Icon name="globe" size={10} />
                      RTL — العربية
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-inset ring-slate-900/10"
                      style={{ background: tpl.theme.primaryColor }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">{tpl.name}</div>
                      <div className="fx-num truncate text-xs text-slate-400">{tpl.key}</div>
                    </div>
                  </div>
                  <Badge tone={used > 0 ? "violet" : "gray"} size="sm" icon="store">
                    {used} site(s)
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">{tpl.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    <Icon name="layers" size={11} className="text-slate-400" />
                    Types : {tpl.websiteTypes.join(", ")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    <Icon name="fileText" size={11} className="text-slate-400" />
                    Typo : {tpl.theme.typography}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    <Icon name="sliders" size={11} className="text-slate-400" />
                    Boutons : {tpl.theme.buttonShape}
                  </span>
                  <span className="rounded-full px-2 py-1 font-semibold text-white" style={{ background: tpl.theme.primaryColor }}>
                    Primaire
                  </span>
                  <span className="rounded-full px-2 py-1 font-semibold text-white" style={{ background: tpl.theme.secondaryColor }}>
                    Secondaire
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {preview ? (
                    <>
                      <a href={preview} target="_blank" rel="noreferrer" className={adminBtnCls("primary", "sm")}>
                        <Icon name="eye" size={14} />
                        Visualiser
                      </a>
                      <a href={`${preview}/produit`} target="_blank" rel="noreferrer" className={adminBtnCls("secondary", "sm")}>
                        <Icon name="package" size={14} />
                        Page produit
                      </a>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Icon name="alert" size={13} />
                      Aperçu indisponible
                    </span>
                  )}
                  <span className="ms-auto text-xs text-slate-400">Démo — aucune commande réelle.</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
