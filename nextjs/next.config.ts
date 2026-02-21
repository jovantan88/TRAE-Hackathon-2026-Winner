import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force module resolution to this app directory when multiple lockfiles exist.
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ejjtwvhduawyputemoob.supabase.co",
      },
    ],
  },
};

export default nextConfig;
