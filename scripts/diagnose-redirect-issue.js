#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de redirección en restablecimiento de contraseña
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

console.log('🔍 Diagnóstico de problemas de redirección\n')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
console.log('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || '❌ NO CONFIGURADA')
console.log('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ NO CONFIGURADA')
console.log('   - NEXT_PUBLIC_SITE_URL:', siteUrl)

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ PROBLEMA: Variables de entorno faltantes')
    console.log('   - Crea un archivo .env.local con las credenciales de Supabase')
    console.log('   - O configura las variables de entorno en tu sistema')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRedirectConfiguration() {
    console.log('\n🔗 Verificando configuración de redirección...')
    
    const redirectUrl = `${siteUrl}/auth/callback?next=/auth/reset-password`
    console.log('   - URL de redirección configurada:', redirectUrl)
    
    // Verificar que las páginas existen
    const fs = require('fs')
    const path = require('path')
    
    const pages = [
        'app/auth/callback/route.ts',
        'app/auth/reset-password/page.tsx',
        'app/auth/auth-code-error/page.tsx'
    ]
    
    console.log('\n📁 Verificando páginas existentes:')
    pages.forEach(page => {
        const exists = fs.existsSync(path.join(process.cwd(), page))
        console.log(`   - ${page}:`, exists ? '✅ Existe' : '❌ No existe')
    })
}

async function testSupabaseConnection() {
    console.log('\n🔌 Verificando conexión a Supabase...')
    
    try {
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
        
        if (error) {
            console.log('   ❌ Error conectando a Supabase:', error.message)
            return false
        }
        
        console.log('   ✅ Conexión a Supabase exitosa')
        return true
        
    } catch (error) {
        console.log('   ❌ Error inesperado:', error.message)
        return false
    }
}

async function generateTestLink() {
    console.log('\n🧪 Generando enlace de prueba...')
    
    const testEmail = 'test@example.com'
    const redirectUrl = `${siteUrl}/auth/callback?next=/auth/reset-password`
    
    try {
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: testEmail,
            options: {
                redirectTo: redirectUrl
            }
        })
        
        if (error) {
            console.log('   ❌ Error generando enlace:', error.message)
            return false
        }
        
        console.log('   ✅ Enlace generado exitosamente')
        console.log('   📧 Email enviado:', data.properties?.email_sent ? 'Sí' : 'No')
        
        if (data.properties?.action_link) {
            console.log('\n🔗 Enlace de prueba generado:')
            console.log('   ', data.properties.action_link)
            
            // Analizar el enlace
            const url = new URL(data.properties.action_link)
            console.log('\n📊 Análisis del enlace:')
            console.log('   - Dominio:', url.hostname)
            console.log('   - Path:', url.pathname)
            console.log('   - Parámetros:', url.searchParams.toString())
            
            // Verificar si el enlace tiene el parámetro 'next'
            const nextParam = url.searchParams.get('next')
            console.log('   - Parámetro next:', nextParam || 'No presente')
            
            if (nextParam === '/auth/reset-password') {
                console.log('   ✅ Parámetro next configurado correctamente')
            } else {
                console.log('   ⚠️  Parámetro next no configurado o incorrecto')
            }
        }
        
        return true
        
    } catch (error) {
        console.log('   ❌ Error inesperado:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Iniciando diagnóstico de redirección\n')
    
    const configOk = await testRedirectConfiguration()
    const supabaseOk = await testSupabaseConnection()
    const linkOk = await generateTestLink()
    
    console.log('\n📊 Resumen del diagnóstico:')
    console.log('   - Configuración:', configOk ? '✅' : '❌')
    console.log('   - Supabase:', supabaseOk ? '✅' : '❌')
    console.log('   - Enlace de prueba:', linkOk ? '✅' : '❌')
    
    if (configOk && supabaseOk && linkOk) {
        console.log('\n✅ ¡Configuración correcta!')
        console.log('   - El restablecimiento de contraseña debería funcionar')
        console.log('   - Revisa los logs del servidor para ver el flujo de redirección')
    } else {
        console.log('\n❌ Problemas encontrados')
        console.log('   - Revisa la configuración de variables de entorno')
        console.log('   - Verifica la conexión a Supabase')
    }
    
    console.log('\n💡 Próximos pasos:')
    console.log('   1. Configura las variables de entorno si no están configuradas')
    console.log('   2. Verifica que las URLs de redirección estén configuradas en Supabase')
    console.log('   3. Prueba el flujo completo con un email real')
    console.log('   4. Revisa los logs del servidor para ver el flujo de redirección')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error)
}

module.exports = { testRedirectConfiguration, testSupabaseConnection, generateTestLink }
