/**
 * FlexiGo — proxy (Next 16; replaces middleware.ts, Node.js runtime only).
 *
 * Responsibilities:
 *  1. TENANT RESOLUTION — a request arriving on a store's custom domain is
 *     resolved via `domains` (verified only) and rewritten to /s/[slug],
 *     so the whole storefront is served from one codebase (no per-tenant
 *     deployments). The platform host serves everything as-is.
 *  2. CONTENT SECURITY POLICY — strict headers per area. The storefront
 *     allows inline styles/scripts (RSC flight + Tailwind) but nothing
 *     else; there is no merchant-injected JS anywhere.
 *
 * This file runs on the SERVER (Node runtime). It never exposes secrets.
 */
import { NextResponse, type NextRequest } from "next/server";
import { resolveStoreByHost } from "./lib/storefront/resolve";

const PLATFORM_HOSTS = new Set(
  (process.env.FLEXIGO_PLATFORM_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

/** Paths that always belong to the platform, never to a tenant. */
const PLATFORM_PATHS = /^\/(admin|dashboard|api|login|register|auth)(\/|$)/;

const STOREFRONT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const DASHBOARD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Preview harness (development only): the hosted preview embeds the app in a
 * frame, so framing is allowed for that run instead of being denied.
 */
const STOREFRONT_CSP_PREVIEW = STOREFRONT_CSP.replace("frame-ancestors 'none'", "frame-ancestors *");

function storefrontCsp(): string {
  return process.env.FLEXIGO_PREVIEW === "1" ? STOREFRONT_CSP_PREVIEW : STOREFRONT_CSP;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname } = request.nextUrl;

  // Preview harness (development only, FLEXIGO_PREVIEW=1): opening the preview
  // URL lands on the SOUQ demo storefront instead of the platform landing page.
  if (process.env.FLEXIGO_PREVIEW === "1" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/s/souq-plus";
    return NextResponse.redirect(url);
  }

  // 1. Platform paths always pass through (dashboard, admin, api, auth).
  if (PLATFORM_PATHS.test(pathname) || pathname.startsWith("/_next") || host === "") {
    const res = NextResponse.next();
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      res.headers.set("Content-Security-Policy", DASHBOARD_CSP);
    }
    return res;
  }

  // 2. Already a /s/[slug] path on the platform host → pass through.
  if (pathname.startsWith("/s/")) {
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", storefrontCsp());
    return res;
  }

  // 3. Platform host root → platform landing (brand page).
  const isPlatformHost =
    PLATFORM_HOSTS.has(host) ||
    (process.env.NODE_ENV === "development" && !host.includes(".")) ||
    // Hosted dev preview domain, when the preview harness is enabled.
    (process.env.FLEXIGO_PREVIEW === "1" && host.endsWith(".e2b.app"));
  if (isPlatformHost) {
    return NextResponse.next();
  }

  // 4. Custom domain → resolve tenant.
  let store: { slug: string } | null = null;
  try {
    store = await resolveStoreByHost(host);
  } catch {
    store = null; // DB unreachable: fail closed for unknown hosts
  }
  if (!store) {
    return new NextResponse("Domaine inconnu.", { status: 404 });
  }
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/s/${store.slug}` : `/s/${store.slug}${pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("Content-Security-Policy", storefrontCsp());
  return res;
}

export const config = {
  // Skip Next's static files and assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};

export default proxy;
