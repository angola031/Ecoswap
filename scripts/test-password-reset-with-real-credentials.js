#!/usr/bin/env node

/**
 * Script para probar el restablecimiento de contraseña con credenciales reales
 */

const { createClient } = require('@supabase/supabase-js')

// Credenciales reales de Supabase
const supabaseUrl = 'https://vaqdzualcteljmivtoka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWR6dWFsY3RlbGptaXZ0b2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk4MzMsImV4cCI6MjA3MjQzNTgzM30.crB_eVlezZGyqm0Iw_JCQXQKnDj2JFNdRUD16pOJoTo'
const siteUrl = 'https://ecoswap-lilac.vercel.app'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const TEST_EMAIL = 'angola03bitcoin@gmail.com'

async function checkUserExists() {
    console.log('🔍 Verificando si el usuario existe...')
    console.log('📧 Email:', TEST_EMAIL)
    console.log('🔗 Supabase URL:', supabaseUrl)

    try {
        // Usar la API pública para verificar si el usuario existe
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: 'test-password-that-should-fail'
        })

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                console.log('✅ Usuario existe (credenciales inválidas es esperado)')
                return true
            } else if (error.message.includes('Email not confirmed')) {
                console.log('✅ Usuario existe pero email no confirmado')
                return true
            } else {
                console.log('❌ Error verificando usuario:', error.message)
                return false
            }
        } else {
            console.log('✅ Usuario existe y credenciales válidas')
            return true
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
        const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
            redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`
        })

        if (error) {
            console.error('❌ Error enviando email:', error.message)
            return false
        }

        console.log('✅ Email de restablecimiento enviado exitosamente')
        console.log('📧 Respuesta:', data)

        return true

    } catch (error) {
        console.error('💥 Error inesperado:', error.message)
        return false
    }
}

async function testWithAdminAPI() {
    console.log('\n🔧 Probando con API de administración...')
    
    // Nota: Necesitaríamos la service role key para usar la API de admin
    // Por ahora, probamos con la API pública
    console.log('⚠️  Para usar la API de administración necesitaríamos la SUPABASE_SERVICE_ROLE_KEY')
    console.log('   Por ahora probamos con la API pública')
}

async function main() {
    console.log('🚀 Prueba de restablecimiento de contraseña con credenciales reales\n')

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
        
        console.log('\n🔍 Verifica que el enlace sea:')
        console.log('   https://ecoswap-lilac.vercel.app/auth/callback?code=TOKEN&next=/auth/reset-password')
        console.log('   Y NO:')
        console.log('   http://localhost:3000/?code=TOKEN')
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
