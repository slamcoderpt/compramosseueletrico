import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const cspParts = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.cal.com https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://app.cal.com https://*.supabase.co https://images.unsplash.com https://images.vexels.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.twilio.com https://app.cal.com https://api.cal.com",
  "frame-src 'self' https://app.cal.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
];

const nextConfig: NextConfig = {
  // Standalone output — required for lean Docker image (no full node_modules copy)
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.vexels.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value: cspParts.join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
