#!/usr/bin/env node

/**
 * Script para probar el envío de emails al crear administradores
 * Simula la creación de un administrador y verifica el envío de email
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testAdminEmailCreation() {
    console.log('🧪 Probando envío de email al crear administrador...\n')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno no configuradas')
        return
    }
    
    console.log('✅ Variables de entorno configuradas')
    console.log('🔑 Usando:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Email de prueba (cambiar por uno real)
    const testEmail = 'test-admin@ejemplo.com'
    const redirectUrl = 'https://ecoswap-lilac.vercel.app/auth/supabase-redirect?type=recovery&next=/admin/verificaciones'
    
    console.log(`\n📧 Probando envío de email a: ${testEmail}`)
    console.log(`🔗 URL de redirección: ${redirectUrl}`)
    
    try {
        // 1. Verificar si el email ya existe en Supabase Auth
        console.log('\n📋 1. Verificando si el email ya existe en Supabase Auth...')
        
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
            console.log('⚠️  No se pudo verificar usuarios existentes (normal con anon key)')
            console.log('   Error:', listError.message)
        } else {
            const existingUser = existingUsers.users.find(user => user.email === testEmail)
            if (existingUser) {
                console.log('❌ El email ya existe en Supabase Auth')
                console.log('   ID:', existingUser.id)
                console.log('   Email confirmado:', existingUser.email_confirmed_at ? 'Sí' : 'No')
                console.log('   Creado:', existingUser.created_at)
                console.log('\n💡 Solución: Usar un email diferente o eliminar el usuario existente')
                return
            } else {
                console.log('✅ El email no existe en Supabase Auth')
            }
        }
        
        // 2. Intentar enviar email de reset de contraseña
        console.log('\n📋 2. Enviando email de reset de contraseña...')
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
            redirectTo: redirectUrl
        })
        
        if (error) {
            console.log('❌ Error enviando email:', error.message)
            console.log('   Código:', error.status)
            
            // Analizar el error
            if (error.message.includes('Invalid email')) {
                console.log('\n💡 Solución: Verificar formato del email')
            } else if (error.message.includes('Email rate limit')) {
                console.log('\n💡 Solución: Esperar antes de enviar otro email')
            } else if (error.message.includes('User not found')) {
                console.log('\n💡 Solución: El usuario debe existir en Supabase Auth primero')
            } else if (error.message.includes('Invalid redirect URL')) {
                console.log('\n💡 Solución: Verificar URLs de redirección en Supabase Dashboard')
            } else {
                console.log('\n💡 Solución: Revisar configuración de email en Supabase Dashboard')
            }
        } else {
            console.log('✅ Email enviado exitosamente')
            console.log('   Datos:', data)
        }
        
        // 3. Verificar configuración de Supabase
        console.log('\n📋 3. Verificaciones adicionales:')
        console.log('✅ Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'No configurada')
        console.log('✅ Supabase URL:', supabaseUrl)
        console.log('✅ Redirect URL:', redirectUrl)
        
        // 4. Recomendaciones
        console.log('\n📋 4. Recomendaciones:')
        
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.log('❌ Service Role Key no configurada')
            console.log('   - Agregar SUPABASE_SERVICE_ROLE_KEY a Vercel')
            console.log('   - O agregar a .env.local para desarrollo')
        }
        
        console.log('🔧 Verificar en Supabase Dashboard:')
        console.log('   - Authentication → Settings → Email')
        console.log('   - Authentication → URL Configuration')
        console.log('   - Logs para ver errores detallados')
        
        console.log('🔧 Verificar en Vercel Dashboard:')
        console.log('   - Functions → Logs')
        console.log('   - Environment Variables')
        
    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

// Función para probar con diferentes emails
async function testMultipleEmails() {
    console.log('\n🧪 Probando con múltiples emails...\n')
    
    const testEmails = [
        'test1@ejemplo.com',
        'test2@ejemplo.com',
        'admin-test@ejemplo.com'
    ]
    
    for (const email of testEmails) {
        console.log(`📧 Probando: ${email}`)
        // Aquí podrías llamar a la función de prueba para cada email
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testAdminEmailCreation()
}

module.exports = { testAdminEmailCreation, testMultipleEmails }
