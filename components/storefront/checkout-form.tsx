"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WILAYAS } from "../../lib/algeria/wilayas";
import { getCommunes } from "../../lib/algeria/communes";
import { formatDA } from "../../lib/utils";
import type { StorefrontDict } from "../../lib/i18n/dictionaries";

export interface CheckoutLineInput {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product_name: string;
  variant_name: string | null;
  unit_price_cents: number;
  line_total_cents: number;
  offer_label: string | null;
}

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; orderNumber: string; totalCents: number };

/**
 * COD checkout form.
 * The browser sends ONLY identifiers + contact data. Prices/totals are
 * recomputed server-side (fn_place_cod_order) — never trusted from the form.
 * Anti-spam: honeypot field + server rate limiting + duplicate detection.
 */
export function CheckoutForm({
  storeSlug,
  line,
  dict,
}: {
  storeSlug: string;
  line: CheckoutLineInput;
  currency: string;
  dict: StorefrontDict;
  whatsapp: string | null;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [wilayaCode, setWilayaCode] = useState(16);
  const [commune, setCommune] = useState("");
  const [otherCommune, setOtherCommune] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "office">("home");
  const [office, setOffice] = useState("");
  // Honeypot — humans never see or fill this.
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const communes = useMemo(() => getCommunes(wilayaCode), [wilayaCode]);
  const finalCommune = commune === "__other__" ? otherCommune : commune;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.status === "loading") return;
    if (fullName.trim().length < 3) {
      setState({ status: "error", message: dict.checkout.fullName + " : 3 caractères minimum." });
      return;
    }
    if (!/^[\d+\s().-]{8,20}$/.test(phone.trim())) {
      setState({ status: "error", message: dict.checkout.phone + " invalide." });
      return;
    }
    if (finalCommune.trim().length < 2) {
      setState({ status: "error", message: dict.checkout.commune + " requise." });
      return;
    }
    if (deliveryType === "office" && office.trim().length < 2) {
      setState({ status: "error", message: dict.checkout.office + " requis." });
      return;
    }

    setState({ status: "loading" });
    try {
      const url = new URL(window.location.href);
      const body = {
        store_slug: storeSlug,
        lines: [
          {
            product_id: line.product_id,
            variant_id: line.variant_id,
            quantity: line.quantity,
          },
        ],
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        wilaya_code: wilayaCode,
        commune: finalCommune.trim(),
        address: deliveryType === "home" ? address.trim() || null : null,
        delivery_type: deliveryType,
        office: deliveryType === "office" ? office.trim() : null,
        utm_source: url.searchParams.get("utm_source"),
        utm_medium: url.searchParams.get("utm_medium"),
        utm_campaign: url.searchParams.get("utm_campaign"),
        referrer: document.referrer || null,
        website,
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; order_number?: string; total_cents?: number }
        | null;
      if (!res.ok || !json?.ok) {
        setState({ status: "error", message: json?.error ?? "Une erreur est survenue. Réessayez." });
        return;
      }
      setState({ status: "success", orderNumber: json.order_number ?? "", totalCents: json.total_cents ?? 0 });
    } catch {
      setState({ status: "error", message: "Erreur réseau. Vérifiez votre connexion et réessayez." });
    }
  }

  if (state.status === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-4 text-2xl font-extrabold text-emerald-800">{dict.success.title}</h2>
        <p className="mt-2 text-emerald-700">{dict.success.text}</p>
        <div className="mx-auto mt-6 inline-block rounded-xl bg-white px-6 py-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">{dict.success.orderNumber}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{state.orderNumber}</div>
          <div className="mt-1 text-sm font-bold text-[var(--fx-primary)]">{formatDA(state.totalCents)}</div>
        </div>
        <p className="mt-4 text-sm text-emerald-700">{dict.success.note}</p>
        <Link
          href={`/s/${storeSlug}/boutique`}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          {dict.success.continue}
        </Link>
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--fx-primary)] focus:ring-2 focus:ring-[var(--fx-primary)]/20";
  const label = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Honeypot */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label htmlFor="checkout-website">Ne pas remplir</label>
        <input id="checkout-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div>
        <label className={label} htmlFor="co-name">{dict.checkout.fullName} *</label>
        <input id="co-name" className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required minLength={3} maxLength={80} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="co-phone">{dict.checkout.phone} *</label>
          <input id="co-phone" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="0550 12 34 56" required />
        </div>
        <div>
          <label className={label} htmlFor="co-email">{dict.checkout.emailOptional}</label>
          <input id="co-email" className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="co-wilaya">{dict.checkout.wilaya} *</label>
          <select id="co-wilaya" className={input} value={wilayaCode} onChange={(e) => { setWilayaCode(Number(e.target.value)); setCommune(""); }}>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="co-commune">{dict.checkout.commune} *</label>
          <select id="co-commune" className={input} value={commune} onChange={(e) => setCommune(e.target.value)}>
            <option value="">—</option>
            {communes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__other__">{dict.checkout.otherCommune}…</option>
          </select>
          {commune === "__other__" ? (
            <input
              className={`${input} mt-2`}
              value={otherCommune}
              onChange={(e) => setOtherCommune(e.target.value)}
              placeholder={dict.checkout.otherCommune}
              required
              maxLength={80}
            />
          ) : null}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="co-address">
          {deliveryType === "home" ? dict.checkout.address : dict.checkout.addressOptional}
        </label>
        <input id="co-address" className={input} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" maxLength={200} />
      </div>

      <div>
        <span className={label}>{dict.checkout.deliveryType}</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryType("home")}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${deliveryType === "home" ? "border-[var(--fx-primary)] bg-[var(--fx-primary)]/5 text-[var(--fx-primary)]" : "border-slate-200 text-slate-600"}`}
          >
            🏠 {dict.checkout.homeDelivery}
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType("office")}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${deliveryType === "office" ? "border-[var(--fx-primary)] bg-[var(--fx-primary)]/5 text-[var(--fx-primary)]" : "border-slate-200 text-slate-600"}`}
          >
            🏢 {dict.checkout.officeDelivery}
          </button>
        </div>
        {deliveryType === "office" ? (
          <input
            className={`${input} mt-3`}
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            placeholder={dict.checkout.officePlaceholder}
            required
            maxLength={120}
          />
        ) : null}
      </div>

      {state.status === "error" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={state.status === "loading"}
        className="w-full rounded-xl bg-[var(--fx-primary)] px-6 py-4 text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.status === "loading" ? "Enregistrement…" : `${dict.checkout.placeOrder} — ${formatDA(line.line_total_cents)}`}
      </button>
      <p className="text-center text-xs text-slate-400">
        🔒 {dict.checkout.codBadge} — {dict.checkout.secureNote}
      </p>
    </form>
  );
}
