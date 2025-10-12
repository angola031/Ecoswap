/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de imágenes
  images: {
    domains: ['images.unsplash.com', 'vaqdzualcteljmivtoka.supabase.co'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // React Strict Mode deshabilitado (puedes habilitarlo si lo necesitas)
  reactStrictMode: false,
  
  // Configuración de compilación
  compiler: {
    // Eliminar console.log en producción (excepto error y warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Configuración de webpack simplificada
  webpack: (config, { isServer }) => {
    // Suprimir warnings específicos
    config.ignoreWarnings = [
      /Extra attributes from the server/,
      /cz-shortcut-listen/,
      /data-new-gr-c-s-check-loaded/,
    ]
    
    return config
  },
  
  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuración de ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Remover header "X-Powered-By: Next.js"
  poweredByHeader: false,
}

module.exports = nextConfig