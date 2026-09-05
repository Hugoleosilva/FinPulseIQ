import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O driver do MongoDB traz dependências opcionais nativas que não devem
  // passar pelo bundler. Mantê-lo externo evita avisos de build.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
