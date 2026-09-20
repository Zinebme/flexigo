import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FlexiGo — Aperçu des templates",
  robots: { index: false, follow: false },
};

const templates = [
  {
    key: "souq",
    name: "SOUQ",
    category: "Généraliste COD",
    description: "Boutique arabe polyvalente pour produits variés, offres et conversion mobile.",
    image: "/images/templates/souq-v1.svg",
  },
  {
    key: "lamsa",
    name: "LAMSA",
    category: "Mode / Hijab / Abaya",
    description: "Univers premium, éditorial et féminin pour mode pudique et vêtements.",
    image: "/images/templates/lamsa-v1.svg",
  },
  {
    key: "noor",
    name: "NOOR",
    category: "Beauté / Skincare",
    description: "Design doux, lumineux et premium pour beauté, parfum et soins.",
    image: "/images/templates/noor-v1.svg",
  },
  {
    key: "volt",
    name: "VOLT",
    category: "Électronique / Gadgets",
    description: "Style sombre et technique pour appareils, accessoires et produits tech.",
    image: "/images/templates/volt-v1.svg",
  },
  {
    key: "dar",
    name: "DAR",
    category: "Maison / Cuisine / Rangement",
    description: "Univers chaleureux crème, olive et terracotta pour la maison.",
    image: "/images/templates/dar-v1.svg",
  },
] as const;

export default function PreviewGalleryPage() {
  return (
    <main className="min-h-screen bg-[#f5f4f1] text-[#171717]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
            FlexiGo Studio
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Aperçu des templates
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Cette page te permet de vérifier les templates directement sur ton site déployé,
            sans créer de boutique réelle et sans envoyer de commandes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => (
            <article
              key={tpl.key}
              className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.05)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <Image
                  src={tpl.image}
                  alt={tpl.name}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="text-xs font-bold uppercase tracking-[0.13em] text-neutral-400">
                  {tpl.category}
                </div>
                <h2 className="mt-2 text-2xl font-black">{tpl.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-600">
                  {tpl.description}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/preview/${tpl.key}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-black px-3 text-sm font-bold text-white transition hover:bg-neutral-800"
                  >
                    Voir la boutique
                  </Link>
                  <Link
                    href={`/preview/${tpl.key}/produit`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 px-3 text-sm font-bold transition hover:bg-neutral-50"
                  >
                    Voir le produit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Les pages de preview sont en mode démonstration. Elles servent à vérifier le design,
          le responsive, les variantes et le formulaire COD sans créer de vraies commandes.
        </div>
      </div>
    </main>
  );
}
