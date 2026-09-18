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
        title="Nouveau site — assistant de création"
        subtitle="Préparez un site complet avant de le livrer au client. 8 étapes — tout est recalculé côté serveur."
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
