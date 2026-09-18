/**
 * Storefront section renderers — 8 production-quality templates with distinct visual identities.
 * Each template has distinct Hero, ProductCard, Banner, Reviews, etc. — not just recolored.
 *
 * Templates:
 * - elegance: Fashion/Hijab/Abaya luxury editorial beige/taupe/black/ivory refined typography
 * - glow: Beauty/Skincare clean soft nude/pastel/white rounded beauty editorial
 * - tech: Electronics dark graphite electric blue technical cards spec badges
 * - casa: Home/Kitchen warm cream olive terracotta lifestyle
 * - little: Baby/Kids soft pastel rounded friendly trust
 * - active: Sport/Fitness dynamic black/white bright accent strong typography
 * - market: General Algerian COD Store commercial clean fast offer badges promo visible
 * - convert: Single Product COD Landing optimized Meta/TikTok conversion-oriented mobile
 *
 * Data-driven sections query as ANON role. No raw HTML/JS/CSS.
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

// Template helpers

function SectionTitle({ section, tpl }: { section: { title?: string | null; subtitle?: string | null }; tpl: string }) {
  if (!section.title && !section.subtitle) return null;
  const elegance = tpl === "elegance" || tpl === "fashion-luxury";
  const glow = tpl === "glow";
  const tech = tpl === "tech";
  const casa = tpl === "casa";
  const little = tpl === "little";
  const active = tpl === "active";
  const market = tpl === "market" || tpl === "ecommerce-modern";
  const convert = tpl === "convert" || tpl === "single-product";
  const portfolio = tpl === "portfolio";

  return (
    <div className={`mb-8 ${elegance ? "text-center" : glow ? "text-center" : tech ? "text-left" : casa ? "text-left" : little ? "text-center" : active ? "text-left" : market ? "text-left" : convert ? "text-center" : portfolio ? "text-left" : "text-center"}`}>
      {section.title ? (
        <h2
          className={
            elegance ? "font-serif text-3xl font-light tracking-wide text-stone-900 sm:text-4xl" :
            glow ? "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" :
            tech ? "font-mono text-2xl font-bold uppercase tracking-widest text-slate-100 sm:text-3xl" :
            casa ? "font-serif text-3xl font-light text-stone-800 sm:text-4xl" :
            little ? "text-3xl font-extrabold text-slate-800 sm:text-4xl" :
            active ? "text-3xl font-black uppercase italic tracking-tight text-slate-900 sm:text-5xl" :
            market ? "text-2xl font-extrabold text-slate-900 sm:text-3xl" :
            convert ? "text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl" :
            portfolio ? "text-2xl font-bold text-teal-900" :
            "text-2xl font-bold text-slate-900 sm:text-3xl"
          }
        >
          {section.title}
        </h2>
      ) : null}
      {section.subtitle ? (
        <p className={`mx-auto mt-3 max-w-2xl text-sm sm:text-base ${elegance ? "font-serif text-stone-500" : glow ? "text-slate-500" : tech ? "font-mono text-slate-400" : casa ? "text-stone-500" : little ? "text-slate-500" : active ? "font-bold uppercase text-slate-500" : market ? "text-slate-500" : convert ? "font-medium text-slate-600" : "text-slate-500"} ${tech || casa || active || market ? "mx-0" : ""}`}>
          {section.subtitle}
        </p>
      ) : null}
      {elegance && <div className="mx-auto mt-4 h-px w-12 bg-amber-600/50" />}
      {glow && <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-pink-300" />}
      {active && <div className="mt-4 h-1 w-16 bg-lime-400" />}
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
  const elegance = tpl === "elegance" || tpl === "fashion-luxury";
  const glow = tpl === "glow";
  const tech = tpl === "tech";
  const casa = tpl === "casa";
  const little = tpl === "little";
  const active = tpl === "active";
  const market = tpl === "market" || tpl === "ecommerce-modern";
  const convert = tpl === "convert" || tpl === "single-product";

  const shape =
    elegance ? "rounded-none" :
    glow ? "rounded-full" :
    tech ? "rounded-none" :
    casa ? "rounded-2xl" :
    little ? "rounded-full" :
    active ? "rounded-none skew-x-[-6deg]" :
    market ? "rounded-xl" :
    convert ? "rounded-full" :
    "rounded-lg";

  const primaryStyle =
    variant === "primary"
      ? elegance ? "bg-stone-900 px-8 py-3 text-sm font-serif uppercase tracking-widest text-white hover:bg-stone-800"
      : glow ? "bg-pink-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200 hover:bg-pink-700"
      : tech ? "bg-sky-400 px-8 py-3 font-mono text-sm font-bold uppercase tracking-widest text-slate-900 hover:bg-sky-300"
      : casa ? "bg-stone-700 px-7 py-3 text-sm font-medium text-white hover:bg-stone-800"
      : little ? "bg-pink-400 px-8 py-3 text-sm font-bold text-white shadow hover:bg-pink-500"
      : active ? "bg-black px-8 py-4 text-sm font-black uppercase tracking-wide text-white hover:bg-zinc-800"
      : market ? "bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
      : convert ? "bg-red-600 px-8 py-4 text-base font-black uppercase tracking-wide text-white shadow-xl hover:bg-red-700"
      : "bg-[var(--fx-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
      : "";

  const outlineStyle =
    variant === "outline"
      ? "border bg-transparent hover:bg-[var(--fx-primary)] hover:text-white border-[var(--fx-primary)] text-[var(--fx-primary)] px-6 py-3 text-sm font-semibold"
      : "";

  return (
    <a href={href} className={`inline-flex items-center justify-center transition ${shape} ${variant === "primary" ? primaryStyle : outlineStyle} ${className}`}>
      <span className={active && variant === "primary" ? "skew-x-[6deg]" : ""}>{children}</span>
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
  const elegance = tpl === "elegance" || tpl === "fashion-luxury";
  const glow = tpl === "glow";
  const tech = tpl === "tech";
  const casa = tpl === "casa";
  const little = tpl === "little";
  const active = tpl === "active";
  const market = tpl === "market" || tpl === "ecommerce-modern";
  const convert = tpl === "convert" || tpl === "single-product";
  const portfolio = tpl === "portfolio";
  if (portfolio) return null;

  if (elegance) {
    return (
      <div className="group flex flex-col overflow-hidden border border-stone-200 bg-white transition hover:shadow-lg">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-stone-100">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl text-stone-300">👜</div>}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 text-white opacity-0 transition group-hover:opacity-100"><span className="font-serif text-xs uppercase tracking-widest">Voir détail</span></div>
        </a>
        <div className="flex flex-1 flex-col p-5">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 font-serif text-sm text-stone-800 hover:text-stone-900">{p.name}</a>
          <div className="mt-3 flex items-baseline gap-2"><span className="font-serif text-lg text-stone-900">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs text-stone-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-4 inline-flex items-center justify-center bg-stone-900 px-4 py-2.5 font-serif text-xs uppercase tracking-widest text-white hover:bg-stone-800">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (glow) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-[24px] border border-pink-100 bg-white p-2 shadow-sm transition hover:shadow-xl hover:shadow-pink-100">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-[20px] bg-pink-50">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl">💄</div>}
          {p.compare_at_price_cents ? <span className="absolute left-3 top-3 rounded-full bg-pink-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white">Promo</span> : null}
        </a>
        <div className="flex flex-1 flex-col p-3">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-pink-600">{p.name}</a>
          <div className="mt-2 flex items-baseline gap-2"><span className="text-base font-bold text-pink-600">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (tech) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-none border border-slate-700 bg-slate-900 transition hover:border-sky-400/50">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-800">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl text-slate-600">🎧</div>}
          <span className="absolute left-2 top-2 rounded-none bg-sky-400 px-2 py-1 font-mono text-[10px] font-bold uppercase text-slate-900">TECH</span>
        </a>
        <div className="flex flex-1 flex-col p-4">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 font-mono text-sm font-bold uppercase tracking-wide text-slate-100 hover:text-sky-400">{p.name}</a>
          <div className="mt-3 flex items-baseline gap-2"><span className="font-mono text-lg font-bold text-sky-400">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="font-mono text-xs text-slate-500 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-4 inline-flex items-center justify-center bg-sky-400 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 hover:bg-sky-300">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (casa) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-stone-100">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl">🏠</div>}
        </a>
        <div className="flex flex-1 flex-col p-4">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-medium text-stone-800 hover:text-stone-900">{p.name}</a>
          <div className="mt-2 flex items-baseline gap-2"><span className="text-base font-semibold text-stone-900">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs text-stone-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-3 inline-flex items-center justify-center rounded-xl bg-stone-800 px-4 py-2.5 text-xs font-medium text-white hover:bg-stone-900">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (little) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-[28px] border border-pink-100 bg-white p-2 shadow-sm transition hover:shadow-lg">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-[22px] bg-amber-50">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl">🧸</div>}
          <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-pink-500 shadow">SAFE ✓</span>
        </a>
        <div className="flex flex-1 flex-col p-3">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-bold text-slate-800 hover:text-pink-500">{p.name}</a>
          <div className="mt-2 flex items-baseline gap-2"><span className="text-base font-extrabold text-pink-500">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-3 inline-flex items-center justify-center rounded-full bg-pink-400 px-4 py-2.5 text-xs font-bold text-white hover:bg-pink-500">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className="group flex flex-col overflow-hidden border-2 border-black bg-white transition hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden bg-zinc-100">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl">💪</div>}
          <span className="absolute left-0 top-0 bg-lime-400 px-3 py-1 text-[10px] font-black uppercase text-black">NEW</span>
        </a>
        <div className="flex flex-1 flex-col p-4">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-black uppercase tracking-tight text-black hover:text-zinc-700">{p.name}</a>
          <div className="mt-2 flex items-baseline gap-2"><span className="text-lg font-black text-black">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs font-bold text-zinc-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-3 inline-flex items-center justify-center bg-black px-4 py-3 text-xs font-black uppercase tracking-wide text-white hover:bg-zinc-900">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (market) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-50">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl text-slate-300">🛍️</div>}
          {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">-{Math.round((1 - p.price_cents / p.compare_at_price_cents) * 100)}%</span> : null}
          <span className="absolute bottom-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">✓ Livraison 24h</span>
        </a>
        <div className="flex flex-1 flex-col p-3">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600">{p.name}</a>
          <div className="mt-2 flex items-baseline gap-2"><span className="text-base font-extrabold text-blue-600">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">{orderLabel}</a>
        </div>
      </div>
    );
  }

  if (convert) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-2 shadow-sm transition hover:border-red-200">
        <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-slate-50">
          {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">🔥</div>}
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">🔥 Best seller</span>
        </a>
        <div className="flex flex-1 flex-col p-3">
          <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-black uppercase text-slate-900">{p.name}</a>
          <div className="mt-2 flex items-baseline gap-2"><span className="text-lg font-black text-red-600">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs font-bold text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
          <a href={`${base}/commande?product=${p.id}`} className="mt-3 inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-black uppercase text-white shadow-lg hover:bg-red-700">{orderLabel}</a>
        </div>
      </div>
    );
  }

  // fallback
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <a href={`${base}/produit/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        {p.image ? <StorefrontImage src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl text-slate-300">🛍️</div>}
      </a>
      <div className="flex flex-1 flex-col p-4">
        <a href={`${base}/produit/${p.slug}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-[var(--fx-primary)]">{p.name}</a>
        <div className="mt-2 flex items-baseline gap-2"><span className="text-lg font-bold text-[var(--fx-primary)]">{formatDA(p.price_cents)}</span>{p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? <span className="text-xs text-slate-400 line-through">{formatDA(p.compare_at_price_cents)}</span> : null}</div>
        <a href={`${base}/commande?product=${p.id}`} className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--fx-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">{orderLabel}</a>
      </div>
    </div>
  );
}

// Main renderer
export async function RenderSection({ data, section }: { data: StorefrontData; section: Section }) {
  const base = `/s/${data.slug}`;
  const s = section;
  const tpl = data.template_key ?? "market";

  const elegance = tpl === "elegance" || tpl === "fashion-luxury";
  const glow = tpl === "glow";
  const tech = tpl === "tech";
  const casa = tpl === "casa";
  const little = tpl === "little";
  const active = tpl === "active";
  const market = tpl === "market" || tpl === "ecommerce-modern";
  const convert = tpl === "convert" || tpl === "single-product";
  const portfolio = tpl === "portfolio";

  switch (s.type) {
    case "hero": {
      if (elegance) {
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
                <div className="mb-4 font-serif text-xs uppercase tracking-[0.3em] text-amber-700/70">Nouvelle collection</div>
                <h1 className={`font-serif text-4xl font-light tracking-wide sm:text-6xl ${s.image ? "text-white" : "text-stone-900"}`}>{s.title}</h1>
                {s.subtitle ? <p className={`mt-6 font-serif text-lg ${s.image ? "text-white/90" : "text-stone-600"}`}>{s.subtitle}</p> : null}
                {s.button_text ? <div className="mt-10"><Button href={safeHref(s.button_link, base)} tpl={tpl} className="rounded-none border border-white bg-transparent px-10 py-3 font-serif uppercase tracking-widest text-white hover:bg-white hover:text-stone-900">{s.button_text}</Button></div> : null}
              </div>
            </Container>
          </section>
        );
      }
      if (glow) {
        return (
          <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-fuchsia-50 py-16 sm:py-24">
            <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-pink-700">✨ Clean beauty • Résultats visibles</div>
                <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg leading-relaxed text-slate-600">{s.subtitle}</p> : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow">4,8/5 — 1200+ avis ⭐</span>
                </div>
              </div>
              {s.image ? <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-white p-2 shadow-2xl shadow-pink-100"><div className="relative h-full w-full overflow-hidden rounded-[24px]"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div></div> : null}
            </Container>
          </section>
        );
      }
      if (tech) {
        return (
          <section className="relative overflow-hidden bg-[#020617] py-16 sm:py-24">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
            <Container className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex rounded-none bg-sky-400 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-900">Nouveauté • Stock limité</div>
                <h1 className="mt-4 font-mono text-4xl font-bold uppercase leading-tight tracking-widest text-white sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 font-mono text-base text-slate-400">{s.subtitle}</p> : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
                  <span className="inline-flex items-center gap-2 rounded-none border border-slate-700 px-4 py-2 font-mono text-xs text-slate-300">✓ Garantie 12 mois</span>
                </div>
              </div>
              {s.image ? <div className="relative aspect-square overflow-hidden rounded-none border border-slate-800 bg-slate-900"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="50vw" className="object-cover" /></div> : null}
            </Container>
          </section>
        );
      }
      if (casa) {
        return (
          <section className="relative overflow-hidden bg-[#fdfbf7] py-16 sm:py-20">
            <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-stone-500">Maison • Inspiration • Qualité</div>
                <h1 className="mt-3 font-serif text-4xl font-light leading-tight text-stone-800 sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg text-stone-600">{s.subtitle}</p> : null}
                {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
              </div>
              {s.image ? <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-white p-2 shadow-xl"><div className="relative h-full w-full overflow-hidden rounded-[16px]"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="50vw" className="object-cover" /></div></div> : null}
            </Container>
          </section>
        );
      }
      if (little) {
        return (
          <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-amber-50 to-white py-16 sm:py-20">
            <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-pink-500 shadow">🧸 Certifié sans produits nocifs</div>
                <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-800 sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg text-slate-600">{s.subtitle}</p> : null}
                {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
              </div>
              {s.image ? <div className="relative aspect-square overflow-hidden rounded-[32px] bg-white p-3 shadow-2xl"><div className="relative h-full w-full overflow-hidden rounded-[24px]"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="50vw" className="object-cover" /></div></div> : null}
            </Container>
          </section>
        );
      }
      if (active) {
        return (
          <section className="relative overflow-hidden bg-white py-16 sm:py-24">
            <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-lime-400">Nouvelle collection 2025</div>
                <h1 className="mt-4 text-5xl font-black uppercase italic leading-[0.9] tracking-tight text-black sm:text-7xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg font-bold uppercase tracking-wide text-zinc-600">{s.subtitle}</p> : null}
                {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
              </div>
              {s.image ? <div className="relative aspect-[4/3] overflow-hidden border-4 border-black bg-zinc-100"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="50vw" className="object-cover" /></div> : null}
            </Container>
          </section>
        );
      }
      if (market) {
        return (
          <section className="relative overflow-hidden bg-white">
            {s.image ? (
              <div className="relative h-[420px] w-full sm:h-[520px]">
                <StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-slate-900/50" />
              </div>
            ) : null}
            <Container className={s.image ? "absolute inset-0 flex items-center" : "py-16 sm:py-20"}>
              <div className={`max-w-2xl ${s.alignment === "center" ? "mx-auto text-center" : ""}`}>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase text-black">⚡ Offre flash • Stock limité</div>
                <h1 className={`text-3xl font-extrabold leading-tight sm:text-5xl ${s.image ? "text-white" : "text-slate-900"}`}>{s.title}</h1>
                {s.subtitle ? <p className={`mt-4 text-base sm:text-lg ${s.image ? "text-white/90" : "text-slate-600"}`}>{s.subtitle}</p> : null}
                <div className={`mt-6 flex flex-wrap gap-3 ${s.alignment === "center" ? "justify-center" : ""}`}>
                  {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${s.image ? "bg-white/20 text-white backdrop-blur" : "bg-emerald-50 text-emerald-700"}`}>✓ Paiement à la livraison • 58 wilayas</span>
                </div>
              </div>
            </Container>
          </section>
        );
      }
      if (convert) {
        return (
          <section className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white py-16 sm:py-24">
            <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">🔥 Stock limité — 127 personnes regardent</div>
                <h1 className="mt-4 text-4xl font-black uppercase leading-tight text-slate-900 sm:text-5xl">{s.title}</h1>
                {s.subtitle ? <p className="mt-4 text-lg font-medium text-slate-600">{s.subtitle}</p> : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">✅ Paiement à la livraison</span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-slate-500"><span>⭐⭐⭐⭐⭐</span><span className="font-bold">4,8/5</span><span>— 2 847 avis vérifiés</span></div>
              </div>
              {s.image ? <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-2xl"><StorefrontImage src={s.image} alt={s.title ?? ""} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div> : null}
            </Container>
          </section>
        );
      }
      if (portfolio) {
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
      return (
        <section className="relative overflow-hidden bg-white">
          <Container className="py-20 sm:py-28">
            <div className={`max-w-2xl ${s.alignment === "center" ? "mx-auto text-center" : ""}`}>
              <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">{s.title}</h1>
              {s.subtitle ? <p className="mt-4 text-base text-slate-600 sm:text-lg">{s.subtitle}</p> : null}
              {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
            </div>
          </Container>
        </section>
      );
    }

    case "banner": {
      if (elegance) {
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
      if (glow) {
        return (
          <section className="bg-pink-50 py-14">
            <Container className="flex flex-col items-center justify-between gap-6 rounded-[24px] bg-white p-8 shadow-sm sm:flex-row">
              <div><h2 className="text-2xl font-bold text-slate-900">{s.title}</h2>{s.subtitle ? <p className="mt-1 text-slate-600">{s.subtitle}</p> : null}</div>
              {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
            </Container>
          </section>
        );
      }
      if (tech) {
        return (
          <section className="bg-slate-900 py-12">
            <Container className="flex flex-col items-center justify-between gap-4 border border-slate-700 bg-slate-800 p-6 sm:flex-row">
              <div><h2 className="font-mono text-xl font-bold uppercase tracking-widest text-white">{s.title}</h2>{s.subtitle ? <p className="mt-1 font-mono text-sm text-slate-400">{s.subtitle}</p> : null}</div>
              {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}
            </Container>
          </section>
        );
      }
      if (casa) {
        return (
          <section className="bg-[#fdfbf7] py-14">
            <Container className="rounded-[24px] bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row"><div><h2 className="font-serif text-2xl text-stone-800">{s.title}</h2>{s.subtitle ? <p className="mt-1 text-stone-500">{s.subtitle}</p> : null}</div>{s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button> : null}</div>
            </Container>
          </section>
        );
      }
      if (little) {
        return (
          <section className="bg-amber-50 py-14">
            <Container className="rounded-[24px] bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-800">{s.title}</h2>{s.subtitle ? <p className="mt-2 text-slate-600">{s.subtitle}</p> : null}
              {s.button_text ? <div className="mt-6"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
            </Container>
          </section>
        );
      }
      if (active) {
        return (
          <section className="bg-black py-12">
            <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div><h2 className="text-2xl font-black uppercase italic text-white">{s.title}</h2>{s.subtitle ? <p className="mt-1 font-bold uppercase text-zinc-400">{s.subtitle}</p> : null}</div>
              {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl} className="bg-lime-400 text-black hover:bg-lime-300">{s.button_text}</Button> : null}
            </Container>
          </section>
        );
      }
      if (market) {
        return (
          <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-3">
            <Container className="flex flex-col items-center justify-between gap-2 text-center text-white sm:flex-row sm:text-left">
              <div className="flex items-center gap-2"><span className="text-sm font-black uppercase tracking-wide">{s.title}</span>{s.subtitle ? <span className="hidden text-sm text-white/80 sm:inline">— {s.subtitle}</span> : null}</div>
              {s.button_text ? <a href={safeHref(s.button_link, base)} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-blue-600">{s.button_text}</a> : null}
            </Container>
          </section>
        );
      }
      if (convert) {
        return (
          <section className="bg-red-600 py-12">
            <Container className="flex flex-col items-center justify-between gap-4 text-center text-white sm:flex-row sm:text-left">
              <div><h2 className="text-2xl font-black uppercase">{s.title}</h2>{s.subtitle ? <p className="mt-1 text-white/90">{s.subtitle}</p> : null}</div>
              {s.button_text ? <Button href={safeHref(s.button_link, base)} tpl={tpl} className="bg-white text-red-600 hover:bg-red-50">{s.button_text}</Button> : null}
            </Container>
          </section>
        );
      }
      if (portfolio) {
        return (
          <section className="bg-teal-600 py-14">
            <Container className="text-center text-white"><h2 className="text-2xl font-bold">{s.title}</h2>{s.subtitle ? <p className="mt-2 text-teal-100">{s.subtitle}</p> : null}{s.button_text ? <div className="mt-6"><Button href={safeHref(s.button_link, base)} tpl={tpl} className="bg-white text-teal-700 hover:bg-teal-50">{s.button_text}</Button></div> : null}</Container>
          </section>
        );
      }
      return (
        <section className="relative overflow-hidden bg-slate-900 py-14">
          <Container className="relative text-center"><h2 className="text-2xl font-bold text-white sm:text-3xl">{s.title}</h2>{s.subtitle ? <p className="mt-2 text-white/80">{s.subtitle}</p> : null}{s.button_text ? <div className="mt-6"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}<p className="mt-4 text-xs text-white/40">Desktop 1600×700 · Mobile 800×1000</p></Container>
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
      const bg =
        elegance ? "bg-[#faf9f7]" :
        glow ? "bg-white" :
        tech ? "bg-[#020617]" :
        casa ? "bg-[#fdfbf7]" :
        little ? "bg-gradient-to-br from-pink-50 to-amber-50" :
        active ? "bg-white" :
        market ? "bg-slate-50" :
        convert ? "bg-white" :
        portfolio ? "bg-slate-50" :
        "bg-white";
      const grid =
        elegance ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
        glow ? "grid-cols-2 lg:grid-cols-4" :
        tech ? "grid-cols-2 lg:grid-cols-4" :
        casa ? "grid-cols-2 lg:grid-cols-4" :
        little ? "grid-cols-2 lg:grid-cols-4" :
        active ? "grid-cols-2 lg:grid-cols-4" :
        market ? "grid-cols-2 lg:grid-cols-4" :
        convert ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
        "grid-cols-2 lg:grid-cols-4";
      return (
        <section className={`py-14 ${bg}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className={`grid gap-4 sm:gap-6 ${grid}`}>
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
        <section className={`py-14 ${elegance ? "bg-white" : glow ? "bg-pink-50/50" : tech ? "bg-slate-900" : casa ? "bg-white" : little ? "bg-white" : active ? "bg-zinc-50" : market ? "bg-white" : convert ? "bg-slate-50" : "bg-slate-50"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className={`grid gap-6 ${portfolio ? "sm:grid-cols-1 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {s.items.map((item, i) => (
                <div key={i} className={
                  elegance ? "rounded-none border border-stone-200 bg-[#faf9f7] p-8" :
                  glow ? "rounded-[20px] bg-white p-6 shadow-sm" :
                  tech ? "rounded-none border border-slate-700 bg-slate-800 p-6" :
                  casa ? "rounded-2xl border border-stone-200 bg-[#fdfbf7] p-6" :
                  little ? "rounded-[20px] bg-amber-50 p-6" :
                  active ? "border-2 border-black bg-white p-6" :
                  market ? "rounded-xl border border-slate-200 bg-white p-6 shadow-sm" :
                  convert ? "rounded-2xl border-2 border-slate-100 bg-white p-6" :
                  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                }>
                  <h3 className={
                    elegance ? "font-serif text-stone-900" :
                    glow ? "font-bold text-slate-900" :
                    tech ? "font-mono font-bold uppercase text-white" :
                    casa ? "font-serif text-stone-800" :
                    little ? "font-bold text-slate-800" :
                    active ? "font-black uppercase text-black" :
                    convert ? "font-black uppercase text-slate-900" :
                    "font-semibold text-slate-900"
                  }>{item.title}</h3>
                  {item.text ? <p className={`mt-2 text-sm ${tech ? "font-mono text-slate-400" : elegance ? "font-serif text-stone-600" : "text-slate-600"}`}>{item.text}</p> : null}
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
        <section className={`py-14 ${convert ? "bg-white" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <ol className={`grid gap-6 ${convert ? "lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {s.steps.map((step, i) => (
                <li key={i} className={`relative p-6 ${
                  convert ? "rounded-2xl border-2 border-red-100 bg-red-50/50" :
                  elegance ? "rounded-none border border-stone-200 bg-[#faf9f7]" :
                  glow ? "rounded-[20px] bg-white shadow-sm" :
                  tech ? "rounded-none border border-slate-700 bg-slate-900" :
                  active ? "border-2 border-black bg-white" :
                  "rounded-xl border border-slate-200 bg-white shadow-sm"
                }`}>
                  <span className={`flex h-10 w-10 items-center justify-center text-sm font-bold text-white ${
                    convert ? "rounded-full bg-red-600" :
                    elegance ? "rounded-none bg-stone-900" :
                    glow ? "rounded-full bg-pink-500" :
                    tech ? "rounded-none bg-sky-400 text-slate-900" :
                    little ? "rounded-full bg-pink-400" :
                    active ? "rounded-none bg-black" :
                    "rounded-full bg-[var(--fx-primary)]"
                  }`}>{i + 1}</span>
                  <h3 className={`mt-4 ${convert ? "font-black uppercase" : active ? "font-black uppercase" : "font-semibold"} text-slate-900`}>{step.title}</h3>
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
        <section className={`py-10 ${convert ? "bg-red-600" : elegance ? "bg-stone-900" : glow ? "bg-pink-600" : tech ? "bg-sky-400" : active ? "bg-black" : market ? "bg-blue-600" : "bg-[var(--fx-primary)]"}`}>
          <Container className={`grid grid-cols-2 gap-6 text-center lg:grid-cols-4 ${tech ? "text-slate-900" : "text-white"}`}>
            {s.items.map((item, i) => (
              <div key={i}><div className={`text-3xl ${elegance ? "font-serif font-light" : convert || active ? "font-black" : "font-extrabold"}`}>{item.value}</div><div className={`mt-1 text-sm ${tech ? "text-slate-800" : "text-white/80"}`}>{item.label}</div></div>
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
        <section className={`py-14 ${elegance ? "bg-[#faf9f7]" : glow ? "bg-pink-50/50" : tech ? "bg-slate-900" : casa ? "bg-[#fdfbf7]" : little ? "bg-amber-50" : active ? "bg-zinc-50" : "bg-slate-50"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <figure key={i} className={
                  elegance ? "rounded-none border border-stone-200 bg-white p-8" :
                  glow ? "rounded-[20px] bg-white p-6 shadow-sm" :
                  tech ? "rounded-none border border-slate-700 bg-slate-800 p-6" :
                  little ? "rounded-[24px] bg-white p-6 shadow-sm" :
                  active ? "border-2 border-black bg-white p-6" :
                  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                }>
                  <div className="text-amber-500">{"★".repeat(Math.max(0, Math.min(5, r.rating)))}<span className="text-slate-200">{"★".repeat(Math.max(0, 5 - r.rating))}</span></div>
                  <blockquote className={`mt-3 text-sm ${elegance ? "font-serif text-stone-700" : tech ? "font-mono text-slate-300" : "text-slate-700"}`}>« {r.body ?? r.title} »</blockquote>
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
        <section className="py-14 bg-white">
          <Container className="max-w-3xl">
            <SectionTitle section={s} tpl={tpl} />
            <div className={`divide-y shadow-sm ${
              elegance ? "divide-stone-200 rounded-none border border-stone-200 bg-white" :
              glow ? "divide-pink-100 rounded-[20px] border border-pink-100 bg-white" :
              tech ? "divide-slate-700 rounded-none border border-slate-700 bg-slate-900" :
              little ? "divide-amber-100 rounded-[20px] border border-amber-100 bg-white" :
              active ? "divide-black border-2 border-black bg-white" :
              convert ? "divide-slate-100 rounded-2xl border-2 border-slate-100 bg-white" :
              "divide-slate-200 rounded-xl border border-slate-200 bg-white"
            }`}>
              {faqs.map((f, i) => (
                <details key={i} className="group px-6 py-4">
                  <summary className={`cursor-pointer list-none font-semibold group-open:text-[var(--fx-primary)] ${elegance ? "font-serif text-stone-900" : tech ? "font-mono text-white" : "text-slate-900"}`}>{f.question}</summary>
                  <p className={`mt-2 text-sm ${elegance ? "font-serif text-stone-600" : tech ? "font-mono text-slate-400" : "text-slate-600"}`}>{f.answer}</p>
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
            <div className={
              convert ? "rounded-3xl border-4 border-red-600 bg-white p-10 shadow-xl" :
              elegance ? "rounded-none border border-stone-900 bg-white p-10" :
              glow ? "rounded-[24px] bg-pink-600 p-10 text-white shadow-xl" :
              tech ? "rounded-none border-2 border-sky-400 bg-slate-900 p-10" :
              active ? "border-4 border-black bg-lime-400 p-10" :
              market ? "rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-md" :
              "rounded-2xl border-2 border-[var(--fx-primary)] bg-white p-8 shadow-md"
            }>
              <div className="text-center">
                <h2 className={
                  convert ? "text-3xl font-black uppercase text-red-600" :
                  elegance ? "font-serif text-2xl font-light text-stone-900" :
                  glow ? "text-2xl font-bold text-white" :
                  tech ? "font-mono text-2xl font-bold uppercase text-sky-400" :
                  active ? "text-3xl font-black uppercase italic text-black" :
                  "text-2xl font-extrabold text-[var(--fx-primary)]"
                }>{s.title}</h2>
                {s.subtitle ? <p className={`mt-2 ${glow ? "text-pink-100" : tech ? "font-mono text-slate-400" : active ? "font-black uppercase text-black" : "font-medium text-slate-700"}`}>{s.subtitle}</p> : null}
                {s.text ? <p className={`mt-4 text-sm ${glow ? "text-pink-100" : tech ? "font-mono text-slate-500" : "text-slate-600"}`}>{s.text}</p> : null}
                <div className="mt-6"><Button href={`${base}/commande`} tpl={tpl}>{data.dict.actions.order}</Button></div>
              </div>
            </div>
          </Container>
        </section>
      );
    }

    case "gallery": {
      if (!s.images || s.images.length === 0) return null;
      return (
        <section className="py-14 bg-white">
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className={`grid gap-3 ${portfolio ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : elegance ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
              {s.images.map((url, i) => (
                <div key={i} className={`relative overflow-hidden bg-slate-100 ${elegance ? "aspect-[4/5] rounded-none" : glow ? "aspect-square rounded-[20px]" : portfolio ? "aspect-[4/3] rounded-xl" : "aspect-square rounded-lg"}`}>
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
        <section className="py-14 bg-slate-50">
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <div key={i} className={`overflow-hidden bg-white shadow-sm ${elegance ? "rounded-none border border-stone-200" : glow ? "rounded-[20px] border border-pink-100" : tech ? "rounded-none border border-slate-700 bg-slate-900" : "rounded-xl border border-slate-200"}`}>
                  {item.image ? <div className="relative aspect-[16/9] bg-slate-100"><StorefrontImage src={item.image} alt={item.title ?? ""} fill sizes="33vw" className="object-cover" /></div> : null}
                  <div className="p-6"><h3 className={`font-semibold ${tech ? "font-mono uppercase text-white" : "text-slate-900"}`}>{item.title}</h3>{item.text ? <p className={`mt-2 text-sm ${tech ? "font-mono text-slate-400" : "text-slate-600"}`}>{item.text}</p> : null}</div>
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
        <section className={`py-14 ${portfolio ? "bg-teal-50" : glow ? "bg-pink-50/50" : little ? "bg-amber-50" : "bg-white"}`}>
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((item, i) => (
                <figure key={i} className={
                  portfolio ? "rounded-2xl border border-teal-100 bg-white p-8 shadow-sm" :
                  elegance ? "rounded-none border border-stone-200 bg-[#faf9f7] p-8" :
                  glow ? "rounded-[20px] bg-white p-6 shadow-sm" :
                  little ? "rounded-[24px] bg-white p-6 shadow-sm" :
                  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                }>
                  <blockquote className={`text-sm ${portfolio ? "italic text-slate-700" : elegance ? "font-serif text-stone-700" : "text-slate-700"}`}>« {item.text} »</blockquote>
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
        <section className="py-14 bg-white">
          <Container>
            <SectionTitle section={s} tpl={tpl} />
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {s.items.map((item, i) => (
                <div key={i} className={
                  portfolio ? "rounded-2xl bg-teal-50 p-8 text-center" :
                  elegance ? "rounded-none border border-stone-200 bg-stone-50 p-8 text-center" :
                  glow ? "rounded-[20px] bg-pink-50 p-6 text-center" :
                  tech ? "rounded-none border border-slate-700 bg-slate-900 p-6 text-center" :
                  active ? "border-2 border-black bg-lime-400 p-6 text-center" :
                  "rounded-xl bg-slate-50 p-6 text-center"
                }>
                  <div className={`text-3xl ${portfolio ? "font-bold text-teal-700" : elegance ? "font-serif text-stone-900" : tech ? "font-mono font-bold text-sky-400" : active ? "font-black text-black" : "font-extrabold text-[var(--fx-primary)]"}`}>{item.value}</div>
                  <div className={`mt-1 text-sm ${tech ? "font-mono text-slate-400" : "text-slate-600"}`}>{item.label}</div>
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
            <div className={`divide-y shadow-sm ${portfolio ? "divide-teal-100 rounded-2xl border border-teal-100 bg-white" : "divide-slate-200 rounded-xl border border-slate-200 bg-white"}`}>
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
            <div className={`${portfolio ? "rounded-2xl border border-teal-100 bg-teal-50 p-10" : "rounded-xl border border-slate-200 bg-white p-8 shadow-sm"}`}>
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
        <section className={`${portfolio ? "bg-teal-50" : "bg-slate-50"} py-14`}>
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
        <section className={`py-14 ${elegance ? "bg-stone-900" : glow ? "bg-pink-600" : tech ? "bg-slate-800" : active ? "bg-black" : portfolio ? "bg-teal-900" : ""}`}>
          <Container className="max-w-3xl text-center">
            <h2 className={`text-2xl sm:text-3xl ${elegance ? "font-serif font-light text-white" : glow ? "font-bold text-white" : tech ? "font-mono font-bold uppercase text-white" : active ? "font-black uppercase italic text-white" : portfolio ? "font-bold text-white" : "font-bold text-slate-900"}`}>{s.title}</h2>
            {s.text ? <p className={`mt-3 ${elegance ? "font-serif text-stone-300" : glow ? "text-pink-100" : tech ? "font-mono text-slate-400" : active ? "font-bold uppercase text-zinc-400" : portfolio ? "text-teal-100" : "text-slate-600"}`}>{s.text}</p> : null}
            {s.button_text ? <div className="mt-8"><Button href={safeHref(s.button_link, base)} tpl={tpl}>{s.button_text}</Button></div> : null}
          </Container>
        </section>
      );
    }

    case "cod_form": {
      return (
        <section id="commande" className="py-14">
          <Container className="max-w-3xl">
            <div className={`${convert ? "rounded-3xl bg-slate-900 p-10 shadow-2xl" : elegance ? "rounded-none bg-stone-900 p-10" : glow ? "rounded-[32px] bg-pink-600 p-10 shadow-2xl" : tech ? "rounded-none border-2 border-sky-400 bg-slate-900 p-10" : active ? "border-4 border-black bg-black p-10" : "rounded-2xl bg-slate-900 p-8 shadow-lg"} text-center text-white`}>
              <h2 className={`${convert ? "text-3xl font-black uppercase" : elegance ? "font-serif text-3xl font-light" : glow ? "text-3xl font-bold" : tech ? "font-mono text-2xl font-bold uppercase tracking-widest text-sky-400" : active ? "text-3xl font-black uppercase italic" : "text-2xl font-extrabold sm:text-3xl"}`}>{s.title}</h2>
              {s.subtitle ? <p className={`mt-2 ${glow ? "text-pink-100" : "text-white/80"}`}>{s.subtitle}</p> : null}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button href={`${base}/commande`} tpl={tpl}>{data.dict.actions.order}</Button>
                {data.settings?.contact?.phone ? <Button href={`tel:${data.settings.contact.phone}`} variant="outline" tpl={tpl} className="!border-white/40 !text-white hover:!bg-white hover:!text-slate-900">{data.settings.contact.phone}</Button> : null}
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
            <a href={`${base}/commande`} className={`shrink-0 px-5 py-2.5 text-sm font-bold text-white ${convert ? "rounded-full bg-red-600" : elegance ? "rounded-none bg-stone-900" : glow ? "rounded-full bg-pink-600" : tech ? "rounded-none bg-sky-400 text-slate-900" : active ? "rounded-none bg-black" : "rounded-lg bg-[var(--fx-primary)]"}`}>{s.button_text}</a>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
