import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { domainSchema, parseBody } from "@/lib/schemas";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = domainSchema.extend({
  is_primary: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const input = parseBody(createSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("id").eq("id", input.store_id).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");

    // hostname unique check
    const { data: clash } = await admin.from("domains").select("id").eq("hostname", input.hostname).maybeSingle();
    if (clash) throw err("CONFLICT", `Domaine ${input.hostname} déjà utilisé.`);

    const token = Math.random().toString(36).slice(2, 10);

    const { data, error } = await admin
      .from("domains")
      .insert({
        store_id: input.store_id,
        hostname: input.hostname,
        is_primary: input.is_primary ?? false,
        status: "pending",
        verification_token: token,
      } as never)
      .select("id, hostname")
      .single();
    if (error) throw error;

    if (input.is_primary) {
      await admin.from("domains").update({ is_primary: false } as never).eq("store_id", input.store_id).neq("id", (data as { id: string }).id);
      await admin.from("domains").update({ is_primary: true } as never).eq("id", (data as { id: string }).id);
    }

    void logAudit({
      actorId: ctx.user.id,
      storeId: input.store_id,
      action: "domain.created",
      entity: "domain",
      entityId: (data as { id: string }).id,
      metadata: { hostname: input.hostname },
    });

    return NextResponse.json({ ok: true, domain: data });
  } catch (e) {
    return toErrorResponse(e);
  }
}
