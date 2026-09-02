import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (Coolify).
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // The Prisma client is generated into src/generated and loads a .wasm
  // file at runtime. Make sure the tracer copies it into the standalone
  // output.
  outputFileTracingIncludes: {
    "/**": ["./src/generated/prisma/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Cross-origin isolation so the background-removal worker can use
          // SharedArrayBuffer (multi-threaded WASM). "credentialless" keeps
          // third-party scripts (Clerk) loading without CORP headers.
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
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

export default nextConfig;
