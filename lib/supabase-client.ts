
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
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.warn('⚠️ Variables de entorno de Supabase Admin no encontradas')
        return null
    }
    
    console.log('🔍 Creando cliente admin de Supabase')
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Exportar el cliente para compatibilidad
export const supabase = getSupabaseClient()