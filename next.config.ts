import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for serverless
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
