// Script de diagnóstico específico para localhost
const { createClient } = require('@supabase/supabase-js')

async function debugLocalhost() {
    console.log('🔍 Diagnóstico de localhost...')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('📋 Variables de entorno:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Faltante')
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'undefined')
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno faltantes')
        return
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    try {
        // Probar conexión básica
        console.log('🔌 Probando conexión a Supabase desde localhost...')
        const { data, error } = await supabase.from('usuario').select('count').limit(1)
        
        if (error) {
            console.error('❌ Error de conexión:', error.message)
            console.error('   Código:', error.code)
            console.error('   Detalles:', error.details)
        } else {
            console.log('✅ Conexión exitosa a Supabase desde localhost')
        }
        
        // Probar autenticación
        console.log('🔐 Probando autenticación...')
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'test@test.com',
            password: 'test123'
        })
        
        if (authError) {
            console.log('⚠️ Error de autenticación (esperado):', authError.message)
        } else {
            console.log('✅ Autenticación funcionando')
        }
        
    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
    }
}

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })
debugLocalhost().catch(console.error)












