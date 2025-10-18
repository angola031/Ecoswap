#!/usr/bin/env node

/**
 * Script para probar el restablecimiento de contraseña con un email real
 * 
 * IMPORTANTE: Cambia el email de prueba por uno real antes de ejecutar
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno faltantes')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ⚠️ CAMBIA ESTE EMAIL POR UNO REAL PARA PROBAR
const TEST_EMAIL = 'tu-email@ejemplo.com'

async function testPasswordResetWithRealEmail() {
    console.log('🧪 Probando restablecimiento de contraseña con email real...\n')

    if (TEST_EMAIL === 'tu-email@ejemplo.com') {
        console.log('⚠️  IMPORTANTE: Cambia TEST_EMAIL por un email real antes de ejecutar')
        console.log('   - Edita el archivo y cambia la variable TEST_EMAIL')
        console.log('   - Usa un email que esté registrado en tu aplicación')
        return false
    }

    console.log('📧 Enviando email de restablecimiento a:', TEST_EMAIL)
    console.log('🔗 URL de redirección:', `${siteUrl}/auth/callback?next=/auth/reset-password`)

    try {
        // Usar el método admin para generar el enlace
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
            console.log('\n🔗 Enlace de restablecimiento:')
            console.log('   ', data.properties.action_link)
            
            console.log('\n📋 Instrucciones para probar:')
            console.log('   1. Revisa tu correo electrónico')
            console.log('   2. Haz clic en el enlace del email')
            console.log('   3. Deberías ser redirigido a la página de restablecimiento')
            console.log('   4. Establece una nueva contraseña')
        }

        return true

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function checkUserExists() {
    console.log('🔍 Verificando si el usuario existe...')

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
            return true
        } else {
            console.log('⚠️  Usuario no encontrado en Supabase Auth')
            console.log('   - Asegúrate de que el email esté registrado')
            console.log('   - O cambia TEST_EMAIL por un email registrado')
            return false
        }

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Prueba de restablecimiento de contraseña con email real\n')

    // Verificar configuración
    console.log('⚙️  Configuración:')
    console.log('   - Supabase URL:', supabaseUrl)
    console.log('   - Site URL:', siteUrl)
    console.log('   - Email de prueba:', TEST_EMAIL)

    if (TEST_EMAIL === 'tu-email@ejemplo.com') {
        console.log('\n❌ No se puede continuar sin un email real')
        console.log('   - Edita el archivo scripts/test-password-reset-real.js')
        console.log('   - Cambia TEST_EMAIL por un email registrado')
        return
    }

    // Verificar si el usuario existe
    const userExists = await checkUserExists()

    if (!userExists) {
        console.log('\n❌ No se puede continuar sin un usuario válido')
        return
    }

    // Probar envío de email
    const emailSent = await testPasswordResetWithRealEmail()

    // Resumen
    console.log('\n📊 Resumen de la prueba:')
    console.log('   - Usuario existe:', userExists ? '✅' : '❌')
    console.log('   - Email enviado:', emailSent ? '✅' : '❌')

    if (emailSent) {
        console.log('\n✅ ¡Prueba exitosa!')
        console.log('   - Revisa tu correo para el enlace de restablecimiento')
        console.log('   - Prueba hacer clic en el enlace')
        console.log('   - Verifica que funcione el flujo completo')
    } else {
        console.log('\n❌ Prueba fallida')
        console.log('   - Revisa la configuración de Supabase')
        console.log('   - Verifica las variables de entorno')
    }

    console.log('\n💡 Notas importantes:')
    console.log('   - Los enlaces expiran en 24 horas')
    console.log('   - Si el enlace expira, verás la página de error mejorada')
    console.log('   - Puedes solicitar un nuevo enlace desde el login')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error)
}

module.exports = { testPasswordResetWithRealEmail, checkUserExists }
