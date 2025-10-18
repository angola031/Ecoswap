#!/usr/bin/env node

/**
 * Script para probar el restablecimiento de contraseña con el email específico
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ecoswap-lilac.vercel.app'

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno faltantes')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TEST_EMAIL = 'angola03bitcoin@gmail.com'

async function checkUserExists() {
    console.log('🔍 Verificando si el usuario existe...')
    console.log('📧 Email:', TEST_EMAIL)

    try {
        const { data, error } = await supabase.auth.admin.listUsers()

        if (error) {
            console.error('❌ Error consultando usuarios:', error.message)
            return false
        }

        const user = data.users.find(u => u.email === TEST_EMAIL)
        
        if (user) {
            console.log('✅ Usuario encontrado:')
            console.log('   - ID:', user.id)
            console.log('   - Email:', user.email)
            console.log('   - Email confirmado:', user.email_confirmed_at ? 'Sí' : 'No')
            console.log('   - Último sign in:', user.last_sign_in_at || 'Nunca')
            console.log('   - Creado:', user.created_at)
            return true
        } else {
            console.log('⚠️  Usuario no encontrado en Supabase Auth')
            console.log('   - El email no está registrado en la aplicación')
            console.log('   - Necesitas registrarte primero en https://ecoswap-lilac.vercel.app')
            return false
        }

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function testPasswordReset() {
    console.log('\n🧪 Probando restablecimiento de contraseña...')
    console.log('📧 Email:', TEST_EMAIL)
    console.log('🔗 URL de redirección:', `${siteUrl}/auth/callback?next=/auth/reset-password`)

    try {
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: TEST_EMAIL,
            options: {
                redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`
            }
        })

        if (error) {
            console.error('❌ Error generando enlace:', error.message)
            return false
        }

        console.log('✅ Enlace generado exitosamente')
        console.log('📧 Email enviado:', data.properties?.email_sent ? 'Sí' : 'No')

        if (data.properties?.action_link) {
            console.log('\n🔗 Enlace de restablecimiento generado:')
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

            // Verificar que el dominio sea correcto
            if (url.hostname === 'ecoswap-lilac.vercel.app') {
                console.log('   ✅ Dominio correcto (Vercel)')
            } else if (url.hostname === 'localhost') {
                console.log('   ⚠️  Dominio es localhost (puede ser problema)')
            } else {
                console.log('   ❌ Dominio inesperado:', url.hostname)
            }
        }

        return true

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Prueba de restablecimiento de contraseña para angola03bitcoin@gmail.com\n')

    // Verificar configuración
    console.log('⚙️  Configuración:')
    console.log('   - Supabase URL:', supabaseUrl)
    console.log('   - Site URL:', siteUrl)
    console.log('   - Email de prueba:', TEST_EMAIL)

    // Verificar si el usuario existe
    const userExists = await checkUserExists()

    if (!userExists) {
        console.log('\n❌ No se puede continuar sin un usuario válido')
        console.log('💡 Solución:')
        console.log('   1. Ve a https://ecoswap-lilac.vercel.app')
        console.log('   2. Regístrate con el email angola03bitcoin@gmail.com')
        console.log('   3. Confirma tu email')
        console.log('   4. Ejecuta este script nuevamente')
        return
    }

    // Probar envío de email
    const emailSent = await testPasswordReset()

    // Resumen
    console.log('\n📊 Resumen de la prueba:')
    console.log('   - Usuario existe:', userExists ? '✅' : '❌')
    console.log('   - Email enviado:', emailSent ? '✅' : '❌')

    if (emailSent) {
        console.log('\n✅ ¡Prueba exitosa!')
        console.log('   - Revisa tu correo (angola03bitcoin@gmail.com)')
        console.log('   - Busca el email de restablecimiento de contraseña')
        console.log('   - Haz clic en el enlace del email')
        console.log('   - Verifica que te redirija a la página de restablecimiento')
        console.log('   - Establece una nueva contraseña')
    } else {
        console.log('\n❌ Prueba fallida')
        console.log('   - Revisa la configuración de Supabase')
        console.log('   - Verifica las variables de entorno')
    }

    console.log('\n💡 Notas importantes:')
    console.log('   - Los enlaces expiran en 24 horas')
    console.log('   - Si el enlace expira, verás la página de error mejorada')
    console.log('   - Puedes solicitar un nuevo enlace desde el login')
    console.log('   - Revisa la carpeta de spam si no recibes el email')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error)
}

module.exports = { testPasswordReset, checkUserExists }
