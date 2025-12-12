import type { NextConfig } from "next";

// TAURI_ENV varsa static export yap (desktop app için)
// Yoksa SSR mode (web deployment için - API routes çalışsın)
const isTauri = process.env.TAURI_ENV === "true";

const nextConfig: NextConfig = {
  // Sadece Tauri build'de static export
  ...(isTauri ? { output: "export", distDir: "out" } : {}),
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
  assetPrefix: isTauri ? "" : undefined,
};

export default nextConfig;
