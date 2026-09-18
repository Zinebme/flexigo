import { getMerchantContext } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { can } from "@/lib/types";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { ThemeForm } from "@/components/dashboard/theme-form";
import type { ThemeRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const ctx = await getMerchantContext();
  const admin = getAdminSupabase();
  const { data: theme } = await admin.from("themes").select("*").eq("store_id", ctx.store.id).maybeSingle();

  const canManage = can(ctx.role, "appearance.manage");
  const t = (theme as ThemeRow | null) ?? {
    id: "",
    store_id: ctx.store.id,
    logo_url: null,
    favicon_url: null,
    primary_color: "#1d4ed8",
    secondary_color: "#f59e0b",
    background_color: null,
    typography: "modern",
    button_shape: "rounded",
    announcement: null,
    updated_at: "",
  };

  return (
    <>
      <PageHeader title="Apparence" subtitle="Logo, couleurs, typographie approuvée et bandeau d'annonce. La mise en page est gérée par votre modèle." />
      <Card>
        <CardHeader title="Thème du site" />
        {canManage ? (
          <ThemeForm initial={t} />
        ) : (
          <EmptyState icon="🔒" title="Accès restreint" text="Votre rôle ne permet pas de modifier l'apparence." />
        )}
      </Card>
    </>
  );
}
