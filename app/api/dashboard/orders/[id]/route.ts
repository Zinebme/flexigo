import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantContext, requireCapability } from "@/lib/auth/merchant-context";
import { roleLabelFr } from "@/lib/auth/merchant-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { err, toErrorResponse } from "@/lib/errors";
import { ORDER_STATUSES } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { normalizeDZPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((b) => b.status || b.note, { message: "Rien à enregistrer" });

/**
 * Change an order's status and/or append an internal note.
 * Capability: orders.manage (OWNER, MANAGER, ORDER_MANAGER).
 * Every change is written to order_status_history + audit_logs.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "orders.manage");

    const body = bodySchema.parse(await req.json().catch(() => null));

    const admin = getAdminSupabase();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("store_id", ctx.store.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) throw err("NOT_FOUND", "Commande introuvable");

    const now = new Date().toISOString();
    let statusChanged = false;
    let fromStatus: OrderStatus | null = null;

    if (body.status && body.status !== (order.status as OrderStatus)) {
      fromStatus = order.status as OrderStatus;
      const { error: updateError } = await admin
        .from("orders")
        .update({ status: body.status, updated_at: now })
        .eq("id", order.id);
      if (updateError) throw updateError;

      const { error: histError } = await admin.from("order_status_history").insert({
        order_id: order.id,
        from_status: fromStatus,
        to_status: body.status,
        actor_user_id: ctx.user.id,
        note: body.note ?? null,
      });
      if (histError) throw histError;

      void logAudit({
        actorId: ctx.user.id,
        storeId: ctx.store.id,
        action: "order.status_changed",
        entity: "order",
        entityId: order.id,
        supportSessionId: ctx.supportSession?.id ?? null,
        metadata: { order_number: order.order_number, from: fromStatus, to: body.status },
      });
      statusChanged = true;
    }

    if (body.note) {
      const entry = `[${now.slice(0, 16).replace("T", " ")}] ${roleLabelFr(ctx.role)} : ${body.note}`;
      const nextNotes = order.internal_notes ? `${order.internal_notes}\n${entry}` : entry;
      const { error: noteError } = await admin
        .from("orders")
        .update({ internal_notes: nextNotes, updated_at: now })
        .eq("id", order.id);
      if (noteError) throw noteError;

      void logAudit({
        actorId: ctx.user.id,
        storeId: ctx.store.id,
        action: "order.note",
        entity: "order",
        entityId: order.id,
        supportSessionId: ctx.supportSession?.id ?? null,
        metadata: { order_number: order.order_number },
      });
    }

    return NextResponse.json({ ok: true, status: statusChanged && body.status ? body.status : order.status });
  } catch (e) {
    return toErrorResponse(e);
  }
}

const editSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24).regex(/^[+\d\s().-]+$/),
  commune: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).nullable(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(2000).optional(),
});

/** Edit contact/delivery details without changing priced destination or historical line items. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getMerchantContext();
    requireCapability(ctx, "orders.manage");
    const body = editSchema.parse(await req.json());
    const normalizedPhone = normalizeDZPhone(body.phone);
    if (!normalizedPhone) throw err("VALIDATION", "Saisissez un numéro algérien valide.");
    const admin = getAdminSupabase();
    const { data: order, error: readError } = await admin.from("orders").select("*").eq("id", id).eq("store_id", ctx.store.id).maybeSingle();
    if (readError) throw readError;
    if (!order) throw err("NOT_FOUND", "Commande introuvable");
    const now = new Date().toISOString();
    const entry = body.note ? `[${now.slice(0, 16).replace("T", " ")}] ${roleLabelFr(ctx.role)} : ${body.note}` : null;
    const { error: updateError } = await admin.from("orders").update({
      full_name: body.full_name,
      phone: body.phone,
      normalized_phone: normalizedPhone,
      commune: body.commune,
      address: order.delivery_type === "home" ? body.address : order.address,
      status: body.status,
      ...(entry ? { internal_notes: order.internal_notes ? `${order.internal_notes}\n${entry}` : entry } : {}),
      updated_at: now,
    }).eq("id", id).eq("store_id", ctx.store.id);
    if (updateError) throw updateError;
    if (body.status !== order.status) {
      const { error: historyError } = await admin.from("order_status_history").insert({
        order_id: id, from_status: order.status, to_status: body.status, actor_user_id: ctx.user.id, note: body.note || null,
      });
      if (historyError) throw historyError;
    }
    void logAudit({ actorId: ctx.user.id, storeId: ctx.store.id, action: "order.edited", entity: "order", entityId: id,
      supportSessionId: ctx.supportSession?.id ?? null, metadata: { order_number: order.order_number, status: body.status } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
