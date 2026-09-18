/**
 * Storefront section renderers — 4 visually distinct templates.
 *
 * Each section renders ONLY validated structured content (no raw HTML/JS/CSS).
 * Templates are distinguished by:
 * - Ecommerce Modern: clean modern, rounded, blue primary, left hero
 * - Fashion Luxury: elegant serif, sharp corners, stone background, centered hero
 * - Single Product COD: bold, pill buttons, red primary, conversion-focused
 * - Portfolio Professional: minimal, teal primary, services/gallery/testimonials
 *
 * Data-driven sections query as ANON role.
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

function SectionTitle({ section, tpl }: { section: { title?: string | null; subtitle?: string | null }; tpl: string }) {
  if (!section.title && !section.subtitle) return null;
  const isFashion = tpl === "fashion-luxury";
  const isSingle = tpl === "single-product";
  const isPortfolio = tpl === "portfolio";
  return (
    <div className={`mb-8 ${isFashion ? "text-center" : isPortfolio ? "text-left" : "text-center"}`}>
      {section.title ? (
        <h2
          className={`text-2xl sm:text-3xl ${isFashion ? "font-serif font-light tracking-wide text-stone-900" : isSingle ? "font-black uppercase tracking-tight text-slate-900" : isPortfolio ? "font-bold text-teal-900" : "font-bold text-slate-900"}`}
        >
          {section.title}
        </h2>
      ) : null}
      {section.subtitle ? (
        <p className={`mx-auto mt-2 max-w-2xl ${isFashion ? "font-serif text-stone-500" : "text-slate-500"} ${isPortfolio ? "mx-0" : ""}`}>{section.subtitle}</p>
      ) : null}
      {isFashion && <div className="mx-auto mt-4 h-px w-12 bg-amber-600/50" />}
    </div>
  );
}

function Button({
  href,
  children,
  variant = "primary",
  tpl,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  tpl: string;
  className?: string;
}) {
  const isFashion = tpl === "fashion-luxury";
  const isSingle = tpl === "single-product";
  const isPortfolio = tpl === "portfolio";
  const shape = isFashion ? "rounded-none" : isSingle ? "rounded-full" : isPortfolio ? "rounded-lg" : "rounded-lg";
  const base =
    variant === "primary"
      ? `bg-[var(--fx-primary)] text-white hover:opacity-90 ${isSingle ? "px-8 py-4 text-base font-black uppercase tracking-wide shadow-lg" : "px-6 py-3 text-sm font-semibold"}`
      : `border border-[var(--fx-primary)] text-[var(--fx-primary)] hover:bg-[var(--fx-primary)] hover:text-white ${isSingle ? "rounded-full" : ""}`;
  return (
    <a href={href} className={`inline-flex items-center justify-center transition ${shape} ${base} ${className}`}>
      {children}
    </a>
  );
}

// Product fetch
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

export function ProductCard({ p, base, orderLabel, tpl }: { p: ProductLite; base: string; orderLabel: string; tpl: string }) {
  const isFashion = tpl === "fashion-luxury";
  const isSingle = tpl === "single-product";
  const isPortfolio = tpl === "portfolio";
  if (isPortfolio) return null; // portfolio doesn't use product cards
  return (
    <div
      className={`group flex flex-col overflow-hidden bg-white shadow-sm transition hover:shadow-md ${isFashion ? "rounded-none border border-stone-200" : isSingle ? "rounded-2xl border-2 border-slate-100" : "rounded-xl border border-slate-200"}`}
    >
      <a href={`${base}/produit/${p.slug}`} className={`relative block overflow-hidden bg-slate-100 ${isFashion ? "aspect-[3/4]" : "aspect-square"}`}>
        {p.image ? (
          <StorefrontImage src={p.image} alt={p.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-300">🛍️</div>
        )}
        {isFashion && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3 text-white text-xs font-medium opacity-0 transition group-hover:opacity-100">Voir détail</div>}
      </a>
      <div className="flex flex-1 flex-col p-4">
        <a href={`${base}/produit/${p.slug}`} className={`line-clamp-2 text-sm hover:text-[var(--fx-primary)] ${isFashion ? "font-serif text-stone-800" : isSingle ? "font-black uppercase text-slate-900" : "font-semibold text-slate-900"}`}>
          {p.name}
        </a>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-lg ${isFashion ? "font-serif text-stone-900" : isSingle ? "font-black text-red-600" : "font-bold text-[var(--fx-primary)]"}`}>{formatDA(p.price_cents)}</span>
          {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? (
            <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span>
          ) : null}
        </div>
        <a
          href={`${base}/commande?product=${p.id}`}
          className={`mt-4 inline-flex items-center justify-center text-sm font-semibold text-white transition hover:opacity-90 ${isFashion ? "rounded-none bg-stone-900 px-4 py-2" : isSingle ? "rounded-full bg-red-600 px-6 py-3 font-black uppercase" : "rounded-lg bg-[var(--fx-primary)] px-4 py-2"}`}
        >
          {orderLabel}
        </a>
      </div>
    </div>
  );
}

// Main renderer
export async function RenderSection({ data, section }: { data: StorefrontData; section: Section }) {
  const base = `/s/${data.slug}`;
  const s = section;
  const tpl = data.template_key ?? "ecommerce-modern";
  const isFashion = tpl === "fashion-luxury";
  const isSingle = tpl === "single-product";
  const isPortfolio = tpl === "portfolio";

  switch (s.type) {
    case "hero": {
      if (isFashion) {
        return (
          <section className="relative overflow-hidden bg-[#faf9f7]">
            {s.image ? (
              <div className="relative h-[560px] w-full sm:h-[640px]">
                <StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-stone-900/30" />
              </div>
            ) : null}
            <Container className={s.image ? "absolute inset-0 flex items-center justify-center text-center" : "py-24 text-center"}>
              <div className="max-w-2xl">
                <h1 className={`font-serif text-4xl font-light tracking-wide sm:text-6xl ${s.image ? "text-white" : "text-stone-900"}`}>{s.title}</h1>
                {s.subtitle ? <p className={`mt-6 font-serif text-lg ${s.image ? "text-white/90" : "text-stone-600"}`}>{s.subtitle}</p> : null}
                {s.button_text ? <div className="mt-10"><Button href={safeHref(s.button_link, base)} tpl={tpl} className="rounded-none border border-white bg-transparent px-10 py-3 font-serif uppercase tracking-widest text-white hover:bg-white hover:text-stone-900">{s.button_text}</Button></div> : null}
              </div>
            </Container>
          </section>
        );
      }
      if (isSingle) {
        return (
          <section className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white py-16 sm:py-24">
            <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">🔥 Stock limité</div>
                <h1 className="mt-4 text-4xl font-black uppercase leading-tight text-slate-900 sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg font-medium text-slate-600">{s.subtitle}</p> : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">✅ Paiement à la livraison</span>
                </div>
              </div>
              {s.image ? <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-2xl"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div> : null}
            </Container>
          </section>
        );
      }
      if (isPortfolio) {
        return (
          <section className="bg-white py-20 sm:py-28">
            <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-teal-600">Cabinet professionnel</div>
                <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg text-slate-600">{s.subtitle}</p> : null}
                {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
              </div>
              {s.image ? <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"><StorefrontImage src={s.image} alt={s.title ?? ""} fill sizes="50vw" className="object-cover" /></div> : <div className="hidden lg:block"><div className="rounded-2xl bg-teal-50 p-10"><div className="text-6xl">👨‍⚕️</div><p className="mt-4 text-sm text-teal-800">Expertise, écoute et professionnalisme à votre service.</p></div></div>}
            </Container>
          </section>
        );
      }
      // ecommerce-modern default
      return (
        <section className="relative overflow-hidden bg-white">
          {s.image ? (
            <div className="relative h-[420px] w-full sm:h-[520px]">
              <StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-slate-900/50" />
            </div>
          ) : null}
          <Container className={s.image ? "absolute inset-0 flex items-center" : "py-20 sm:py-28"}>
            <div className={`max-w-2xl ${s.alignment === "center" ? "mx-auto text-center" : s.alignment === "right" ? "ml-auto" : ""}`}>
              <h1 className={`text-3xl font-extrabold leading-tight sm:text-5xl ${s.image ? "text-white" : "text-slate-900"}`}>{s.title}</h1>
              {s.subtitle ? <p className={`mt-4 text-base sm:text-lg ${s.image ? "text-white/90" : "text-slate-600"}`}>{s.subtitle}</p> : null}
              {s.button_text ? <div className={`mt-8 ${s.alignment === "center" ? "text-center" : ""}`}><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
            </div>
          </Container>
        </section>
      );
    }

    case "banner": {
      if (isFashion) {
        return (
          <section className="bg-stone-900 py-16">
            <Container className="text-center">
              <h2 className="font-serif text-3xl font-light text-white">{s.title}</h2>
              {s.subtitle ? <p className="mt-2 font-serif text-stone-300">{s.subtitle}</p> : null}
              {s.button_text ? <div className="mt-6"><Button href={safeHref(s.button_link, base)} tpl={tpl} variant="outline" className="rounded-none border-white text-white hover:bg-white hover:text-stone-900">{s.button_text}</Button></div> : null}
              <p className="mt-6 text-xs text-stone-500">Desktop 1600×700 · Mobile 800×1000 recommandés</p>
            </Container>
          </section>
        );
      }
      if (isSingle) {
        return (
          <section className="bg-red-600 py-12">
            <Container className="flex flex-col items-center justify-between gap-4 text-center text-white sm:flex-row sm:text-left">
              <div><h2 className="text-2xl font-black uppercase">{s.title}</h2>{s.subtitle ? <p className="mt-1 text-white/90">{s.subtitle}</p> : null}</div>
              {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl} className="bg-white text-red-600 hover:bg-red-50">{s.button_text}</Button> : null}
            </Container>
          </section>
        );
      }
      if (isPortfolio) {
        return (
          <section className="bg-teal-600 py-14">
            <Container className="text-center text-white">
              <h2 className="text-2xl font-bold">{s.title}</h2>
              {s.subtitle ? <p className="mt-2 text-teal-100">{s.subtitle}</p> : null}
              {s.button_text ? <div className="mt-6"><Button href={safeHref(s.button_link, base)} tpl={tpl} className="bg-white text-teal-700 hover:bg-teal-50">{s.button_text}</Button></div> : null}
            </Container>
          </section>
        );
      }
      return (
        <section className="relative overflow-hidden bg-slate-900 py-14">
          <Container className="relative text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{s.title}</h2>
            {s.subtitle ? <p className="mt-2 text-white/80">{s.subtitle}</p> : null}
            {s.button_text ? <div className="mt-6"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
            <p className="mt-4 text-xs text-white/40">Desktop 1600×700 · Mobile 800×1000</p>
          </Container>
        </section>
      );
    }

    case "collections":
    case "products": {
      const limit = s.type === "collections" ? (s.max_items ?? 8) : (s.product_count ?? 8);
      const featured = s.type === "products" && s.source === "featured";
      let products = await fetchProducts(data.id, { category_id: s.type === "collections" ? s.category_id : undefined, featured, limit });
      if (featured && products.length === 0) products = await fetchProducts(data.id, { limit });
      if (products.length === 0) return null;
      return (
        <section className={`py-14 ${isFashion ? "bg-[#faf9f7]" : isSingle ? "bg-white" : isPortfolio ? "bg-slate-50" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className={`grid gap-4 sm:gap-6 ${isFashion ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : isSingle ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
              {products.map((p) => (
                <ProductCard key={p.id} p={p} base={base} orderLabel={data.dict.actions.order} tpl={tpl} />
              ))}
            </div>
          </Container>
        </section>
      );
    }

    case "features": {
      if (!s.items || s.items.length === 0) return null;
      return (
        <section className={`py-14 ${isFashion ? "bg-white" : isSingle ? "bg-slate-50" : "bg-slate-50"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className={`grid gap-6 ${isPortfolio ? "sm:grid-cols-1 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {s.items.map((item, i) => (
                <div key={i} className={`${isFashion ? "rounded-none border border-stone-200 bg-[#faf9f7] p-8" : isSingle ? "rounded-2xl border-2 border-slate-100 bg-white p-6" : isPortfolio ? "rounded-xl border border-teal-100 bg-teal-50/50 p-6" : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"}`}>
                  <h3 className={`${isFashion ? "font-serif text-stone-900" : isSingle ? "font-black uppercase text-slate-900" : "font-semibold text-slate-900"}`}>{item.title}</h3>
                  {item.text ? <p className={`mt-2 text-sm ${isFashion ? "font-serif text-stone-600" : "text-slate-600"}`}>{item.text}</p> : null}
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
        <section className={`py-14 ${isSingle ? "bg-white" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <ol className={`grid gap-6 ${isSingle ? "lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {s.steps.map((step, i) => (
                <li key={i} className={`relative p-6 ${isSingle ? "rounded-2xl border-2 border-red-100 bg-red-50/50" : isPortfolio ? "rounded-xl border border-slate-200 bg-white" : "rounded-xl border border-slate-200 bg-white shadow-sm"}`}>
                  <span className={`flex h-10 w-10 items-center justify-center text-sm font-bold text-white ${isSingle ? "rounded-full bg-red-600" : isFashion ? "rounded-none bg-stone-900" : "rounded-full bg-[var(--fx-primary)]"}`}>{i + 1}</span>
                  <h3 className={`mt-4 ${isSingle ? "font-black uppercase" : "font-semibold"} text-slate-900`}>{step.title}</h3>
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
        <section className={`py-10 ${isSingle ? "bg-red-600" : isFashion ? "bg-stone-900" : isPortfolio ? "bg-teal-900" : "bg-[var(--fx-primary)]"}`}>
          <Container className="grid grid-cols-2 gap-6 text-center text-white lg:grid-cols-4">
            {s.items.map((item, i) => (
              <div key={i}><div className={`text-3xl ${isFashion ? "font-serif font-light" : isSingle ? "font-black" : "font-extrabold"}`}>{item.value}</div><div className="mt-1 text-sm text-white/80">{item.label}</div></div>
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
        <section className={`py-14 ${isFashion ? "bg-[#faf9f7]" : "bg-slate-50"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <figure key={i} className={`${isFashion ? "rounded-none border border-stone-200 bg-white p-8" : isSingle ? "rounded-2xl border-2 border-slate-100 bg-white p-6" : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"}`}>
                  <div className="text-amber-500">{"★".repeat(Math.max(0, Math.min(5, r.rating)))}<span className="text-slate-200">{"★".repeat(Math.max(0, 5 - r.rating))}</span></div>
                  <blockquote className={`mt-3 text-sm ${isFashion ? "font-serif text-stone-700" : "text-slate-700"}`}>« {r.body ?? r.title} »</blockquote>
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
        <section className={`py-14 ${isPortfolio ? "bg-white" : "bg-white"}`}>
          <Container className="max-w-3xl">
            <SectionTitle section={s} tpl={tpl} />
            <div className={`divide-y shadow-sm ${isFashion ? "divide-stone-200 rounded-none border border-stone-200 bg-white" : isSingle ? "divide-slate-100 rounded-2xl border-2 border-slate-100 bg-white" : "divide-slate-200 rounded-xl border border-slate-200 bg-white"}`}>
              {faqs.map((f, i) => (
                <details key={i} className="group px-6 py-4">
                  <summary className={`cursor-pointer list-none font-semibold group-open:text-[var(--fx-primary)] ${isFashion ? "font-serif text-stone-900" : "text-slate-900"}`}>{f.question}</summary>
                  <p className={`mt-2 text-sm ${isFashion ? "font-serif text-stone-600" : "text-slate-600"}`}>{f.answer}</p>
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
            <div className={`${isSingle ? "rounded-3xl border-4 border-red-600 bg-white p-10 shadow-xl" : isFashion ? "rounded-none border border-stone-900 bg-white p-10" : "rounded-2xl border-2 border-[var(--fx-primary)] bg-white p-8 shadow-md"} text-center`}>
              <h2 className={`${isSingle ? "text-3xl font-black uppercase text-red-600" : isFashion ? "font-serif text-2xl font-light text-stone-900" : "text-2xl font-extrabold text-[var(--fx-primary)]"}`}>{s.title}</h2>
              {s.subtitle ? <p className={`mt-2 ${isSingle ? "font-bold text-slate-800" : "font-medium text-slate-700"}`}>{s.subtitle}</p> : null}
              {s.text ? <p className="mt-4 text-sm text-slate-600">{s.text}</p> : null}
              <div className="mt-6"><Button href={`${base}/commande`} tpl={tpl}>{data.dict.actions.order}</Button></div>
            </div>
          </Container>
        </section>
      );
    }

    case "gallery": {
      if (!s.images || s.images.length === 0) return null;
      return (
        <section className={`py-14 ${isPortfolio ? "bg-white" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className={`grid gap-3 ${isPortfolio ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
              {s.images.map((url, i) => (
                <div key={i} className={`relative overflow-hidden bg-slate-100 ${isFashion ? "aspect-[4/5] rounded-none" : isPortfolio ? "aspect-[4/3] rounded-xl" : "aspect-square rounded-lg"}`}>
                  <StorefrontImage src={url!} alt={`${s.title ?? "galerie"} ${i + 1}`} fill sizes="25vw" className="object-cover" />
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
        <section className={`py-14 ${isPortfolio ? "bg-slate-50" : "bg-slate-50"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <div key={i} className={`overflow-hidden bg-white shadow-sm ${isPortfolio ? "rounded-2xl border border-teal-100" : isFashion ? "rounded-none border border-stone-200" : "rounded-xl border border-slate-200"}`}>
                  {item.image ? <div className="relative aspect-[16/9] bg-slate-100"><StorefrontImage src={item.image} alt={item.title ?? ""} fill sizes="33vw" className="object-cover" /></div> : null}
                  <div className="p-6"><h3 className={`font-semibold ${isPortfolio ? "text-teal-900" : "text-slate-900"}`}>{item.title}</h3>{item.text ? <p className="mt-2 text-sm text-slate-600">{item.text}</p> : null}</div>
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
        <section className={`py-14 ${isPortfolio ? "bg-teal-50" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <figure key={i} className={`${isPortfolio ? "rounded-2xl border border-teal-100 bg-white p-8 shadow-sm" : isFashion ? "rounded-none border border-stone-200 bg-[#faf9f7] p-8" : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"}`}>
                  <blockquote className={`text-sm ${isPortfolio ? "text-slate-700 italic" : isFashion ? "font-serif text-stone-700" : "text-slate-700"}`}>« {item.text} »</blockquote>
                  <figcaption className="mt-4"><div className="text-sm font-semibold text-slate-900">{item.name}</div>{item.role ? <div className="text-xs text-slate-500">{item.role}</div> : null}</figcaption>
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
        <section className={`py-14 ${isPortfolio ? "bg-white" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {s.items.map((item, i) => (
                <div key={i} className={`${isPortfolio ? "rounded-2xl bg-teal-50 p-8 text-center" : isFashion ? "rounded-none bg-stone-50 p-8 text-center border border-stone-200" : "rounded-xl bg-slate-50 p-6 text-center"}`}>
                  <div className={`text-3xl ${isPortfolio ? "font-bold text-teal-700" : isFashion ? "font-serif text-stone-900" : "font-extrabold text-[var(--fx-primary)]"}`}>{item.value}</div>
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
            <SectionTitle section={s} tpl={tpl} />
            <div className={`divide-y shadow-sm ${isPortfolio ? "divide-teal-100 rounded-2xl border border-teal-100 bg-white" : "divide-slate-200 rounded-xl border border-slate-200 bg-white"}`}>
              {s.days.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 text-sm"><span className="font-medium text-slate-900">{d.day}</span><span className="text-slate-600">{d.value}</span></div>
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
            <SectionTitle section={s} tpl={tpl} />
            <div className={`${isPortfolio ? "rounded-2xl border border-teal-100 bg-teal-50 p-10" : "rounded-xl border border-slate-200 bg-white p-8 shadow-sm"}`}>
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
        <section className={`${isPortfolio ? "bg-teal-50" : "bg-slate-50"} py-14`}>
          <Container className="max-w-2xl">
            <SectionTitle section={s} tpl={tpl} />
            <div className="flex flex-col items-center gap-4">
              {s.show_phone !== false && c?.phone ? <a href={`tel:${c.phone}`} className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"><div className="text-xs uppercase tracking-wide text-slate-500">{data.dict.actions.call}</div><div className="mt-1 text-lg font-bold text-slate-900">{c.phone}</div></a> : null}
              {s.show_whatsapp !== false && wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm hover:border-green-500"><div className="text-xs uppercase tracking-wide text-slate-500">{data.dict.actions.whatsapp}</div><div className="mt-1 text-lg font-bold text-green-600">{data.dict.actions.whatsapp}</div></a> : null}
              {s.show_email !== false && c?.email ? <a href={`mailto:${c.email}`} className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"><div className="text-xs uppercase tracking-wide text-slate-500">Email</div><div className="mt-1 text-lg font-bold text-slate-900">{c.email}</div></a> : null}
              {s.text ? <p className="mt-2 text-center text-sm text-slate-600">{s.text}</p> : null}
            </div>
          </Container>
        </section>
      );
    }

    case "cta": {
      return (
        <section className={`py-14 ${isFashion ? "bg-stone-900" : isPortfolio ? "bg-teal-900" : ""}`}>
          <Container className="max-w-3xl text-center">
            <h2 className={`text-2xl sm:text-3xl ${isFashion ? "font-serif font-light text-white" : isPortfolio ? "font-bold text-white" : "font-bold text-slate-900"}`}>{s.title}</h2>
            {s.text ? <p className={`mt-3 ${isFashion ? "font-serif text-stone-300" : isPortfolio ? "text-teal-100" : "text-slate-600"}`}>{s.text}</p> : null}
            {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
          </Container>
        </section>
      );
    }

    case "cod_form": {
      return (
        <section id="commande" className={`py-14 ${isSingle ? "bg-white" : ""}`}>
          <Container className="max-w-3xl">
            <div className={`${isSingle ? "rounded-3xl bg-slate-900 p-10 shadow-2xl" : isFashion ? "rounded-none bg-stone-900 p-10" : "rounded-2xl bg-slate-900 p-8 shadow-lg"} text-center text-white`}>
              <h2 className={`${isSingle ? "text-3xl font-black uppercase" : isFashion ? "font-serif text-3xl font-light" : "text-2xl font-extrabold sm:text-3xl"}`}>{s.title}</h2>
              {s.subtitle ? <p className="mt-2 text-white/80">{s.subtitle}</p> : null}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button href={`${base}/commande`} tpl={tpl}>{data.dict.actions.order}</Button>
                {data.settings?.contact?.phone ? <Button href={`tel:${data.settings.contact.phone}`} variant="outline" tpl={tpl} className="!text-white !border-white/40 hover:!bg-white hover:!text-slate-900">{data.settings.contact.phone}</Button> : null}
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
            <a href={`${base}/commande`} className={`shrink-0 px-5 py-2.5 text-sm font-bold text-white ${isSingle ? "rounded-full bg-red-600" : isFashion ? "rounded-none bg-stone-900" : "rounded-lg bg-[var(--fx-primary)]"}`}>{s.button_text}</a>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
