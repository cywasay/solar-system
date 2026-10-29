import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/*
 * Content-Security-Policy.
 *
 * A nonce-based "strict" policy would force every page to render dynamically (the Next.js
 * CSP guide says so), which would throw away the statically generated planet pages. So
 * this is a static policy, and it is honest about what it does and doesn't cover:
 *
 *   - 'unsafe-inline' for scripts is required by Next's own inline bootstrap scripts, and
 *     for styles by styled-jsx / React inline `style` props. That means this CSP does NOT
 *     stop an injected inline <script>; the site's real XSS defence is that it renders no
 *     user-supplied HTML (React escapes everything, and emails are escaped by hand).
 *   - What it does enforce: no scripts/styles/frames/objects from other origins, no
 *     clickjacking (frame-ancestors), no <base> hijacking, forms only post to this origin.
 *   - 'unsafe-eval' is development-only (React's dev tooling needs it).
 *
 * Everything the site loads is same-origin: next/font self-hosts its fonts, textures live
 * in /public, and Vercel Speed Insights loads and reports through /_vercel/.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // data: covers the admin avatar (stored as a data URL); blob: covers three.js textures.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // One year, no includeSubDomains: this app doesn't know what else lives on the domain.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Redundant with frame-ancestors, but older browsers only understand this one.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework on every response.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Admin API responses carry private data — never let a cache keep them.
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        // The admin console is not for search engines.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
