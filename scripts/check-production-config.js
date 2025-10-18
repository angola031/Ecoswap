#!/usr/bin/env node

/**
 * Script para verificar la configuración en producción
 * Específicamente para cuando las variables están en Vercel
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// En producción, las variables vienen de Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

console.log('🔍 Verificando configuración en producción\n')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
console.log('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || '❌ NO CONFIGURADA')
console.log('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ NO CONFIGURADA')
console.log('   - NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || 'No configurada')
console.log('   - VERCEL_URL:', process.env.VERCEL_URL || 'No configurada')
console.log('   - Site URL calculada:', siteUrl)

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ PROBLEMA: Variables de entorno faltantes')
    console.log('   - Verifica que las variables estén configuradas en Vercel')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL debe estar configurada')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY debe estar configurada')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSupabaseRedirectUrls() {
    console.log('\n🔗 Verificando URLs de redirección en Supabase...')
    
    // URLs que deberían estar configuradas en Supabase
    const expectedUrls = [
        `${siteUrl}/auth/callback`,
        `${siteUrl}/auth/reset-password`,
        `${siteUrl}/auth/auth-code-error`
    ]
    
    console.log('📋 URLs que deberían estar configuradas en Supabase:')
    expectedUrls.forEach(url => {
        console.log('   -', url)
    })
    
    console.log('\n💡 Para configurar en Supabase Dashboard:')
    console.log('   1. Ve a https://supabase.com/dashboard')
    console.log('   2. Selecciona tu proyecto')
    console.log('   3. Ve a Authentication > URL Configuration')
    console.log('   4. Agrega las URLs de arriba a "Redirect URLs"')
    console.log('   5. Guarda los cambios')
}

async function testPasswordResetFlow() {
    console.log('\n🧪 Probando flujo de restablecimiento...')
    
    const testEmail = 'test@example.com'
    const redirectUrl = `${siteUrl}/auth/callback?next=/auth/reset-password`
    
    console.log('📧 Email de prueba:', testEmail)
    console.log('🔗 URL de redirección:', redirectUrl)
    
    try {
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: testEmail,
            options: {
                redirectTo: redirectUrl
            }
        })
        
        if (error) {
            console.log('❌ Error generando enlace:', error.message)
            return false
        }
        
        console.log('✅ Enlace generado exitosamente')
        console.log('📧 Email enviado:', data.properties?.email_sent ? 'Sí' : 'No')
        
        if (data.properties?.action_link) {
            console.log('\n🔗 Enlace generado:')
            console.log('   ', data.properties.action_link)
            
            // Analizar el enlace
            const url = new URL(data.properties.action_link)
            console.log('\n📊 Análisis del enlace:')
            console.log('   - Dominio:', url.hostname)
            console.log('   - Path:', url.pathname)
            console.log('   - Parámetros:', url.searchParams.toString())
            
            // Verificar parámetros importantes
            const code = url.searchParams.get('code')
            const next = url.searchParams.get('next')
            const type = url.searchParams.get('type')
            
            console.log('   - Código presente:', code ? '✅' : '❌')
            console.log('   - Parámetro next:', next || 'No presente')
            console.log('   - Tipo:', type || 'No presente')
            
            if (next === '/auth/reset-password') {
                console.log('   ✅ Parámetro next configurado correctamente')
            } else {
                console.log('   ⚠️  Parámetro next no configurado o incorrecto')
            }
        }
        
        return true
        
    } catch (error) {
        console.log('❌ Error inesperado:', error.message)
        return false
    }
}

async function checkUserExists() {
    console.log('\n👤 Verificando usuarios en Supabase...')
    
    try {
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 })
        
        if (error) {
            console.log('❌ Error consultando usuarios:', error.message)
            return false
        }
        
        console.log('✅ Conexión a Supabase exitosa')
        console.log('👥 Total de usuarios:', data.total || 'No disponible')
        
        if (data.users && data.users.length > 0) {
            console.log('📋 Primeros usuarios:')
            data.users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} (${user.email_confirmed_at ? 'Confirmado' : 'No confirmado'})`)
            })
        }
        
        return true
        
    } catch (error) {
        console.log('❌ Error inesperado:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Verificación de configuración en producción\n')
    
    const supabaseOk = await checkSupabaseRedirectUrls()
    const usersOk = await checkUserExists()
    const flowOk = await testPasswordResetFlow()
    
    console.log('\n📊 Resumen de verificación:')
    console.log('   - Configuración Supabase:', supabaseOk ? '✅' : '❌')
    console.log('   - Usuarios:', usersOk ? '✅' : '❌')
    console.log('   - Flujo de reset:', flowOk ? '✅' : '❌')
    
    if (supabaseOk && usersOk && flowOk) {
        console.log('\n✅ ¡Configuración correcta!')
        console.log('   - El restablecimiento de contraseña debería funcionar')
        console.log('   - Verifica que las URLs estén configuradas en Supabase Dashboard')
    } else {
        console.log('\n❌ Problemas encontrados')
        console.log('   - Revisa la configuración en Supabase Dashboard')
        console.log('   - Verifica las variables de entorno en Vercel')
    }
    
    console.log('\n🔧 Pasos para solucionar:')
    console.log('   1. Configura las URLs de redirección en Supabase Dashboard')
    console.log('   2. Verifica que las variables estén en Vercel')
    console.log('   3. Prueba el flujo completo en producción')
    console.log('   4. Revisa los logs de Vercel para debugging')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error)
}

module.exports = { checkSupabaseRedirectUrls, testPasswordResetFlow, checkUserExists }
