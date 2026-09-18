import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { MarketingManager } from "@/components/dashboard/marketing-manager";

export const dynamic = "force-dynamic";

const SHEET_COLUMNS = ["numero", "nom", "telephone", "wilaya", "commune", "livraison", "sous_total", "frais", "total", "statut", "creee"];

export default async function MarketingPage() {
  const ctx = await getMerchantContext();
  const canManage = can(ctx.role, "marketing.manage");
  const admin = getAdminSupabase();

  const [pixelsRes, sheetsRes, waRes] = await Promise.all([
    admin.from("marketing_integrations").select("*").eq("store_id", ctx.store.id),
    admin.from("google_sheet_integrations").select("*").eq("store_id", ctx.store.id).maybeSingle(),
    admin.from("whatsapp_integrations").select("*").eq("store_id", ctx.store.id).maybeSingle(),
  ]);

  const pixels = ((pixelsRes.data ?? []) as Array<Record<string, unknown>>).map((p) => ({
    provider_key: p.provider_key as string,
    is_active: (p.is_active as boolean) ?? false,
    pixel_id: ((p.config as Record<string, unknown> | null)?.pixel_id as string | null) ?? null,
    events_enabled: (p.events_enabled as string[]) ?? ["PageView"],
  }));
  const sheetsRow = (sheetsRes.data ?? null) as Record<string, unknown> | null;
  const waRow = (waRes.data ?? null) as Record<string, unknown> | null;

  return (
    <>
      <PageHeader title="Marketing" subtitle="Pixels, export Google Sheets et bouton WhatsApp — configuration contrôlée, aucun code libre." />
      <Card>
        <CardHeader title="Intégrations marketing" />
        {canManage ? (
          <MarketingManager
            pixels={pixels}
            sheets={
              sheetsRow
                ? {
                    spreadsheet_id: (sheetsRow.spreadsheet_id as string | null) ?? null,
                    has_credential: Boolean(sheetsRow.credential_encrypted),
                    fields: (sheetsRow.fields as string[]) ?? [],
                    is_active: (sheetsRow.is_active as boolean) ?? false,
                    last_synced_at: (sheetsRow.last_synced_at as string | null) ?? null,
                    last_status: (sheetsRow.last_status as string | null) ?? null,
                    last_error: (sheetsRow.last_error as string | null) ?? null,
                  }
                : null
            }
            whatsapp={
              waRow
                ? {
                    is_active: (waRow.is_active as boolean) ?? false,
                    phone: (waRow.phone as string | null) ?? null,
                    provider: (waRow.provider as string) ?? "none",
                  }
                : null
            }
            columns={SHEET_COLUMNS}
          />
        ) : (
          <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de gérer les intégrations marketing." />
        )}
      </Card>
    </>
  );
}
