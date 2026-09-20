import type { Metadata } from "next";
import Link from "next/link";
import { StorefrontImage } from "@/components/storefront/image";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "FlexiGo — Template Preview Library",
  description: "Preview the current FlexiGo storefront templates.",
  robots: { index: false, follow: false },
};

const templates = [
  {
    key: "souq",
    name: "SOUQ",
    ar: "سوق",
    category: "General COD Store",
    description: "متجر عام عربي سريع للمبيعات بالدفع عند الاستلام.",
    image: "/images/templates/souq-v1.svg",
    accent: "#16A6A1",
  },
  {
    key: "lamsa",
    name: "LAMSA",
    ar: "لمسة",
    category: "Fashion / Hijab / Abaya",
    description: "هوية أنيقة للأزياء المحتشمة والحجاب والعبايات.",
    image: "/images/templates/lamsa-v1.svg",
    accent: "#8B7355",
  },
  {
    key: "noor",
    name: "NOOR",
    ar: "نور",
    category: "Beauty / Skincare",
    description: "قالب ناعم ونظيف للعناية والجمال والعطور.",
    image: "/images/templates/noor-v1.svg",
    accent: "#A76B72",
  },
  {
    key: "volt",
    name: "VOLT",
    ar: "فولت",
    category: "Electronics / Gadgets",
    description: "قالب تقني مشرق ونظيف للأجهزة والإلكترونيات والإكسسوارات.",
    image: "/images/templates/volt-v1.svg",
    accent: "#4C6FFF",
  },
  {
    key: "dar",
    name: "DAR",
    ar: "دار",
    category: "Home / Kitchen / Organization",
    description: "قالب دافئ للمنزل والمطبخ والترتيب والديكور.",
    image: "/images/templates/dar-v1.svg",
    accent: "#B86E4B",
  },
  {
    key: "pulse",
    name: "PULSE",
    ar: "نبض",
    category: "Sport / Fitness",
    description: "قالب رياضي عربي حديث للجيم، الجري، كرة القدم والتمارين المنزلية.",
    image: "/images/templates/pulse-v1.svg",
    accent: "#0C7A54",
  },
  {
    key: "little",
    name: "LITTLE",
    ar: "ليتل",
    category: "Baby / Kids",
    description: "قالب أطفال عربي pastel برسومات مرحة وحركات خفيفة وتجربة COD كاملة.",
    image: "/images/templates/little-v1.svg",
    accent: "#E86592",
  },
] as const;

export default function PreviewHubPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] px-4 py-8 text-[#1f2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">FlexiGo Preview Library</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">معاينة القوالب</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            هذه الصفحات للمعاينة فقط. بياناتها تجريبية، ولا يتم إنشاء طلب حقيقي من صفحات المعاينة.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article key={template.key} className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <StorefrontImage
                  src={template.image}
                  alt={template.name}
                  fill
                  sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-500">{template.category}</div>
                    <h2 className="mt-1 text-2xl font-black">{template.name} <span className="font-semibold text-slate-400">/ {template.ar}</span></h2>
                  </div>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: template.accent }} />
                </div>
                <p dir="rtl" className="mt-3 text-sm leading-7 text-slate-600">{template.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/preview/${template.key}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    الصفحة الرئيسية
                  </Link>
                  <Link
                    href={`/preview/${template.key}/produit`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold transition hover:bg-slate-50"
                  >
                    صفحة المنتج
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-8 text-center text-xs text-slate-500">
          FlexiGo — internal template QA
        </footer>
      </div>
    </main>
  );
}
