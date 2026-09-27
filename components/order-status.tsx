import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui";

/**
 * Single source of truth for order status presentation.
 * Previously the same tone map was copy-pasted in the merchant overview, the
 * order list, the order detail and the platform admin list — now every screen
 * colours a status identically. Pure presentation: no data, no business rules.
 */

export const ORDER_STATUS_TONE: Record<string, string> = {
  new: "blue",
  to_confirm: "amber",
  confirmed: "indigo",
  postponed: "gray",
  no_answer: "gray",
  cancelled_customer: "red",
  preparation: "purple",
  shipped: "violet",
  in_transit: "violet",
  at_office: "amber",
  out_for_delivery: "amber",
  delivered: "green",
  returned: "red",
  delivery_failed: "red",
  cancelled_store: "red",
};

/** Stage used to group statuses in filters / quick-pickers. */
export type OrderStage = "todo" | "delivery" | "done" | "problem";

export const ORDER_STATUS_STAGE: Record<string, OrderStage> = {
  new: "todo",
  to_confirm: "todo",
  confirmed: "todo",
  postponed: "todo",
  no_answer: "problem",
  preparation: "todo",
  shipped: "delivery",
  in_transit: "delivery",
  at_office: "delivery",
  out_for_delivery: "delivery",
  delivered: "done",
  returned: "problem",
  delivery_failed: "problem",
  cancelled_customer: "problem",
  cancelled_store: "problem",
};

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  todo: "À traiter",
  delivery: "Livraison",
  done: "Terminé",
  problem: "Incidents / annulations",
};

/** Short label for tight spaces (tabs, badges on mobile). */
export const ORDER_STATUS_SHORT: Record<string, string> = {
  new: "Nouveau",
  to_confirm: "À confirmer",
  confirmed: "Confirmé",
  postponed: "Reporté",
  no_answer: "Ne répond pas",
  cancelled_customer: "Annulé (client)",
  preparation: "Préparation",
  shipped: "Expédié",
  in_transit: "En transit",
  at_office: "Au bureau",
  out_for_delivery: "En livraison",
  delivered: "Livré",
  returned: "Retour",
  delivery_failed: "Échec livraison",
  cancelled_store: "Annulé (boutique)",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function orderStatusTone(status: string): string {
  return ORDER_STATUS_TONE[status] ?? "gray";
}

export function OrderStatusBadge({
  status,
  size = "md",
  short = false,
  className,
}: {
  status: string;
  size?: "sm" | "md";
  short?: boolean;
  className?: string;
}) {
  return (
    <Badge tone={orderStatusTone(status)} dot size={size} className={className} title={orderStatusLabel(status)}>
      {short ? (ORDER_STATUS_SHORT[status] ?? orderStatusLabel(status)) : orderStatusLabel(status)}
    </Badge>
  );
}

/** Solid dot colour per tone (static classes so Tailwind can see them). */
export const STATUS_DOT_CLASS: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  amber: "bg-amber-400",
  green: "bg-emerald-500",
  red: "bg-red-500",
  gray: "bg-slate-400",
};

export function statusDotClass(status: string): string {
  return STATUS_DOT_CLASS[orderStatusTone(status)] ?? "bg-slate-400";
}
