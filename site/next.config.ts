import type { NextConfig } from "next";

const casas = ["barbearia", "salao", "estetica", "petshop", "academia", "contabilidade", "advocacia"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return casas.flatMap((slug) => [
      { source: `/casas/${slug}`, destination: `/casas/${slug}/index.html` },
      { source: `/casas/${slug}/:path*`, destination: `/casas/${slug}/:path*/index.html` },
    ]);
  },
};

export default nextConfig;
