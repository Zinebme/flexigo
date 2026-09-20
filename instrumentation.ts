/**
 * Next.js instrumentation hook.
 *
 * Only one thing is registered here: when the dev server is started with
 * `FLEXIGO_PREVIEW=1`, an in-memory Supabase double is installed so reviewers
 * can browse the SOUQ storefront without credentials
 * (see lib/preview/souq-demo.ts and docs/SOUQ_TEMPLATE.md).
 *
 * Without that environment variable — i.e. every production deployment — this
 * hook does nothing at all.
 */
export async function register(): Promise<void> {
  if (process.env.FLEXIGO_PREVIEW !== "1") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { installSouqPreview } = await import("./lib/preview/souq-demo");
  installSouqPreview();
}
