// Configuración robusta de variables de entorno para Vercel y desarrollo local

function getEnvConfig() {
  // Variables de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Variables de la aplicación
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  const vercelEnv = process.env.VERCEL_ENV || 'development'

  // Verificar si estamos en Vercel
  const isVercel = !!process.env.VERCEL
  const isProduction = vercelEnv === 'production'
  const isPreview = vercelEnv === 'preview'
  const isDevelopment = vercelEnv === 'development'

  return {
    // Supabase
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey,
      hasValidConfig: !!(supabaseUrl && supabaseAnonKey)
    },
    
    // Aplicación
    app: {
      url: appUrl,
      vercelEnv,
      isVercel,
      isProduction,
      isPreview,
      isDevelopment
    },
    
    // Debug info
    debug: {
      allEnvVars: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || 
        key.includes('NEXT_PUBLIC') || 
        key.includes('VERCEL')
      ),
      missingVars: []
    }
  }
}

// Función para validar la configuración
function validateConfig() {
  const config = getEnvConfig()
  const errors = []
  const warnings = []

  // Verificar variables críticas
  if (!config.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL no está configurada')
  }
  
  if (!config.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
  }

  // Verificar variables opcionales
  if (!config.supabase.serviceKey) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY no está configurada (opcional para desarrollo)')
  }

  if (!config.app.url) {
    warnings.push('NEXT_PUBLIC_APP_URL no está configurada')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  }
}

// Función para obtener configuración de Supabase
function getSupabaseConfig() {
  const config = getEnvConfig()
  
  if (!config.supabase.hasValidConfig) {
    throw new Error('Configuración de Supabase incompleta. Verifica las variables de entorno.')
  }

  return {
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
    serviceKey: config.supabase.serviceKey
  }
}

module.exports = {
  getEnvConfig,
  validateConfig,
  getSupabaseConfig
}
