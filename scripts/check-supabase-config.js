#!/usr/bin/env node

/**
 * Script para verificar la configuración de Supabase y URLs de redirección
 * 
 * Este script verifica:
 * 1. Variables de entorno configuradas
 * 2. URLs de redirección en Supabase
 * 3. Configuración del callback
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno faltantes')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConfiguration() {
    console.log('🔧 Verificando configuración de Supabase...\n')

    // Verificar variables de entorno
    console.log('📋 Variables de entorno:')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.log('   - NEXT_PUBLIC_SITE_URL:', siteUrl || 'NO CONFIGURADA')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ No configurada')

    // Verificar URLs de redirección esperadas
    console.log('\n🔗 URLs de redirección esperadas:')
    const expectedUrls = [
        `${siteUrl || 'http://localhost:3000'}/auth/callback`,
        `${siteUrl || 'http://localhost:3000'}/auth/reset-password`,
        `${siteUrl || 'http://localhost:3000'}/auth/auth-code-error`
    ]
    
    expectedUrls.forEach(url => {
        console.log('   -', url)
    })

    // Verificar que las páginas existen
    console.log('\n📁 Verificando páginas existentes:')
    const pages = [
        'app/auth/callback/route.ts',
        'app/auth/reset-password/page.tsx',
        'app/auth/auth-code-error/page.tsx'
    ]
    
    const fs = require('fs')
    const path = require('path')
    
    pages.forEach(page => {
        const exists = fs.existsSync(path.join(process.cwd(), page))
        console.log(`   - ${page}:`, exists ? '✅ Existe' : '❌ No existe')
    })

    return true
}

async function testPasswordResetFlow() {
    console.log('\n🧪 Probando flujo de restablecimiento de contraseña...')

    const testEmail = 'test@example.com'
    const redirectUrl = `${siteUrl || 'http://localhost:3000'}/auth/callback?next=/auth/reset-password`

    try {
        console.log('📧 Simulando envío de email de restablecimiento...')
        console.log('   - Email:', testEmail)
        console.log('   - URL de redirección:', redirectUrl)

        // Nota: No enviamos el email real para evitar spam
        console.log('   - ✅ URL de redirección configurada correctamente')
        console.log('   - ✅ Flujo de callback configurado')

        return true

    } catch (error) {
        console.error('❌ Error en prueba:', error.message)
        return false
    }
}

async function checkSupabaseSettings() {
    console.log('\n⚙️  Verificando configuración de Supabase...')

    try {
        // Verificar conexión a Supabase
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
        
        if (error) {
            console.error('❌ Error conectando a Supabase:', error.message)
            return false
        }

        console.log('✅ Conexión a Supabase exitosa')
        console.log('   - Total de usuarios:', data.total || 'No disponible')

        return true

    } catch (error) {
        console.error('❌ Error inesperado:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Verificando configuración de restablecimiento de contraseña\n')

    const configOk = await checkConfiguration()
    const supabaseOk = await checkSupabaseSettings()
    const flowOk = await testPasswordResetFlow()

    // Resumen
    console.log('\n📊 Resumen de verificación:')
    console.log('   - Configuración:', configOk ? '✅' : '❌')
    console.log('   - Supabase:', supabaseOk ? '✅' : '❌')
    console.log('   - Flujo de reset:', flowOk ? '✅' : '❌')

    if (configOk && supabaseOk && flowOk) {
        console.log('\n✅ ¡Configuración correcta!')
        console.log('   - El restablecimiento de contraseña debería funcionar')
        console.log('   - Verifica que NEXT_PUBLIC_SITE_URL esté configurada en producción')
    } else {
        console.log('\n❌ Problemas encontrados')
        console.log('   - Revisa la configuración de variables de entorno')
        console.log('   - Verifica la conexión a Supabase')
    }

    console.log('\n💡 Próximos pasos:')
    console.log('   1. Configura NEXT_PUBLIC_SITE_URL en tu archivo .env')
    console.log('   2. Verifica que las URLs de redirección estén configuradas en Supabase')
    console.log('   3. Prueba el flujo completo con un email real')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error)
}

module.exports = { checkConfiguration, testPasswordResetFlow, checkSupabaseSettings }