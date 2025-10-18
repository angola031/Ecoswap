#!/usr/bin/env node

/**
 * Script para verificar que las APIs de administración estén usando correctamente
 * el SUPABASE_SERVICE_ROLE_KEY de Vercel para operaciones de autenticación
 */

console.log('🔧 Verificando uso de Service Role Key en APIs de Admin...\n')

// Verificar que las APIs importen getSupabaseAdminClient
const fs = require('fs')
const path = require('path')

const adminAPIs = [
    'app/api/admin/roles/route.ts',
    'app/api/admin/roles/[adminId]/reactivate/route.ts',
    'app/api/auth/reset-password/route.ts'
]

console.log('📋 APIs de administración a verificar:')
adminAPIs.forEach(api => console.log(`   - ${api}`))
console.log()

let allCorrect = true

adminAPIs.forEach(apiPath => {
    const fullPath = path.join(process.cwd(), apiPath)
    
    if (!fs.existsSync(fullPath)) {
        console.log(`❌ ${apiPath}: Archivo no encontrado`)
        allCorrect = false
        return
    }
    
    const content = fs.readFileSync(fullPath, 'utf8')
    const apiName = apiPath.split('/').pop().replace('.ts', '')
    
    console.log(`🔍 Verificando ${apiPath}:`)
    
    // Verificar importación de getSupabaseAdminClient
    if (content.includes('getSupabaseAdminClient')) {
        console.log(`   ✅ Importa getSupabaseAdminClient`)
    } else {
        console.log(`   ❌ NO importa getSupabaseAdminClient`)
        allCorrect = false
    }
    
    // Verificar uso de getSupabaseAdminClient
    if (content.includes('getSupabaseAdminClient()')) {
        console.log(`   ✅ Usa getSupabaseAdminClient()`)
    } else {
        console.log(`   ❌ NO usa getSupabaseAdminClient()`)
        allCorrect = false
    }
    
    // Verificar que use resetPasswordForEmail con cliente admin
    if (content.includes('adminSupabase.auth.resetPasswordForEmail')) {
        console.log(`   ✅ Usa adminSupabase.auth.resetPasswordForEmail`)
    } else if (content.includes('supabase.auth.resetPasswordForEmail') && content.includes('getSupabaseAdminClient()')) {
        console.log(`   ✅ Usa supabase.auth.resetPasswordForEmail con cliente admin`)
    } else if (content.includes('supabase.auth.resetPasswordForEmail')) {
        console.log(`   ⚠️  Usa supabase.auth.resetPasswordForEmail (verificar si es cliente admin)`)
    } else {
        console.log(`   ℹ️  No usa resetPasswordForEmail`)
    }
    
    // Verificar logs de debugging
    if (content.includes('console.log') && content.includes('API')) {
        console.log(`   ✅ Incluye logs de debugging`)
    } else {
        console.log(`   ⚠️  Sin logs de debugging`)
    }
    
    console.log()
})

// Verificar configuración de Vercel
console.log('🌐 Verificando configuración de Vercel:')

const vercelEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

console.log('📋 Variables de entorno requeridas en Vercel:')
vercelEnvVars.forEach(envVar => {
    console.log(`   - ${envVar}`)
})

console.log('\n🔗 URLs de redirección configuradas:')
console.log('   - Usuarios normales: https://ecoswap-lilac.vercel.app/auth/supabase-redirect?type=recovery&next=/auth/reset-password')
console.log('   - Administradores: https://ecoswap-lilac.vercel.app/auth/supabase-redirect?type=recovery&next=/admin/verificaciones')

console.log('\n📝 Flujo esperado:')
console.log('1. Usuario solicita restablecimiento → API usa service role key')
console.log('2. Supabase envía email con enlace → supabase-redirect')
console.log('3. supabase-redirect establece sesión → redirige a reset-password')
console.log('4. Usuario establece nueva contraseña → redirige según tipo')

if (allCorrect) {
    console.log('\n✅ Todas las APIs están configuradas correctamente para usar Service Role Key')
    console.log('🎯 Las APIs de administración ahora usan SUPABASE_SERVICE_ROLE_KEY de Vercel')
} else {
    console.log('\n❌ Se encontraron problemas en la configuración')
    console.log('🔧 Revisa los archivos marcados con ❌ o ⚠️')
}

console.log('\n📞 Para probar:')
console.log('1. Ve a https://ecoswap-lilac.vercel.app/admin/verificaciones')
console.log('2. Reactiva un administrador inactivo')
console.log('3. Verifica que reciba el email con el enlace correcto')
console.log('4. Haz clic en el enlace y verifica que funcione el restablecimiento')

console.log('\n🔍 Logs esperados en Vercel:')
console.log('   - "🔧 API Reactivate Admin: Enviando email de reactivación..."')
console.log('   - "📧 API Reactivate Admin: Enviando email a: [email]"')
console.log('   - "🔗 API Reactivate Admin: URL de redirección: [url]"')
console.log('   - "✅ API Reactivate Admin: Email de reactivación enviado exitosamente"')
