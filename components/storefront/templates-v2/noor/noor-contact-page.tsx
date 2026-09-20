import type { StorefrontData } from "@/lib/storefront/data";
import { NoorContactForm } from "./noor-contact-form";
import { NoorContainer, NoorHeading, NoorIcon } from "./noor-ui";

export function NoorContactPage({ data }: { data: StorefrontData }) {
  const contact = data.settings?.contact;
  const phone = contact?.phone && /^[\d+\s()-]+$/.test(contact.phone) ? contact.phone : null;
  const whatsapp = contact?.whatsapp ? contact.whatsapp.replace(/\D/g, "") : null;
  const email = contact?.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email) ? contact.email : null;
  const methods = [
    phone ? { label: data.dict.actions.call, value: phone, href: `tel:${phone}`, icon: "phone" as const } : null,
    whatsapp ? { label: data.dict.actions.whatsapp, value: contact?.whatsapp ?? "", href: `https://wa.me/${whatsapp}`, icon: "whatsapp" as const } : null,
    email ? { label: "البريد الإلكتروني", value: email, href: `mailto:${email}`, icon: "headset" as const } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string; icon: "phone" | "whatsapp" | "headset" }>;

  return (
    <main>
      <section className="border-b border-[var(--noor-border)] bg-[var(--noor-blush)]/55 py-14 sm:py-20">
        <NoorContainer className="text-center">
          <p className="noor-eyebrow">نحن هنا للمساعدة</p>
          <h1 className="noor-display text-3xl text-[var(--noor-plum)] sm:text-5xl">{data.dict.contact.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--noor-muted)]">{data.dict.contact.subtitle}</p>
        </NoorContainer>
      </section>
      <section className="noor-section">
        <NoorContainer className="grid gap-9 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <NoorHeading title="اختاري طريقة التواصل" subtitle="استخدمي بيانات التواصل التي وفّرها المتجر، أو أرسلي رسالتك مباشرة." />
            {methods.length ? (
              <ul className="divide-y divide-[var(--noor-border)] border-y border-[var(--noor-border)]">
                {methods.map((method) => (
                  <li key={method.href}>
                    <a href={method.href} target={method.href.startsWith("http") ? "_blank" : undefined} rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined} className="group flex min-h-19 items-center gap-4 py-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--noor-blush)] text-[var(--noor-plum)] transition group-hover:bg-[var(--noor-plum)] group-hover:text-white"><NoorIcon name={method.icon} className="h-4.5 w-4.5" /></span>
                      <span className="min-w-0"><span className="block text-[11px] font-semibold text-[var(--noor-muted)]">{method.label}</span><span className="mt-1 block break-all text-sm font-semibold text-[var(--noor-ink)]" dir="ltr">{method.value}</span></span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-y border-[var(--noor-border)] py-5 text-sm text-[var(--noor-muted)]">ستظهر بيانات التواصل هنا بعد إضافتها من إعدادات المتجر.</p>
            )}
            {contact?.address ? <div className="mt-5 flex items-start gap-3 text-sm leading-7 text-[var(--noor-muted)]"><NoorIcon name="office" className="mt-1 h-4 w-4 shrink-0 text-[var(--noor-rose-deep)]" /><span>{contact.address}</span></div> : null}
          </div>
          <div className="rounded-[var(--noor-radius-card)] border border-[var(--noor-border)] bg-[var(--noor-white)] p-5 shadow-[var(--noor-shadow-soft)] sm:p-8">
            <NoorHeading title="أرسلي رسالة" subtitle="سيتم فتح واتساب أو بريدك لإرسال الرسالة إلى المتجر." />
            <NoorContactForm phone={whatsapp ?? phone} email={email} storeName={data.name} dict={data.dict} />
          </div>
        </NoorContainer>
      </section>
    </main>
  );
}
