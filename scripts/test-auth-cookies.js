#!/usr/bin/env node

/**
 * Script para probar autenticación y cookies
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔐 Probando autenticación y cookies...')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})

async function testAuth() {
    const email = 'c.angola@utp.edu.co'
    const password = 'admin123'
    
    console.log(`\n🔍 Probando login con: ${email}`)
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })
        
        if (error) {
            console.error('❌ Error de autenticación:', error.message)
            return
        }
        
        console.log('✅ Login exitoso!')
        console.log('👤 Usuario:', data.user?.email)
        console.log('🔑 Session:', data.session?.access_token?.substring(0, 30) + '...')
        
        // Verificar sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
            console.error('❌ Error obteniendo sesión:', sessionError.message)
        } else if (session) {
            console.log('✅ Sesión activa:', session.user?.email)
        } else {
            console.log('⚠️ No hay sesión activa')
        }
        
        // Verificar datos del usuario en la base de datos
        const { data: userData, error: userError } = await supabase
            .from('usuario')
            .select('es_admin, activo, nombre, apellido')
            .eq('email', email)
            .single()
        
        if (userError) {
            console.error('❌ Error obteniendo datos del usuario:', userError.message)
        } else {
            console.log('📊 Datos del usuario:', userData)
        }
        
    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
    }
}

testAuth()
