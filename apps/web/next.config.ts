import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only the Tailwind entry needs its loader; CSS Modules use Next.js directly.
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
