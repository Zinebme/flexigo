import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { SiteControlCenter } from "@/components/admin/site-control-center";

export const dynamic = "force-dynamic";

export default async function AdminSiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getAdminContext();
  const admin = getAdminSupabase();

  const [
    { data: store },
    { data: org },
    { data: members },
    { data: domains },
    { data: pages },
    { data: orders },
    { data: products },
    { data: categories },
    { data: customers },
    { data: themes },
    { data: audits },
    { data: events },
    { data: shipping },
    { data: marketing },
    { data: sheets },
    { data: telegram },
    { data: pageVersions },
  ] = await Promise.all([
    admin.from("stores").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    admin.from("organizations").select("id, name").limit(100),
    admin.from("store_members").select("id, user_id, role, status, created_at").eq("store_id", id).order("created_at"),
    admin.from("domains").select("*").eq("store_id", id),
    admin.from("pages").select("*").eq("store_id", id).order("key"),
    admin.from("orders").select("id, order_number, total_cents, status, created_at").eq("store_id", id).order("created_at", { ascending: false }).limit(100),
    admin.from("products").select("id, name, price_cents, compare_at_price_cents, stock, category_id, is_active, is_featured").eq("store_id", id).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    admin.from("categories").select("id, name, slug, is_visible, position").eq("store_id", id).is("deleted_at", null).order("position"),
    admin.from("customers").select("id, name, phone, normalized_phone, email, notes, status, order_count, total_spent_cents, last_order_at").eq("store_id", id).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    admin.from("themes").select("*").eq("store_id", id).maybeSingle(),
    admin.from("audit_logs").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("system_events").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("shipping_integrations").select("*").eq("store_id", id),
    admin.from("marketing_integrations").select("*").eq("store_id", id),
    admin.from("google_sheet_integrations").select("*").eq("store_id", id).maybeSingle(),
    admin.from("telegram_integrations").select("*").eq("store_id", id).maybeSingle(),
    admin.from("page_versions").select("id, page_key, version, created_at, published_by").eq("store_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  if (!store) notFound();

  const s = store as Record<string, unknown>;
  const orgMap = new Map(((org ?? []) as Array<{ id: string; name: string }>).map((o) => [o.id, o.name]));
  const memberUserIds = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
  const { data: profiles } = memberUserIds.length > 0 ? await admin.from("profiles").select("id, email, full_name, dashboard_language").in("id", memberUserIds) : { data: [] };
  const profileMap = new Map(((profiles ?? []) as Array<{ id: string; email: string | null; full_name: string | null; dashboard_language: "fr" | "ar" | "en" }>).map((p) => [p.id, { email: p.email, full_name: p.full_name, dashboard_language: p.dashboard_language }]));

  const gmv = ((orders ?? []) as Array<{ total_cents: number; status: string }>).filter((o) => !["cancelled_customer", "cancelled_store"].includes(o.status)).reduce((acc, o) => acc + o.total_cents, 0);

  return (
    <SiteControlCenter
      store={s}
      orgMap={orgMap}
      members={(members ?? []) as Array<Record<string, unknown>>}
      profileMap={profileMap}
      domains={(domains ?? []) as Array<Record<string, unknown>>}
      pages={(pages ?? []) as Array<Record<string, unknown>>}
      orders={(orders ?? []) as Array<Record<string, unknown>>}
      products={(products ?? []) as Array<Record<string, unknown>>}
      categories={(categories ?? []) as Array<Record<string, unknown>>}
      customers={(customers ?? []) as Array<Record<string, unknown>>}
      themes={themes as Record<string, unknown> | null}
      audits={(audits ?? []) as Array<Record<string, unknown>>}
      events={(events ?? []) as Array<Record<string, unknown>>}
      shipping={(shipping ?? []) as Array<Record<string, unknown>>}
      marketing={(marketing ?? []) as Array<Record<string, unknown>>}
      sheets={sheets as Record<string, unknown> | null}
      telegram={telegram as Record<string, unknown> | null}
      pageVersions={(pageVersions ?? []) as Array<{ id: string; page_key: string; version: number; created_at: string; published_by: string | null }>}
      gmv={gmv}
    />
  );
}
