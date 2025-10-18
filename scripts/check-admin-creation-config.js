#!/usr/bin/env node

/**
 * Script para verificar la configuración actual del sistema de creación de administradores
 */

console.log('🔧 Verificando configuración del sistema de creación de administradores...\n')

// Verificar variables de entorno
console.log('📋 VERIFICACIÓN DE VARIABLES DE ENTORNO:')
console.log()

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL'
]

let envStatus = {
    configured: 0,
    missing: 0,
    details: []
}

requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    if (value) {
        envStatus.configured++
        envStatus.details.push(`✅ ${envVar}: Configurada`)
    } else {
        envStatus.missing++
        envStatus.details.push(`❌ ${envVar}: NO configurada`)
    }
})

envStatus.details.forEach(detail => console.log(detail))
console.log()

console.log(`📊 RESUMEN: ${envStatus.configured}/${requiredEnvVars.length} variables configuradas`)
if (envStatus.missing > 0) {
    console.log(`❌ FALTAN ${envStatus.missing} variables de entorno`)
} else {
    console.log('✅ Todas las variables de entorno están configuradas')
}
console.log()

// Verificar configuración específica
console.log('🔍 CONFIGURACIÓN ESPECÍFICA:')
console.log()

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log(`✅ Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
} else {
    console.log('❌ Supabase URL: NO configurada')
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Service Role Key: Configurada')
    console.log(`   Longitud: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length} caracteres`)
    console.log(`   Inicia con: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...`)
} else {
    console.log('❌ Service Role Key: NO configurada')
    console.log('   ⚠️  ESTE ES EL PROBLEMA MÁS PROBABLE')
}

if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log(`✅ Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`)
} else {
    console.log('❌ Site URL: NO configurada')
}
console.log()

// Verificar configuración de Supabase
console.log('🔧 CONFIGURACIÓN REQUERIDA EN SUPABASE:')
console.log()

console.log('1. 📧 EMAIL CONFIGURATION:')
console.log('   - Ve a: Authentication → Emails')
console.log('   - Verifica que "Enable email confirmations" esté activado')
console.log('   - Verifica que "Enable email change confirmations" esté activado')
console.log()

console.log('2. 🔗 URL CONFIGURATION:')
console.log('   - Ve a: Authentication → URL Configuration')
console.log('   - Site URL debe ser: https://ecoswap-lilac.vercel.app')
console.log('   - Redirect URLs debe incluir:')
console.log('     * https://ecoswap-lilac.vercel.app/auth/supabase-redirect')
console.log('     * https://ecoswap-lilac.vercel.app/auth/callback')
console.log('     * https://ecoswap-lilac.vercel.app/auth/reset-password')
console.log()

console.log('3. 👥 USERS EXISTENTES:')
console.log('   - En la imagen veo estos emails:')
console.log('     * ecoswap03@gmail.com')
console.log('     * angola03@gmail.com')
console.log('     * angola03bitcoin@gmail.com')
console.log('     * carlingen70@gmail.com')
console.log('   - NO uses ninguno de estos emails para crear administradores')
console.log()

// Verificar configuración de Vercel
console.log('🚀 CONFIGURACIÓN REQUERIDA EN VERCEL:')
console.log()

console.log('1. 🔑 ENVIRONMENT VARIABLES:')
console.log('   - Ve a: Vercel Dashboard → Settings → Environment Variables')
console.log('   - Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada')
console.log('   - Verifica que no tenga espacios o caracteres extra')
console.log('   - Si no está, cópiala desde Supabase Dashboard → Settings → API')
console.log()

console.log('2. 📊 FUNCTIONS LOGS:')
console.log('   - Ve a: Vercel Dashboard → Functions')
console.log('   - Busca la función que maneja /api/admin/roles')
console.log('   - Revisa los logs para ver errores específicos')
console.log()

// Diagnóstico específico
console.log('🔍 DIAGNÓSTICO ESPECÍFICO:')
console.log()

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ PROBLEMA PRINCIPAL: Service Role Key no configurada')
    console.log('   - Sin esta clave, no se puede crear el cliente admin')
    console.log('   - Sin cliente admin, no se puede enviar emails')
    console.log('   - Sin emails, no se puede configurar la contraseña')
    console.log()
    console.log('🛠️  SOLUCIÓN:')
    console.log('   1. Ve a Supabase Dashboard → Settings → API')
    console.log('   2. Copia la "service_role" key')
    console.log('   3. Ve a Vercel Dashboard → Settings → Environment Variables')
    console.log('   4. Agrega SUPABASE_SERVICE_ROLE_KEY con el valor copiado')
    console.log('   5. Redespliega la aplicación')
    console.log()
} else {
    console.log('✅ Service Role Key está configurada')
    console.log('   - El problema puede ser otro')
    console.log('   - Verificar logs en Vercel para más detalles')
    console.log()
}

// Prueba específica
console.log('🧪 PRUEBA ESPECÍFICA:')
console.log()

const testEmail = `test-admin-${Date.now()}@ejemplo.com`
console.log(`1. 📧 Usar email único: ${testEmail}`)
console.log('2. 🔍 Crear administrador con este email')
console.log('3. 📊 Verificar logs en Vercel')
console.log('4. ✅ Verificar que aparezca en Supabase Auth → Users')
console.log()

// URLs útiles
console.log('🔗 URLs ÚTILES:')
console.log('- Dashboard Admin: https://ecoswap-lilac.vercel.app/admin/verificaciones')
console.log('- Supabase Auth Users: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/users')
console.log('- Supabase Auth Emails: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/emails')
console.log('- Supabase URL Config: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/url-configuration')
console.log('- Vercel Dashboard: https://vercel.com/dashboard')
console.log()

// Resumen final
console.log('📋 RESUMEN FINAL:')
console.log()

if (envStatus.missing > 0) {
    console.log('❌ PROBLEMA: Variables de entorno faltantes')
    console.log('   - Configurar SUPABASE_SERVICE_ROLE_KEY en Vercel')
    console.log('   - Redesplegar la aplicación')
} else {
    console.log('✅ CONFIGURACIÓN: Variables de entorno OK')
    console.log('   - Verificar logs en Vercel para más detalles')
    console.log('   - Usar email único para pruebas')
}

console.log()
console.log('💡 SIGUIENTE PASO:')
console.log('1. Verificar Service Role Key en Vercel')
console.log('2. Probar con email único')
console.log('3. Revisar logs en Vercel')
console.log('4. Verificar configuración de email en Supabase')
