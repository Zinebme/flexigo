import Link from "next/link";
import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PAGE_KEYS, PAGE_LABELS } from "@/lib/types";
import { formatDateTimeFr } from "@/lib/utils";
import { PageHeader, Card, Table, Th, Td, Badge } from "@/components/ui";
import type { PageRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function SitePage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const { data: pages } = await admin.from("pages").select("*").eq("store_id", ctx.store.id);

  const rows = (pages ?? []) as PageRow[];
  const byKey = new Map<string, PageRow>(rows.map((p): [string, PageRow] => [p.key, p]));
  const canEdit = can(ctx.role, "content.manage");

  return (
    <>
      <PageHeader
        title="Mon site"
        subtitle="Pages et sections — modifiez le contenu, la mise en forme est gérée par votre modèle."
      />
      <Card>
        <Table
          head={
            <>
              <Th>Page</Th>
              <Th>Statut</Th>
              <Th>Version en ligne</Th>
              <Th>Dernière publication</Th>
              <Th>Modifié le</Th>
              <Th />
            </>
          }
        >
          {PAGE_KEYS.map((key) => {
            const p = byKey.get(key);
            const dirty = p ? JSON.stringify(p.content ?? null) !== JSON.stringify(p.published_content ?? null) : false;
            return (
              <tr key={key} className="transition hover:bg-slate-50">
                <Td className="font-medium text-slate-800">{PAGE_LABELS[key]}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {!p && <Badge tone="gray">Non créée</Badge>}
                    {p && p.version > 0 && <Badge tone="green">En ligne</Badge>}
                    {p && p.version === 0 && <Badge tone="amber">Brouillon</Badge>}
                    {p && dirty && p.version > 0 && <Badge tone="blue">Modifs non publiées</Badge>}
                  </div>
                </Td>
                <Td className="text-slate-600">{p?.version ?? 0}</Td>
                <Td className="text-slate-500">{p?.published_at ? formatDateTimeFr(p.published_at) : "—"}</Td>
                <Td className="text-slate-500">{p ? formatDateTimeFr(p.updated_at) : "—"}</Td>
                <Td>
                  {canEdit && (
                    <Link href={`/dashboard/site/${key}`} className="text-sm font-semibold text-blue-600 hover:underline">
                      Éditer
                    </Link>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
