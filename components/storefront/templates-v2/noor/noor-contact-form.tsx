"use client";

import { useState } from "react";
import type { StorefrontDict } from "@/lib/i18n/dictionaries";
import { NoorIcon } from "./noor-ui";

export function NoorContactForm({ phone, email, storeName, dict }: { phone: string | null; email: string | null; storeName: string; dict: StorefrontDict }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const safePhone = phone && /^[\d+\s()-]+$/.test(phone) ? phone.replace(/\D/g, "") : null;
  const safeEmail = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
  const hasDestination = Boolean(safePhone || safeEmail);

  function compose() {
    if (!hasDestination) return;
    const text = encodeURIComponent(`مرحباً ${storeName}،\n\n${message}\n\n— ${name}`);
    if (safePhone) window.open(`https://wa.me/${safePhone}?text=${text}`, "_blank", "noopener,noreferrer");
    else if (safeEmail) window.location.href = `mailto:${safeEmail}?subject=${encodeURIComponent(`تواصل — ${storeName}`)}&body=${text}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[var(--noor-radius-card)] border border-[var(--noor-sage)]/35 bg-[var(--noor-blush)] p-7 text-center" role="status">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--noor-plum)] text-white"><NoorIcon name="check" className="h-5 w-5" /></span>
        <p className="mt-4 font-semibold text-[var(--noor-ink)]">{dict.contact.sent}</p>
        <p className="mt-1 text-sm text-[var(--noor-muted)]">{dict.contact.sentText}</p>
      </div>
    );
  }

  const fieldClass = "min-h-12 w-full rounded-[var(--noor-radius-control)] border border-[var(--noor-border)] bg-white px-4 text-sm text-[var(--noor-ink)] outline-none transition placeholder:text-[var(--noor-muted)] focus:border-[var(--noor-rose)] focus:ring-2 focus:ring-[var(--noor-rose)]/15";
  return (
    <form onSubmit={(event) => { event.preventDefault(); compose(); }} className="space-y-5">
      <div>
        <label htmlFor="noor-contact-name" className="mb-2 block text-xs font-semibold text-[var(--noor-ink)]">{dict.contact.name}</label>
        <input id="noor-contact-name" className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="noor-contact-message" className="mb-2 block text-xs font-semibold text-[var(--noor-ink)]">{dict.contact.message}</label>
        <textarea id="noor-contact-message" className={`${fieldClass} min-h-32 resize-y py-3`} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={dict.contact.placeholderMessage} required maxLength={1000} />
      </div>
      <button type="submit" disabled={!hasDestination} className="noor-primary-button w-full disabled:cursor-not-allowed disabled:opacity-45">{dict.contact.send}<NoorIcon name="arrow-left" className="h-4 w-4 ltr:rotate-180" /></button>
    </form>
  );
}
