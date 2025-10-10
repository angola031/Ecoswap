/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración experimental para manejar mejor los warnings
  experimental: {
    // Configuración para static export
    esmExternals: 'loose',
  },
  
  // Configuración para build estático
  // output: 'export', // Comentado para usar next export
  
  // Configuración de trailingSlash para Cloudflare
  trailingSlash: true,
  
  // Configuración para build estático
  distDir: 'out',
  
  // Configuración de imágenes para export estático
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'vaqdzualcteljmivtoka.supabase.co'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuración de compilación
  compiler: {
    // Eliminar console.log en producción
    removeConsole: true,
  },
  
  // Configuración de TypeScript
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: false,
  },
  
  // Configuración de ESLint
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: false,
  },
  
  // Configuración de poweredByHeader
  poweredByHeader: false,
  
  // Configuración para ignorar rutas API durante el build estático
  async rewrites() {
    return []
  },
  
  // Configuración para excluir rutas API del build estático
  async generateStaticParams() {
    return []
  },
}

module.exports = nextConfig
