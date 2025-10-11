// Configuración de la aplicación
export const config = {
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceRoleKey: typeof window === 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY! : null,
    },
    app: {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        name: 'EcoSwap Colombia',
    },
    auth: {
        sessionKey: 'ecoswap_user',
        passwordMinLength: 6,
        saltRounds: 12,
    },
}

// Validar que las variables de entorno requeridas estén configuradas
export function validateConfig() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    // Solo validar SUPABASE_SERVICE_ROLE_KEY en el servidor
    if (typeof window === 'undefined') {
        required.push('SUPABASE_SERVICE_ROLE_KEY')
    }

    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `Variables de entorno faltantes: ${missing.join(', ')}\n` +
            'Por favor, configura el archivo .env.local con las credenciales de Supabase.'
        )
    }
}

// Validar configuración al importar el módulo (solo si no estamos en modo estático)
if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Solo validar en el servidor si hay configuración de Supabase
    try {
        validateConfig()
    } catch (error) {
        console.warn('⚠️ Configuración de Supabase incompleta. Ejecutando en modo estático.')
    }
}
