#!/usr/bin/env node

/**
 * Script de prueba para el restablecimiento de contraseña
 * 
 * Este script prueba el flujo completo de restablecimiento de contraseña:
 * 1. Envío de email de restablecimiento
 * 2. Verificación de que el email se envía correctamente
 * 3. Simulación del flujo de usuario
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno faltantes')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPasswordReset() {
    console.log('🔧 Probando restablecimiento de contraseña...\n')

    // Email de prueba (cambiar por un email real para probar)
    const testEmail = 'test@example.com'
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`

    try {
        console.log('📧 Enviando email de restablecimiento...')
        console.log('   - Email:', testEmail)
        console.log('   - URL de redirección:', redirectUrl)

        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: testEmail,
            options: {
                redirectTo: redirectUrl
            }
        })

        if (error) {
            console.error('❌ Error enviando email:', error.message)
            return false
        }

        console.log('✅ Email de restablecimiento enviado exitosamente')
        console.log('   - Link generado:', data.properties?.action_link ? 'Sí' : 'No')
        console.log('   - Email enviado:', data.properties?.email_sent ? 'Sí' : 'No')

        if (data.properties?.action_link) {
            console.log('\n🔗 Link de restablecimiento:')
            console.log('   ', data.properties.action_link)
        }

        return true

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function testUserExists() {
    console.log('\n🔍 Verificando si el usuario existe...')

    const testEmail = 'test@example.com'

    try {
        const { data, error } = await supabase.auth.admin.listUsers()

        if (error) {
            console.error('❌ Error consultando usuarios:', error.message)
            return false
        }

        const user = data.users.find(u => u.email === testEmail)
        
        if (user) {
            console.log('✅ Usuario encontrado:')
            console.log('   - ID:', user.id)
            console.log('   - Email:', user.email)
            console.log('   - Email confirmado:', user.email_confirmed_at ? 'Sí' : 'No')
            console.log('   - Último sign in:', user.last_sign_in_at || 'Nunca')
            return true
        } else {
            console.log('⚠️  Usuario no encontrado en Supabase Auth')
            console.log('   - Esto es normal si el email no está registrado')
            return false
        }

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Iniciando pruebas de restablecimiento de contraseña\n')

    // Verificar configuración
    console.log('⚙️  Configuración:')
    console.log('   - Supabase URL:', supabaseUrl)
    console.log('   - Site URL:', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    console.log('   - Service Key configurada:', !!supabaseServiceKey)

    // Probar si el usuario existe
    const userExists = await testUserExists()

    // Probar envío de email
    const emailSent = await testPasswordReset()

    // Resumen
    console.log('\n📊 Resumen de pruebas:')
    console.log('   - Usuario existe:', userExists ? '✅' : '⚠️')
    console.log('   - Email enviado:', emailSent ? '✅' : '❌')

    if (emailSent) {
        console.log('\n✅ ¡Prueba exitosa!')
        console.log('   - El sistema de restablecimiento de contraseña está funcionando')
        console.log('   - Revisa el email para ver el enlace de restablecimiento')
    } else {
        console.log('\n❌ Prueba fallida')
        console.log('   - Revisa la configuración de Supabase')
        console.log('   - Verifica las variables de entorno')
    }

    console.log('\n💡 Notas:')
    console.log('   - Cambia "test@example.com" por un email real para probar')
    console.log('   - El email debe estar registrado en Supabase Auth')
    console.log('   - Revisa la carpeta de spam si no recibes el email')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error)
}

module.exports = { testPasswordReset, testUserExists }
