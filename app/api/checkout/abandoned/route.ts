import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveStoreBySlug } from "@/lib/storefront/resolve";
import { clientIpFromHeaders, hit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  store_slug: z.string().trim().min(1).max(80),
  session_key: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  full_name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  wilaya_code: z.number().int().min(1).max(58).optional(),
  quantity: z.number().int().min(1).max(50),
  selected_options: z.record(z.string().max(40), z.array(z.string().max(60)).max(40)).optional(),
  estimated_total_cents: z.number().int().min(0).max(1_000_000_000).optional(),
  stage: z.enum(["contact", "delivery", "submitted"]).default("contact"),
});

export async function POST(req: Request) {
  const limit = hit(`abandoned:${clientIpFromHeaders(req.headers)}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return Response.json({ ok: false }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const body = parsed.data;
  const store = await resolveStoreBySlug(body.store_slug);
  if (!store || store.status !== "active") return Response.json({ ok: false }, { status: 404 });
  const admin = getAdminSupabase();
  const { data: product, error: productError } = await admin.from("products")
    .select("id, name").eq("store_id", store.id).eq("id", body.product_id).eq("is_active", true).is("deleted_at", null).maybeSingle();
  if (productError || !product) return Response.json({ ok: false }, { status: 404 });
  const { error } = await admin.from("abandoned_checkouts").upsert({
    store_id: store.id,
    session_key: body.session_key,
    product_id: product.id,
    variant_id: body.variant_id ?? null,
    product_name: product.name,
    full_name: body.full_name ?? null,
    phone: body.phone ?? null,
    wilaya_code: body.wilaya_code ?? null,
    quantity: body.quantity,
    selected_options: body.selected_options ?? {},
    estimated_total_cents: body.estimated_total_cents ?? null,
    stage: body.stage,
    reason_code: body.stage === "submitted" ? "submission_not_completed" : "left_before_confirmation",
    updated_at: new Date().toISOString(),
  }, { onConflict: "store_id,session_key" });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
