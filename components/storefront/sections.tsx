/**
 * Storefront section renderers.
 *
 * Each section renders ONLY its validated, structured content (see
 * lib/sections/definitions.ts). There is no raw HTML/JS/CSS injection:
 * text is rendered as text, images as <img>/<Image> with allow-listed
 * sources, links against the safeLink allow-list.
 *
 * Data-driven sections (products, collections, reviews, faq) query the
 * database as the ANON role — exactly what a visitor may see.
 */
import { getAnonSupabase } from "../../lib/supabase/anon";
import { formatDA } from "../../lib/utils";
import type { Section } from "../../lib/sections/definitions";
import type { StorefrontData } from "../../lib/storefront/data";
import { StorefrontImage } from "./image";

export function safeHref(link: string | null | undefined, base: string): string {
  if (!link) return base;
  if (link.startsWith("/")) return link;
  if (link.startsWith("tel:") || link.startsWith("mailto:") || link.startsWith("http")) return link;
  return base;
}

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

function SectionTitle({ section }: { section: { title?: string | null; subtitle?: string | null } }) {
  if (!section.title && !section.subtitle) return null;
  return (
    <div className="mb-8 text-center">
      {section.title ? (
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{section.title}</h2>
      ) : null}
      {section.subtitle ? (
        <p className="mx-auto mt-2 max-w-2xl text-slate-500">{section.subtitle}</p>
      ) : null}
    </div>
  );
}

