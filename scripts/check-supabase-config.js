// Script para verificar la configuración de Supabase Auth
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Variables de entorno:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltante')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurado' : '❌ Faltante')

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Faltan variables de entorno necesarias')
    console.error('Verifica tu archivo .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSupabaseConfig() {
    console.log('\n🔍 Verificando configuración de Supabase...\n')

    try {
        // 1. Verificar conexión
        console.log('1. Verificando conexión...')
        const { data: health, error: healthError } = await supabase
            .from('usuario')
            .select('count')
            .limit(1)
        
        if (healthError) {
            console.error('❌ Error de conexión:', healthError.message)
        } else {
            console.log('✅ Conexión exitosa')
        }

        // 2. Verificar configuración de Auth
        console.log('\n2. Verificando configuración de Auth...')
        
        // Listar usuarios (para verificar permisos)
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
        
        if (usersError) {
            console.error('❌ Error listando usuarios:', usersError.message)
            console.error('Código:', usersError.status)
        } else {
            console.log(`✅ Permisos de admin OK (${users.users.length} usuarios encontrados)`)
        }

        // 3. Verificar configuración de email templates
        console.log('\n3. Verificando configuración de email...')
        
        // Intentar enviar un OTP de prueba
        const testEmail = 'test@example.com'
        console.log(`Enviando OTP de prueba a: ${testEmail}`)
        
        const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email: testEmail,
            password: 'test123'
        })

        if (otpError) {
            console.error('❌ Error en OTP:', otpError.message)
            console.error('Código:', otpError.status)
            console.error('Detalles:', otpError)
        } else {
            console.log('✅ OTP configurado correctamente')
            console.log('Link generado:', otpData.properties?.action_link)
        }

        // 4. Verificar configuración del proyecto
        console.log('\n4. Información del proyecto:')
        console.log('URL:', supabaseUrl)
        console.log('Service Key configurado:', supabaseServiceKey ? 'Sí' : 'No')

    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

checkSupabaseConfig()