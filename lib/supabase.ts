import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
            getItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    return localStorage.getItem(key)
                }
                return null
            },
            setItem: (key: string, value: string) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(key, value)
                }
            },
            removeItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(key)
                }
            }
        }
    },
    global: {
        headers: {
            'Referrer-Policy': 'strict-origin-when-cross-origin'
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
