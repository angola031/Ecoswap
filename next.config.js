/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de imágenes
  images: {
    domains: ['localhost', 'vaqdzualcteljmivtoka.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Variables de entorno personalizadas
  env: {
    CUSTOM_KEY: 'ecoswap-colombia',
  },
  
  // Configuración de redirecciones
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/admin/verificaciones',
        permanent: true,
      },
    ]
  },
  
  // Configuración de headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Optimizaciones
  compress: true,
  poweredByHeader: false,
  
  // Configuración experimental
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
}

module.exports = nextConfig
