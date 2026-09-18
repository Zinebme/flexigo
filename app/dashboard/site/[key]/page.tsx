import { notFound } from "next/navigation";
import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PAGE_KEYS, PAGE_LABELS, type PageKey, type WebsiteType } from "@/lib/types";
import { formatDateTimeFr } from "@/lib/utils";
import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";
import { SectionEditor } from "@/components/dashboard/section-editor";
import type { Section } from "@/lib/sections/definitions";
import type { PageRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function SiteEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!PAGE_KEYS.includes(key as PageKey)) notFound();

  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();

  const [{ data: page }, { data: categories }] = await Promise.all([
    admin.from("pages").select("*").eq("store_id", ctx.store.id).eq("key", key).maybeSingle(),
    admin.from("categories").select("id, name").eq("store_id", ctx.store.id).is("deleted_at", null).order("position", { ascending: true }),
  ]);
  if (!page) notFound();

  const canEdit = can(ctx.role, "content.manage");
  const p = page as PageRow;
  const draft = (p.content ?? { sections: [] }) as { sections: Section[] };
  const published = (p.published_content ?? null) as { sections?: Section[] } | null;
  const dirty = JSON.stringify(p.content ?? null) !== JSON.stringify(p.published_content ?? null);

  return (
    <>
      <PageHeader
        title={`Mon site — ${PAGE_LABELS[key as PageKey]}`}
        subtitle={
          <>
            Version en ligne : <span className="font-semibold text-slate-700">{p.version}</span>
            {p.published_at ? ` · publiée le ${formatDateTimeFr(p.published_at)}` : " · jamais publiée"}
            {dirty && p.version > 0 && <Badge tone="blue">modifs non publiées</Badge>}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/s/${ctx.store.slug}`} target="_blank" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            Voir le site
          </Link>
          <Link href="/dashboard/site" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            ← Toutes les pages
          </Link>
        </div>
      </PageHeader>

      <Card>
        <CardHeader
          title="Sections de la page"
          subtitle={published ? `${published.sections?.length ?? 0} sections en ligne · ${draft.sections.length} dans le brouillon` : "Aucune version publiée"}
        />
        {canEdit ? (
          <SectionEditor
            pageKey={key}
            pageTitle={p.title}
            initialContent={draft}
            websiteType={ctx.store.website_type as WebsiteType}
            categories={(categories ?? []) as Array<{ id: string; name: string }>}
          />
        ) : (
          <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de modifier le contenu." />
        )}
      </Card>
    </>
  );
}
