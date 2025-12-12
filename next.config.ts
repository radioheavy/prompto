import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-7c0a7463d6c24d1bafdec3a1e227ec2c.r2.dev',
        pathname: '/**',
      },
    ],
  },
  // Tauri için gerekli
  assetPrefix: process.env.NODE_ENV === "production" ? "" : undefined,
};

export default nextConfig;
