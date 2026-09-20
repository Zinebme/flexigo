import type { StorefrontData } from "@/lib/storefront/data";
import { LamsaContactForm } from "./lamsa-contact-form";
import { LamsaContainer, LamsaHeading, LamsaIcon } from "./lamsa-ui";

export function LamsaContactPage({ data }: { data: StorefrontData }) {
  const contact = data.settings?.contact;
  const phone = contact?.phone && /^[\d+\s()-]+$/.test(contact.phone) ? contact.phone : null;
  const whatsapp = contact?.whatsapp ? contact.whatsapp.replace(/\D/g, "") : null;
  const email = contact?.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email) ? contact.email : null;
  const methods = [
    phone ? { label: data.dict.actions.call, value: phone, href: `tel:${phone}`, icon: "phone" as const, ltr: true } : null,
    whatsapp ? { label: data.dict.actions.whatsapp, value: contact?.whatsapp ?? "", href: `https://wa.me/${whatsapp}`, icon: "whatsapp" as const, ltr: true } : null,
    email ? { label: "البريد الإلكتروني", value: email, href: `mailto:${email}`, icon: "headset" as const, ltr: true } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string; icon: "phone" | "whatsapp" | "headset"; ltr: boolean }>;

  return (
    <main>
      <section className="border-b border-[var(--lamsa-border)] bg-[var(--lamsa-beige)]/55 py-14 sm:py-20">
        <LamsaContainer className="text-center">
          <p className="lamsa-eyebrow">نحن هنا للمساعدة</p>
          <h1 className="lamsa-display text-3xl text-[var(--lamsa-ink)] sm:text-5xl">{data.dict.contact.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--lamsa-muted)]">{data.dict.contact.subtitle}</p>
        </LamsaContainer>
      </section>
      <section className="lamsa-section">
        <LamsaContainer className="grid gap-9 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <LamsaHeading title="اختاري طريقة التواصل" subtitle="استخدمي بيانات التواصل التي وفّرها المتجر، أو أرسلي رسالتك مباشرة." />
            {methods.length ? (
              <ul className="divide-y divide-[var(--lamsa-border)] border-y border-[var(--lamsa-border)]">
                {methods.map((method) => (
                  <li key={method.href}>
                    <a href={method.href} target={method.href.startsWith("http") ? "_blank" : undefined} rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined} className="group flex min-h-19 items-center gap-4 py-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--lamsa-beige)] text-[var(--lamsa-chocolate)] transition group-hover:bg-[var(--lamsa-chocolate)] group-hover:text-white"><LamsaIcon name={method.icon} className="h-4.5 w-4.5" /></span>
                      <span className="min-w-0"><span className="block text-[11px] font-semibold text-[var(--lamsa-taupe)]">{method.label}</span><span className="mt-1 block break-all text-sm font-semibold text-[var(--lamsa-ink)]" dir={method.ltr ? "ltr" : undefined}>{method.value}</span></span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : <p className="border-y border-[var(--lamsa-border)] py-5 text-sm text-[var(--lamsa-muted)]">ستظهر بيانات التواصل هنا بعد إضافتها من إعدادات المتجر.</p>}
            {contact?.address ? <div className="mt-5 flex items-start gap-3 text-sm leading-7 text-[var(--lamsa-muted)]"><LamsaIcon name="office" className="mt-1 h-4 w-4 shrink-0 text-[var(--lamsa-gold)]" /><span>{contact.address}</span></div> : null}
          </div>
          <div className="border border-[var(--lamsa-border)] bg-[var(--lamsa-white)] p-5 shadow-[var(--lamsa-shadow-soft)] sm:p-8">
            <LamsaHeading title="أرسلي رسالة" subtitle="سيتم فتح واتساب أو بريدك لإرسال الرسالة إلى المتجر." />
            <LamsaContactForm phone={whatsapp ?? phone} email={email} storeName={data.name} dict={data.dict} />
          </div>
        </LamsaContainer>
      </section>
    </main>
  );
}
