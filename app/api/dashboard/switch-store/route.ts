import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, STORE_COOKIE } from "@/lib/auth/merchant-context";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Switch the active store (store switcher in the top bar).
 * The user must hold a non-revoked membership of the target store — the
 * cookie is never trusted, the database is the source of truth.
 * Forbidden during support impersonation (the session's store is fixed).
 */
export async function POST(req: Request) {
  try {
    const ctx = await getMerchantContext();
    if (ctx.mode === "support") {
      throw err("FORBIDDEN", "Le changement de site est désactivé en mode assistance.");
    }

    const body = z.object({ store_id: z.string().uuid() }).parse(await req.json().catch(() => null));

    const membership = ctx.memberships.find((m) => m.store_id === body.store_id);
    if (!membership) {
      throw err("FORBIDDEN", "Vous n'avez pas accès à ce site.");
    }

    const res = NextResponse.json({ ok: true, store_id: body.store_id });
    res.cookies.set(STORE_COOKIE, body.store_id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    return toErrorResponse(e);
  }
}