function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const base =
    variant === "primary"
      ? "bg-[var(--fx-primary)] text-white hover:opacity-90"
      : "border border-[var(--fx-primary)] text-[var(--fx-primary)] hover:bg-[var(--fx-primary)] hover:text-white";
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition ${base} ${className}`}
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Product grid (shared)
// ---------------------------------------------------------------------------

interface ProductLite {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  is_featured: boolean;
  image: string | null;
}

async function fetchProducts(
  storeId: string,
  opts: { category_id?: string | null; featured?: boolean; limit: number },
): Promise<ProductLite[]> {
  const anon = getAnonSupabase();
  let q = anon
    .from("products")
    .select("id, slug, name, price_cents, compare_at_price_cents, is_featured")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(opts.limit);
  if (opts.category_id) q = q.eq("category_id", opts.category_id);
  if (opts.featured) q = q.eq("is_featured", true);
  const { data } = await q;
  if (!data || data.length === 0) return [];
  const ids = data.map((p) => p.id);
  const { data: images } = await anon
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", ids)
    .order("position", { ascending: true });
  const firstImage = new Map<string, string>();
  for (const img of images ?? []) if (!firstImage.has(img.product_id)) firstImage.set(img.product_id, img.url);
  return data.map((p) => ({ ...p, image: firstImage.get(p.id) ?? null }));
}

export function ProductCard({ p, base, orderLabel }: { p: ProductLite; base: string; orderLabel: string }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        {p.image ? (
          <StorefrontImage src={p.image} alt={p.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-300">🛍️</div>
        )}
      </a>
      <div className="flex flex-1 flex-col p-4">
        <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-[var(--fx-primary)]">
          {p.name}
        </a>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-[var(--fx-primary)]">{formatDA(p.price_cents)}</span>
          {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? (
            <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span>
          ) : null}
        </div>
        <a
          href={`${base}/commande?product=${p.id}`}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--fx-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {orderLabel}
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

export async function RenderSection({ data, section }: { data: StorefrontData; section: Section }) {
  const base = `/s/${data.slug}`;
  const s = section;

  switch (s.type) {
    case "hero": {
      return (
        <section className="relative overflow-hidden">
          {s.image ? (
            <div className="relative h-[420px] w-full sm:h-[520px]">
              <StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-slate-900/50" />
            </div>
          ) : null}
          <Container className={s.image ? "absolute inset-0 flex items-center" : "py-20 sm:py-28"}>
            <div className={`max-w-2xl ${s.alignment === "center" ? "mx-auto text-center" : s.alignment === "right" ? "ml-auto" : ""}`}>
              <h1 className={`text-3xl font-extrabold leading-tight sm:text-5xl ${s.image ? "text-white" : "text-slate-900"}`}>
                {s.title}
              </h1>
              {s.subtitle ? (
                <p className={`mt-4 text-base sm:text-lg ${s.image ? "text-white/90" : "text-slate-600"}`}>{s.subtitle}</p>
              ) : null}
              {s.button_text ? (
                <div className={`mt-8 ${s.alignment === "center" ? "text-center" : ""}`}>
                  <Button href={safeHref(s.button_link, base)}>{s.button_text}</Button>
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      );
    }

    case "banner": {
      return (
        <section className="relative overflow-hidden bg-slate-900">
          {s.desktop_image || s.mobile_image ? (
            <>
              <picture>
                {s.mobile_image ? <source media="(max-width: 767px)" srcSet={s.mobile_image} /> : null}
              </picture>
            </>
          ) : null}
          <Container className="relative py-14 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{s.title}</h2>
            {s.subtitle ? <p className="mt-2 text-white/80">{s.subtitle}</p> : null}
            {s.button_text ? (
              <div className="mt-6">
                <Button href={safeHref(s.button_link, base)}>{s.button_text}</Button>
              </div>
            ) : null}
          </Container>
        </section>
      );
    }

    case "collections": {
      const limit = s.max_items ?? 8;
      const products = await fetchProducts(data.id, { category_id: s.category_id, limit });
      if (products.length === 0) return null;
      return (
        <section className="py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} base={base} orderLabel={data.dict.actions.order} />
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "products": {
      const limit = s.product_count ?? 8;
      const featured = s.source === "featured";
      let products = await fetchProducts(data.id, { featured, limit });
      if (featured && products.length === 0) products = await fetchProducts(data.id, { limit });
      if (products.length === 0) return null;
      return (
        <section className="py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} base={base} orderLabel={data.dict.actions.order} />
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "features": {
      if (!s.items || s.items.length === 0) return null;
      return (
        <section className="bg-slate-50 py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  {item.text ? <p className="mt-2 text-sm text-slate-600">{item.text}</p> : null}
                </div>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "how_it_works": {
      if (!s.steps || s.steps.length === 0) return null;
      return (
        <section className="py-14">
          <Container>
            <SectionTitle section={s} />
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.steps.map((step, i) => (
                <li key={i} className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fx-primary)] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  {step.text ? <p className="mt-2 text-sm text-slate-600">{step.text}</p> : null}
                </li>
              ))}
            </ol>
          </Container>
        </section>
      );
    }

    case "social_proof": {
      if (!s.items || s.items.length === 0) return null;
      return (
        <section className="bg-[var(--fx-primary)] py-10">
          <Container className="grid grid-cols-2 gap-6 text-center text-white lg:grid-cols-4">
            {s.items.map((item, i) => (
              <div key={i}>
                <div className="text-3xl font-extrabold">{item.value}</div>
                <div className="mt-1 text-sm text-white/80">{item.label}</div>
              </div>
            ))}
          </Container>
        </section>
      );
    }

    case "reviews": {
      const anon = getAnonSupabase();
      const { data: reviews } = await anon
        .from("reviews")
        .select("customer_name, rating, title, body, created_at")
        .eq("store_id", data.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!reviews || reviews.length === 0) return null;
      return (
        <section className="bg-slate-50 py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <figure key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-amber-500" aria-label={`${r.rating}/5`}>
                    {"★".repeat(Math.max(0, Math.min(5, r.rating)))}
                    <span className="text-slate-200">{"★".repeat(Math.max(0, 5 - r.rating))}</span>
                  </div>
                  <blockquote className="mt-3 text-sm text-slate-700">« {r.body ?? r.title} »</blockquote>
                  <figcaption className="mt-3 text-xs font-semibold text-slate-500">{r.customer_name}</figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "faq": {
      const anon = getAnonSupabase();
      const { data: faqs } = await anon
        .from("faq_items")
        .select("question, answer")
        .eq("store_id", data.id)
        .eq("is_visible", true)
        .order("position", { ascending: true })
        .limit(s.max_items ?? 10);
      if (!faqs || faqs.length === 0) return null;
      return (
        <section className="py-14">
          <Container className="max-w-3xl">
            <SectionTitle section={s} />
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
              {faqs.map((f, i) => (
                <details key={i} className="group px-6 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-slate-900 group-open:text-[var(--fx-primary)]">
                    {f.question}
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{f.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "offer": {
      return (
        <section className="py-14">
          <Container className="max-w-3xl">
            <div className="rounded-2xl border-2 border-[var(--fx-primary)] bg-white p-8 text-center shadow-md">
              <h2 className="text-2xl font-extrabold text-[var(--fx-primary)]">{s.title}</h2>
              {s.subtitle ? <p className="mt-2 font-medium text-slate-700">{s.subtitle}</p> : null}
              {s.text ? <p className="mt-4 text-sm text-slate-600">{s.text}</p> : null}
              <div className="mt-6">
                <Button href={`${base}/commande`}>{data.dict.actions.order}</Button>
              </div>
            </div>
          </Container>
        </section>
      );
    }

    case "gallery": {
      if (!s.images || s.images.length === 0) return null;
      return (
        <section className="py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {s.images.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                  <StorefrontImage src={url!} alt={`${s.title ?? "galerie"} ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "services": {
      if (!s.items || s.items.length === 0) return null;
      return (
        <section className="bg-slate-50 py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {item.image ? (
                    <div className="relative aspect-[16/9] bg-slate-100">
                      <StorefrontImage src={item.image} alt={item.title ?? ""} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    {item.text ? <p className="mt-2 text-sm text-slate-600">{item.text}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "testimonials": {
      if (!s.items || s.items.length === 0) return null;
      return (
        <section className="py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <figure key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <blockquote className="text-sm text-slate-700">« {item.text} »</blockquote>
                  <figcaption className="mt-4">
                    <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                    {item.role ? <div className="text-xs text-slate-500">{item.role}</div> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "stats": {
      if (!s.items || s.items.length === 0) return null;
      return (
        <section className="py-14">
          <Container>
            <SectionTitle section={s} />
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {s.items.map((item, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-6 text-center">
                  <div className="text-3xl font-extrabold text-[var(--fx-primary)]">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "hours": {
      if (!s.days || s.days.length === 0) return null;
      return (
        <section className="py-14">
          <Container className="max-w-xl">
            <SectionTitle section={s} />
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
              {s.days.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="font-medium text-slate-900">{d.day}</span>
                  <span className="text-slate-600">{d.value}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "map": {
      return (
        <section className="py-14">
          <Container className="max-w-xl text-center">
            <SectionTitle section={s} />
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-4xl">📍</div>
              {s.address ? <p className="mt-4 font-semibold text-slate-900">{s.address}</p> : null}
              {s.note ? <p className="mt-2 text-sm text-slate-600">{s.note}</p> : null}
            </div>
          </Container>
        </section>
      );
    }

    case "contact": {
      const c = data.settings?.contact;
      const wa = c?.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : null;
      return (
        <section className="bg-slate-50 py-14">
          <Container className="max-w-2xl">
            <SectionTitle section={s} />
            <div className="flex flex-col items-center gap-4">
              {s.show_phone !== false && c?.phone ? (
                <a href={`tel:${c.phone}`} className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{data.dict.actions.call}</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{c.phone}</div>
                </a>
              ) : null}
              {s.show_whatsapp !== false && wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm hover:border-green-500">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{data.dict.actions.whatsapp}</div>
                  <div className="mt-1 text-lg font-bold text-green-600">{data.dict.actions.whatsapp}</div>
                </a>
              ) : null}
              {s.show_email !== false && c?.email ? (
                <a href={`mailto:${c.email}`} className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{c.email}</div>
                </a>
              ) : null}
              {s.text ? <p className="mt-2 text-center text-sm text-slate-600">{s.text}</p> : null}
            </div>
          </Container>
        </section>
      );
    }

    case "cta": {
      return (
        <section className="py-14">
          <Container className="max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.title}</h2>
            {s.text ? <p className="mt-3 text-slate-600">{s.text}</p> : null}
            {s.button_text ? (
              <div className="mt-8">
                <Button href={safeHref(s.button_link, base)}>{s.button_text}</Button>
              </div>
            ) : null}
          </Container>
        </section>
      );
    }

    case "cod_form": {
      return (
        <section id="commande" className="py-14">
          <Container className="max-w-3xl">
            <div className="rounded-2xl bg-slate-900 p-8 text-center text-white shadow-lg">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{s.title}</h2>
              {s.subtitle ? <p className="mt-2 text-white/80">{s.subtitle}</p> : null}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button href={`${base}/commande`}>{data.dict.actions.order}</Button>
                {data.settings?.contact?.phone ? (
                  <Button href={`tel:${data.settings.contact.phone}`} variant="outline" className="!text-white !border-white/40 hover:!bg-white hover:!text-slate-900">
                    {data.settings.contact.phone}
                  </Button>
                ) : null}
              </div>
              <p className="mt-6 text-xs text-white/60">{data.dict.checkout.codBadge}</p>
            </div>
          </Container>
        </section>
      );
    }

    case "sticky_cta": {
      return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-2">
            <span className="text-xs font-semibold text-slate-700">{s.text}</span>
            <a
              href={`${base}/commande`}
              className="shrink-0 rounded-lg bg-[var(--fx-primary)] px-5 py-2.5 text-sm font-bold text-white"
            >
              {s.button_text}
            </a>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
