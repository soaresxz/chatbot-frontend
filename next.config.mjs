/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',           // ← ESSENCIAL para Railway
  experimental: {
    serverExternalPackages: [],   // vazio por enquanto
  },
}

export default nextConfig