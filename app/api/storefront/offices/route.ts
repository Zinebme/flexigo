import { resolveStoreBySlug } from "@/lib/storefront/resolve";
import { getAvailableOffices } from "@/lib/providers/shipping/offices";
import { clientIpFromHeaders, hit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("store_slug") ?? "";
  const wilayaCode = Number(url.searchParams.get("wilaya_code"));
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !Number.isInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 58) {
    return Response.json({ offices: [] }, { status: 400 });
  }
  if (!hit(`offices:${clientIpFromHeaders(req.headers)}`, 60, 10 * 60_000).ok) {
    return Response.json({ offices: [] }, { status: 429 });
  }
  try {
    const store = await resolveStoreBySlug(slug);
    if (!store || store.status !== "active") return Response.json({ offices: [] }, { status: 404 });
    const offices = await getAvailableOffices(store.id, wilayaCode);
    return Response.json({ offices }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    return Response.json({ offices: [] }, { status: 503 });
  }
}
