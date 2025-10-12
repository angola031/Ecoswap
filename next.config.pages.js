const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración experimental para desarrollo local
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: [],
  },
  
  // Configuración para Cloudflare Pages - usar export para archivos estáticos
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // Configuración para suprimir warnings de hidratación de extensiones del navegador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Configuración para build estático - excluir rutas API
  distDir: 'out',
  
  // Configuración de imágenes
  images: {
    unoptimized: true, // Necesario para export estático
    domains: ['images.unsplash.com', 'vaqdzualcteljmivtoka.supabase.co'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuración para evitar problemas de hidratación
  reactStrictMode: false,
  
  // Configuración de webpack
  webpack: (config, { dev, isServer }) => {
    // Configuración para resolver problemas de case sensitivity
    config.resolve = {
      ...config.resolve,
      symlinks: false,
      cacheWithContext: false,
    }
    
    // Configuración para exportación estática
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      }
    }
    
    // Configuración específica para evitar problemas de ActionQueueContext
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/navigation': path.resolve(__dirname, 'lib/router-fallback.ts'),
      'next/link': path.resolve(__dirname, 'lib/link-fallback.tsx'),
    }
    
    // Suprimir warnings específicos
    config.ignoreWarnings = [
      /Extra attributes from the server/,
      /cz-shortcut-listen/,
      /data-new-gr-c-s-check-loaded/,
      /RedirectErrorBoundary/,
      /NotFoundErrorBoundary/,
      /DevRootNotFoundBoundary/,
      /There are multiple modules with names that only differ in casing/,
      /Use equal casing/,
      /Cannot read properties of null/,
      /useReducer/,
      /Missing ActionQueueContext/,
      /Invariant: Missing ActionQueueContext/,
      /An error occurred during hydration/,
      /useReducerWithReduxDevtoolsImpl/,
      /ActionQueueContext/,
      /useReducerWithReduxDevtoolsImpl/,
      /Router/,
      /app-router/,
      /hydration/,
      /hydrating/,
      /server HTML was replaced/
    ]
    
    return config
  },
  
  // Configuración de compilación
  compiler: {
    // Eliminar console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración para build estático
  generateBuildId: async () => {
    return 'build-' + Date.now()
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
}

module.exports = nextConfig
