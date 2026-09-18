import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  page_key: z.string().min(1).max(60),
  version: z.number().int().positive(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAdminContext();
    const body = await req.json().catch(() => null);
    const input = schema.parse(body);

    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    const { data, error } = await (admin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)(
      "fn_restore_page_version",
      {
        p_store_id: id,
        p_page_key: input.page_key,
        p_version: input.version,
        p_actor_id: ctx.user.id,
      },
    );
    if (error) {
      const msg = (error as { message?: string }).message ?? "";
      if (msg.includes("VERSION_NOT_FOUND")) throw err("NOT_FOUND", "Version introuvable");
      if (msg.includes("PAGE_NOT_FOUND")) throw err("NOT_FOUND", "Page introuvable");
      throw error;
    }

    await logAudit({
      actorId: ctx.user.id,
      storeId: id,
      action: "page.restored",
      entity: "page",
      entityId: `${input.page_key}:${input.version}`,
      metadata: { page_key: input.page_key, from_version: input.version, result: data },
    });

    return NextResponse.json({ ok: true, ...(data as object) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
