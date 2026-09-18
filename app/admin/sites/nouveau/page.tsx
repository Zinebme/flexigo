import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card } from "@/components/ui";
import { WizardClient } from "@/components/admin/wizard-client";

export const dynamic = "force-dynamic";

export default async function NouveauSitePage() {
  await getAdminContext();
  const admin = getAdminSupabase();
  const [{ data: orgs }, { data: profiles }] = await Promise.all([
    admin.from("organizations").select("id, name").order("name"),
    admin.from("profiles").select("id, email").order("email").limit(100),
  ]);

  return (
    <>
      <PageHeader
        title="Nouveau site — Website Creation Studio"
        subtitle="Studio interne de production — 11 étapes : CLIENT / TEMPLATE / IDENTITÉ / CONTENU / PRODUITS / CATÉGORIES / LIVRAISON COD / INTÉGRATIONS / DOMAINE / COMPTE CLIENT / FINAL REVIEW. Tout est recalculé côté serveur, prêt pour livraison client."
      />
      <Card className="p-5">
        <WizardClient
          organizations={(orgs ?? []) as Array<{ id: string; name: string }>}
          profiles={(profiles ?? []) as Array<{ id: string; email: string | null }>}
        />
      </Card>
    </>
  );
}
