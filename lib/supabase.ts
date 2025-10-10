import { createClient } from '@supabase/supabase-js'
import { withRetry } from './supabase-interceptor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: false, // Deshabilitar temporalmente para evitar rate limiting
        detectSessionInUrl: true,
        flowType: 'pkce', // Usar PKCE para mejor seguridad
        // Configuración muy conservadora para evitar rate limiting
        refreshTokenRetryInterval: 60000, // 60 segundos entre reintentos
        refreshTokenMaxRetries: 2, // Máximo 2 reintentos
        storage: {
            getItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    try {
                        return localStorage.getItem(key)
                    } catch (error) {
                        console.warn('Error reading from localStorage:', error)
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
                        console.warn('Error writing to localStorage:', error)
                    }
                }
            },
            removeItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.removeItem(key)
                    } catch (error) {
                        console.warn('Error removing from localStorage:', error)
                    }
                }
            }
        }
    },
    // Deshabilitar temporalmente realtime para evitar problemas de WebSocket
    // realtime: {
    //     params: {
    //         eventsPerSecond: 10
    //     }
    // },
    global: {
        headers: {
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
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
