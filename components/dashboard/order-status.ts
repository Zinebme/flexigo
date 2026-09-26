import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

export const ORDER_STATUS_TONE: Record<string, string> = {
  new: "blue", to_confirm: "amber", confirmed: "blue",
  preparation: "purple", shipped: "purple", in_transit: "purple",
  at_office: "amber", out_for_delivery: "amber", delivered: "green",
  returned: "red", delivery_failed: "red", no_answer: "gray",
  postponed: "gray", cancelled_customer: "red", cancelled_store: "red",
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function orderStatusTone(status: string) {
  return ORDER_STATUS_TONE[status] ?? "gray";
}

export function orderStatusSelectTone(status: string) {
  const tone = orderStatusTone(status);
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "purple") return "border-violet-200 bg-violet-50 text-violet-800";
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}
