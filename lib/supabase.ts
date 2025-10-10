import { createClient } from '@supabase/supabase-js'
import { withRetry } from './supabase-interceptor'
import { isCloudflareEnvironment, shouldApplyDevConfig } from './environment'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Configuración específica para Cloudflare
const isCloudflare = isCloudflareEnvironment()
const isDev = shouldApplyDevConfig()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Cliente para operaciones del lado del servidor (con service role key)
// Solo disponible en el servidor, no en el cliente
export const supabaseAdmin = typeof window === 'undefined'
    ? createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null
