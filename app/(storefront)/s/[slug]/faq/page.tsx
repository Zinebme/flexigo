import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnonSupabase } from "../../../../../lib/supabase/anon";
import { getStorefrontData } from "../../../../../lib/storefront/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  return { title: data ? `${data.name} — FAQ` : "FAQ" };
}

export default async function FaqPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();

  const anon = getAnonSupabase();
  const { data: faqs } = await anon
    .from("faq_items")
    .select("question, answer")
    .eq("store_id", data.id)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">{data.dict.faq.title}</h1>
      {!faqs || faqs.length === 0 ? (
        <p className="mt-8 text-slate-500">{data.dict.faq.empty}</p>
      ) : (
        <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
          {faqs.map((f, i) => (
            <details key={i} className="group px-6 py-4">
              <summary className="cursor-pointer list-none font-semibold text-slate-900 group-open:text-[var(--fx-primary)]">
                {f.question}
              </summary>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{f.answer}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
