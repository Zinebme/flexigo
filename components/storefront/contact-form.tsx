"use client";

import { useState } from "react";
import type { StorefrontDict } from "../../lib/i18n/dictionaries";

/**
 * Contact form for the storefront. For the Algerian COD market, WhatsApp is
 * the primary channel: the form composes a pre-filled WhatsApp (or email)
 * message. No hidden inbox — the merchant receives the message on their own
 * number/address, which is the working, honest mechanism.
 */
export function ContactForm({
  phone,
  email,
  storeName,
  dict,
}: {
  phone: string | null;
  email: string | null;
  storeName: string;
  dict: StorefrontDict;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  function compose() {
    const text = encodeURIComponent(`Bonjour ${storeName},\n\n${message}\n\n— ${name}`);
    if (phone && /^[\d+\s()-]+$/.test(phone)) {
      window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`, "_blank", "noopener");
    } else if (email) {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Contact — ${storeName}`)}&body=${text}`;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-3xl">✅</div>
        <div className="mt-2 font-bold text-emerald-800">{dict.contact.sent}</div>
        <p className="mt-1 text-sm text-emerald-700">{dict.contact.sentText}</p>
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--fx-primary)]";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        compose();
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{dict.contact.name}</label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{dict.contact.message}</label>
        <textarea
          className={`${input} min-h-28 resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={dict.contact.placeholderMessage}
          required
          maxLength={1000}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-[var(--fx-primary)] px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
      >
        {dict.contact.send}
      </button>
    </form>
  );
}
