import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { DomainsManager } from "@/components/admin/domains-manager";
import { verificationRecord } from "@/lib/domains";
import { platformHostname } from "@/lib/storefront/hosts";

export const dynamic = "force-dynamic";

export default async function AdminDomainesPage() {
  await getAdminContext();
  const admin = getAdminSupabase();
  const [{ data: domains, error: domainError }, { data: stores, error: storeError }] = await Promise.all([
    admin.from("domains").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    admin.from("stores").select("id, name, slug").is("deleted_at", null).order("name"),
  ]);
  if (domainError || storeError) throw domainError ?? storeError;
  const rows = (domains ?? []).map((d) => ({
    id: d.id, store_id: d.store_id, hostname: d.hostname, status: d.status,
    is_primary: d.is_primary, created_at: d.created_at, verified_at: d.verified_at,
    verification_data: d.verification_data as Record<string, unknown> | null,
    txt: verificationRecord(d.hostname, d.verification_token),
  }));
  return (
    <>
      <PageHeader eyebrow="Plateforme" icon="globe" title="Domaines" subtitle="Sous-domaines des boutiques et domaines personnalisés." />
      <Card>
        <CardHeader icon="plug" title="Gérer les domaines" subtitle="La vérification TXT et l'activation du domaine dans l'hébergement sont deux étapes distinctes." />
        <div className="px-5 py-4">
          <DomainsManager stores={stores ?? []} domains={rows} platformHost={platformHostname()} dnsTargets={{
            cname: process.env.MARQOVA_DNS_CNAME_TARGET ?? "",
            apexIps: (process.env.MARQOVA_DNS_APEX_IPV4_TARGETS ?? "").split(",").map((ip) => ip.trim()).filter(Boolean),
          }} />
        </div>
      </Card>
    </>
  );
}
