import type { NextConfig } from "next";

/**
 * FlexiGo — Next.js configuration.
 *
 * - `output: "standalone"` enables a minimal, portable build output for Docker
 *   deployment (Hostinger VPS, any Linux host). It does not affect Vercel.
 * - Security headers are set globally here; storefront routes add a dynamic,
 *   provider-aware Content-Security-Policy in the store layout (see
 *   app/(storefront)/s/[slug]/layout.tsx).
 */
const config: NextConfig = {
  output: "standalone",
  // Development only: Next blocks /_next/* requests coming from an origin other
  // than the dev server's own host. Hosted preview sandboxes serve the app
  // through a proxied domain, so that host is allowed here. This has no effect
  // on a production build.
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    // Development preview only: the sandbox has no outbound network, so the
    // image optimizer cannot fetch remote demo photos — serve them straight to
    // the browser instead. Production keeps the optimizer (value false/absent).
    unoptimized: process.env.FLEXIGO_PREVIEW === "1",
    // Product / banner images live in the Supabase public bucket; demo data
    // uses picsum.photos. Hostname patterns are allow-listed, never user input.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default config;
