
import { createClient } from '@supabase/supabase-js'

// Cliente singleton de Supabase para evitar múltiples instancias
let supabaseClient: any = null

export const getSupabaseClient = () => {
    if (supabaseClient) {
        return supabaseClient
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Variables de entorno de Supabase no encontradas')
        return null
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    })
    
    return supabaseClient
}

// Cliente para operaciones administrativas (con service role key)
// Solo disponible en el servidor, no en el cliente
export const getSupabaseAdminClient = () => {
    if (typeof window !== 'undefined') {
        console.warn('⚠️ getSupabaseAdminClient solo debe usarse en el servidor')
        return null
    }
    
    // Solo permitir uso del Service Role en Vercel (evita uso local)
    const isVercel = !!process.env.VERCEL
    if (!isVercel) {
        // No exponer ni permitir el uso del Service Role fuera de Vercel
        console.log('ℹ️ Service Role deshabilitado fuera de Vercel (modo local)')
        return null
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl) {
        console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL no encontrada')
        return null
    }
    
    if (!supabaseServiceRoleKey) {
        console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY no configurada en Vercel')
        return null
    }
    
    console.log('🔧 Creando cliente admin de Supabase (Vercel/Producción)')
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Exportar el cliente para compatibilidad
export const supabase = getSupabaseClient()