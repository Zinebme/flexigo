import Link from "next/link";

export const metadata = { title: "FlexiGo — Plateforme de sites e-commerce pour l'Algérie" };

const features = [
  {
    icon: "🛒",
    title: "Boutiques COD clés en main",
    text: "E-commerce avec paiement à la livraison, offres pack, wilayas, communes et suivi des commandes — prêt à vendre.",
  },
  {
    icon: "🎯",
    title: "Pages de vente haute conversion",
    text: "Landings single-produit optimisées Meta/TikTok Ads avec formulaire de commande et preuve sociale.",
  },
  {
    icon: "👔",
    title: "Portfolios professionnels",
    text: "Vitrines élégantes pour cabinets médicaux, agences, consultants et photographes.",
  },
  {
    icon: "🌐",
    title: "Votre domaine, votre identité",
    text: "Domaine personnalisé, logo, couleurs, langues FR / AR (RTL) / EN — sans toucher au code.",
  },
  {
    icon: "📦",
    title: "Livraison & transporteurs",
    text: "Tarifs par wilaya, livraison à domicile ou au bureau, envoi au transporteur (Navex, manuel, démo).",
  },
  {
    icon: "📊",
    title: "Pilotage complet",
    text: "Commandes, stocks, clients, statistiques, avis, FAQ, Google Sheets et pixels marketing — en français.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black">F</span>
            <span className="text-lg font-extrabold">FlexiGo</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#fonctionnalites" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block">
              Fonctionnalités
            </a>
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.25),transparent)]" />
        <div className="mx-auto w-full max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <div className="mx-auto mb-6 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
            Conçu pour le marché algérien · Paiement à la livraison
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Votre site e-commerce <span className="text-blue-400">prêt à vendre</span>, en quelques minutes
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            FlexiGo crée, gère et fait évoluer vos sites : boutiques COD, pages de vente et portfolios.
            Un dashboard simple, en français, pour piloter commandes, stocks et clients.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Accéder à mon espace
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Sites livrés par FlexiGo — vous les gérez vous-même au quotidien.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Tout ce qu'il faut pour vendre en Algérie</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
          De la création du site au traitement des commandes, FlexiGo couvre toute la chaîne.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-slate-900 p-10 text-center sm:p-16">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Prêt à lancer votre boutique ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Créez votre compte. Un site FlexiGo est livré avec produits d'exemple, tarifs de livraison et
            page de commande — il ne reste qu'à personnaliser et activer.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
          >
            Créer mon compte
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FlexiGo — Plateforme multi-tenant de gestion de sites.
      </footer>
    </div>
  );
}
