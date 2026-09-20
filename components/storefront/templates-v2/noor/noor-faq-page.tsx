import type { StorefrontData } from "@/lib/storefront/data";
import { loadSouqFaq } from "@/lib/storefront/souq/catalog";
import { noorCopy } from "@/lib/storefront/noor/copy";
import { NoorContainer, NoorHeading, NoorIcon } from "./noor-ui";

export async function NoorFaqPage({ data }: { data: StorefrontData }) {
  const copy = noorCopy(data.lang);
  const faqs = await loadSouqFaq(data.id, 20);
  return (
    <NoorContainer className="max-w-3xl py-10 sm:py-16">
      <NoorHeading eyebrow="قبل الطلب" title={copy.sections.faqTitle} subtitle={copy.sections.faqSubtitle} />
      {faqs.length ? (
        <div className="border-t border-[var(--noor-border)]">
          {faqs.map((faq) => (
            <details key={faq.id} className="noor-faq border-b border-[var(--noor-border)]">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold">
                <span>{faq.question}</span>
                <NoorIcon name="plus" className="noor-faq-icon h-4 w-4" />
              </summary>
              <p className="pb-5 text-sm leading-7 text-[var(--noor-muted)]">{faq.answer}</p>
            </details>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--noor-muted)]">{copy.sections.noFaq}</p>
      )}
    </NoorContainer>
  );
}
