import { getMerchantContext } from "@/lib/auth/merchant-context";
import { can } from "@/lib/types";

import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  ecommerce: "E-commerce (multi-produits)",
  single_product: "Produit unique (COD)",
  portfolio: "Portfolio / vitrine",
};

export default async function ParametresPage() {
  const ctx = await getMerchantContext();
  const canManage = can(ctx.role, "settings.manage");

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Identité, coordonnées et options commerciales du site." />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Identité du site" subtitle="Le nom et le type de site sont gérés par la plateforme Marqova — contactez votre administrateur pour toute modification." />
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-400">Nom du site</dt>
              <dd className="font-semibold text-slate-800">{ctx.store.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Type de site</dt>
              <dd className="mt-1">
                <Badge tone="blue">{TYPE_LABELS[ctx.store.website_type] ?? ctx.store.website_type}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Devise</dt>
              <dd className="font-semibold text-slate-800">{ctx.store.currency}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Contact & options commerciales" />
          {canManage ? (
            <SettingsForm initial={ctx.store.settings} canManage={canManage} />
          ) : (
            <EmptyState icon="🔒" title="Accès restreint" text="Seul le propriétaire peut modifier les paramètres du site." />
          )}
        </Card>
      </div>
    </>
  );
}
