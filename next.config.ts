import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is per-user and dynamic, so Cache Components' static shell buys
  // nothing here and would force Suspense around every session read (D-008).
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
