/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración experimental para manejar mejor los warnings
  experimental: {
    // Mejorar el manejo de errores
    errorOverlay: false, // Deshabilitar overlay de errores en producción
  },
  
  // Configuración de webpack para suprimir warnings específicos
  webpack: (config, { dev, isServer }) => {
    // En desarrollo, suprimir warnings específicos
    if (dev && !isServer) {
      config.infrastructureLogging = {
        level: 'error',
      }
      
      // Filtrar warnings específicos
      const originalWarn = config.infrastructureLogging?.warn
      if (originalWarn) {
        config.infrastructureLogging.warn = (message, ...args) => {
          const suppressedMessages = [
            'Extra attributes from the server:',
            'cz-shortcut-listen',
            'data-new-gr-c-s-check-loaded'
          ]
          
          const shouldSuppress = suppressedMessages.some(msg => 
            message.includes(msg)
          )
          
          if (!shouldSuppress) {
            originalWarn(message, ...args)
          }
        }
      }
    }
    
    return config
  },
  
  // Configuración de headers para mejorar la compatibilidad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Suprimir warnings de hidratación
          {
            key: 'X-Hydration-Warning',
            value: 'suppress',
          },
        ],
      },
    ]
  },
  
  // Configuración de redirección para manejar errores
  async redirects() {
    return []
  },
  
  // Configuración de rewrites
  async rewrites() {
    return []
  },
  
  // Configuración de compilación
  compiler: {
    // Eliminar console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración de imágenes
  images: {
    domains: ['images.unsplash.com', 'vaqdzualcteljmivtoka.supabase.co'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  
  // Configuración de trailingSlash
  trailingSlash: false,
  
  // Configuración de output
  output: 'standalone',
}

module.exports = nextConfig