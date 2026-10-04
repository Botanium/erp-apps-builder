import type { NextConfig } from "next";
const config: NextConfig = {
  distDir:
    process.env.SHOP_E2E_MODE === "true"
      ? ".next-e2e"
      : process.env.SHOP_QA_MODE === "true"
        ? ".next-qa"
        : ".next",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  outputFileTracingExcludes: {
    "/*": [
      "./.env",
      "./.env.*",
      "./.local/**/*",
      "./output/**/*",
      "./tests/**/*",
      "./.next-qa/**/*",
      "./.next-e2e/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default config;
