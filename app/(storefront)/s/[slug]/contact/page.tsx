import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontData } from "../../../../../lib/storefront/data";
import { ContactForm } from "../../../../../components/storefront/contact-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  return { title: data ? `${data.name} — Contact` : "Contact" };
}

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();
  const c = data.settings?.contact;

  const direct = [
    c?.phone ? { icon: "📞", label: data.dict.actions.call, value: c.phone, href: `tel:${c.phone}` } : null,
    c?.whatsapp
      ? { icon: "💬", label: data.dict.actions.whatsapp, value: c.whatsapp, href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` }
      : null,
    c?.email ? { icon: "✉️", label: "Email", value: c.email, href: `mailto:${c.email}` } : null,
  ].filter(Boolean) as Array<{ icon: string; label: string; value: string; href: string }>;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">{data.dict.contact.title}</h1>
      <p className="mt-2 text-slate-500">{data.dict.contact.subtitle}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {direct.map((d, i) => (
            <a
              key={i}
              href={d.href}
              target={d.href.startsWith("http") ? "_blank" : undefined}
              rel={d.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[var(--fx-primary)]"
            >
              <span className="text-2xl">{d.icon}</span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">{d.label}</span>
                <span className="block font-bold text-slate-900">{d.value}</span>
              </span>
            </a>
          ))}
          {c?.address ? (
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-2xl">📍</span>
              <span className="font-semibold text-slate-900">{c.address}</span>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ContactForm phone={c?.phone ?? null} email={c?.email ?? null} storeName={data.name} dict={data.dict} />
        </div>
      </div>
    </div>
  );
}
