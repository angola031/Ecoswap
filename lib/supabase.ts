import { isCloudflareEnvironment, shouldApplyDevConfig } from './environment'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase Config:')
console.log('🔍 NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl, supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined')
console.log('🔍 NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey, supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'undefined')

// Verificar si tenemos configuración de Supabase
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variables de entorno de Supabase no encontradas. La aplicación funcionará en modo estático.')
    console.warn('⚠️ Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
} else {
    console.log('✅ Variables de entorno de Supabase encontradas')
}

// Configuración específica para Cloudflare
const isCloudflare = isCloudflareEnvironment()
const isDev = shouldApplyDevConfig()

// Crear cliente de Supabase solo si tenemos configuración
let supabaseClient = null

if (supabaseUrl && supabaseAnonKey) {
    console.log('🔍 Creando cliente de Supabase...')
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: isCloudflare ? true : false, // Habilitar en Cloudflare, deshabilitar en desarrollo
            detectSessionInUrl: true,
            flowType: 'pkce', // Usar PKCE para mejor seguridad
            // Configuración ajustada según el entorno
            // refreshTokenRetryInterval y refreshTokenMaxRetries no están disponibles en esta versión
            storage: {
                getItem: (key: string) => {
                    if (typeof window !== 'undefined') {
                        try {
                            return localStorage.getItem(key)
                        } catch (error) {
                            if (isDev) {
                                console.warn('Error reading from localStorage:', error)
                            }
                            return null
                        }
                    }
                    return null
                },
                setItem: (key: string, value: string) => {
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.setItem(key, value)
                        } catch (error) {
                            if (isDev) {
                                console.warn('Error writing to localStorage:', error)
                            }
                        }
                    }
                },
                removeItem: (key: string) => {
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.removeItem(key)
                        } catch (error) {
                            if (isDev) {
                                console.warn('Error removing from localStorage:', error)
                            }
                        }
                    }
                }
            }
        },
        // Habilitar realtime solo en producción/Cloudflare
        ...(isCloudflare ? {
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        } : {}),
        global: {
            headers: {
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                ...(isDev ? {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                } : {
                    'Cache-Control': 'public, max-age=3600'
                })
            }
        }
    })
    console.log('✅ Cliente de Supabase creado exitosamente')
} else {
    console.log('❌ Cliente de Supabase no creado - variables de entorno faltantes')
}

export const supabase = supabaseClient

// Cliente para operaciones del lado del servidor (con service role key)
// Solo disponible en el servidor, no en el cliente
export const supabaseAdmin = typeof window === 'undefined' && supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null
