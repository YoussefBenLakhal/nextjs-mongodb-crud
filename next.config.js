/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove env section to prevent build-time environment variable baking
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
