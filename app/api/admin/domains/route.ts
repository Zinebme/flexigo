import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toErrorResponse, err } from "@/lib/errors";
import { domainSchema, parseBody } from "@/lib/schemas";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { generateToken } from "@/lib/crypto/encrypt";
import { platformHostname } from "@/lib/storefront/hosts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = domainSchema.extend({
  is_primary: z.boolean().optional().default(false),
  dns_mode: z.enum(["apex", "subdomain"]).optional().default("apex"),
});

export async function POST(req: Request) {
  try {
    const ctx = await getAdminContext();
    const input = parseBody(createSchema, await req.json().catch(() => null));
    const admin = getAdminSupabase();

    const { data: store } = await admin.from("stores").select("id").eq("id", input.store_id).is("deleted_at", null).maybeSingle();
    if (!store) throw err("NOT_FOUND", "Site introuvable");
    if (input.hostname === platformHostname() || input.hostname.endsWith(`.${platformHostname()}`)) {
      throw err("VALIDATION", "Ce domaine est réservé aux sous-domaines automatiques Marqova.");
    }

    // hostname unique check
    const { data: clash } = await admin.from("domains").select("id").eq("hostname", input.hostname).maybeSingle();
    if (clash) throw err("CONFLICT", `Domaine ${input.hostname} déjà utilisé.`);

    const token = generateToken(24);

    const { data, error } = await admin
      .from("domains")
      .insert({
        store_id: input.store_id,
        hostname: input.hostname,
        // A domain can only become primary after real DNS verification.
        is_primary: false,
        status: "pending",
        verification_token: token,
        verification_data: { dns_mode: input.dns_mode },
      } as never)
      .select("id, hostname")
      .single();
    if (error) throw error;

    await logAudit({
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
