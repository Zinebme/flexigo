import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqFaq } from "@/lib/storefront/souq/catalog";
import { lamsaCopy } from "@/lib/storefront/lamsa/copy";
import { LamsaContainer, LamsaHeading, LamsaIcon } from "./lamsa-ui";

export async function LamsaFaqPage({ data }: { data: StorefrontData }) {
  const copy = lamsaCopy(data.lang);
  const faqs = await loadSouqFaq(data.id, 20);
  return <LamsaContainer className="max-w-3xl py-10 sm:py-16"><LamsaHeading eyebrow="قبل الطلب" title={copy.sections.faqTitle} subtitle={copy.sections.faqSubtitle} />{faqs.length ? <div className="border-t border-[var(--lamsa-border)]">{faqs.map((faq) => <details key={faq.id} className="lamsa-faq border-b border-[var(--lamsa-border)]"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold"><span>{faq.question}</span><LamsaIcon name="plus" className="lamsa-faq-icon h-4 w-4" /></summary><p className="pb-5 text-sm leading-7 text-[var(--lamsa-muted)]">{faq.answer}</p></details>)}</div> : <p className="text-sm text-[var(--lamsa-muted)]">{copy.sections.noFaq}</p>}</LamsaContainer>;
}
