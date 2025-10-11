
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
    
    console.log('🔍 Creando cliente singleton de Supabase')
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

// Exportar el cliente para compatibilidad
export const supabase = getSupabaseClient()