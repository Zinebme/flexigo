import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { SectionEditor } from "@/components/dashboard/section-editor";
import type { Section } from "@/lib/sections/definitions";
import type { PageRow } from "@/lib/supabase/database.types";
import type { WebsiteType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BannieresPage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();

  const { data: page } = await admin.from("pages").select("*").eq("store_id", ctx.store.id).eq("key", "home").maybeSingle();
  const { data: categories } = await admin.from("categories").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("position");

  if (!page) {
    return (
      <>
        <PageHeader title="Bannières" subtitle="Gérez vos bannières publicitaires — images desktop et mobile recommandées." />
        <Card className="p-6"><EmptyState icon="🖼️" title="Page d'accueil introuvable" text="La page d'accueil doit exister pour gérer les bannières." /></Card>
      </>
    );
  }

  const p = page as PageRow;
  const draft = (p.content ?? { sections: [] }) as { sections: Section[] };
  // Filter only banner sections for this dedicated view, but allow editing all via SectionEditor with hint
  const canEdit = can(ctx.role, "content.manage");

  return (
    <>
      <PageHeader
        title="Bannières"
        subtitle="Bannières publicitaires — desktop 1600×700, mobile 800×1000. Images basse résolution signalées."
      />

      <Card>
        <CardHeader
          title="Bannières de la page d'accueil"
          subtitle="Seules les sections de type 'Bannière' sont affichées ici. Pour gérer tous les types, utilisez Pages & sections."
        />
        <div className="p-5">
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            <strong>Recommandations images:</strong>
            <ul className="mt-1 list-disc pl-5">
              <li>Desktop: <code className="font-mono">1600 × 700 px</code> — JPG/WebP &lt; 500 KB</li>
              <li>Mobile: <code className="font-mono">800 × 1000 px</code> — vertical, &lt; 300 KB</li>
              <li>Évitez texte intégré dans l'image (SEO) — utilisez Titre/Sous-titre + bouton</li>
              <li>Le système détecte les images basse résolution lors de l'upload et affiche un avertissement</li>
            </ul>
          </div>
          {canEdit ? (
            <SectionEditor
              pageKey="home"
              pageTitle={p.title}
              initialContent={{ sections: draft.sections.filter((s) => s.type === "banner") }}
              websiteType={ctx.store.website_type as WebsiteType}
              categories={(categories ?? []) as Array<{ id: string; name: string }>}
            />
          ) : (
            <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de modifier les bannières." />
          )}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-bold text-slate-900">Toutes les sections (y compris bannières)</h3>
        <p className="mt-1 text-xs text-slate-500">{draft.sections.length} sections dans le brouillon — dont {draft.sections.filter((s) => s.type === "banner").length} bannière(s)</p>
        <div className="mt-3 grid gap-2">
          {draft.sections.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span>{i + 1}. {s.type} — {(s as { title?: string }).title ?? "—"}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${s.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.enabled ? "Visible" : "Masquée"}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
