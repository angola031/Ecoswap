#!/usr/bin/env node

/**
 * Script simple para probar la redirección local
 * Sin necesidad de variables de entorno
 */

console.log('🔍 Verificando configuración local de redirección\n')

// Verificar que las páginas existen
const fs = require('fs')
const path = require('path')

const pages = [
    'app/auth/callback/route.ts',
    'app/auth/reset-password/page.tsx',
    'app/auth/auth-code-error/page.tsx'
]

console.log('📁 Verificando páginas existentes:')
let allPagesExist = true

pages.forEach(page => {
    const exists = fs.existsSync(path.join(process.cwd(), page))
    console.log(`   - ${page}:`, exists ? '✅ Existe' : '❌ No existe')
    if (!exists) allPagesExist = false
})

if (allPagesExist) {
    console.log('\n✅ Todas las páginas necesarias existen')
} else {
    console.log('\n❌ Faltan páginas necesarias')
}

// Verificar el contenido del callback
console.log('\n🔍 Verificando callback...')
try {
    const callbackPath = path.join(process.cwd(), 'app/auth/callback/route.ts')
    const callbackContent = fs.readFileSync(callbackPath, 'utf8')
    
    const hasLogging = callbackContent.includes('console.log')
    const hasNextParam = callbackContent.includes('next')
    const hasRedirect = callbackContent.includes('NextResponse.redirect')
    
    console.log('   - Logging presente:', hasLogging ? '✅' : '❌')
    console.log('   - Parámetro next:', hasNextParam ? '✅' : '❌')
    console.log('   - Redirección:', hasRedirect ? '✅' : '❌')
    
    if (hasLogging && hasNextParam && hasRedirect) {
        console.log('   ✅ Callback configurado correctamente')
    } else {
        console.log('   ❌ Callback no está configurado correctamente')
    }
} catch (error) {
    console.log('   ❌ Error leyendo callback:', error.message)
}

// Verificar AuthModule
console.log('\n🔍 Verificando AuthModule...')
try {
    const authModulePath = path.join(process.cwd(), 'components/auth/AuthModule.tsx')
    const authModuleContent = fs.readFileSync(authModulePath, 'utf8')
    
    const hasResetPassword = authModuleContent.includes('resetPasswordForEmail')
    const hasRedirectTo = authModuleContent.includes('redirectTo')
    const hasCallback = authModuleContent.includes('/auth/callback')
    
    console.log('   - resetPasswordForEmail:', hasResetPassword ? '✅' : '❌')
    console.log('   - redirectTo configurado:', hasRedirectTo ? '✅' : '❌')
    console.log('   - Callback en URL:', hasCallback ? '✅' : '❌')
    
    if (hasResetPassword && hasRedirectTo && hasCallback) {
        console.log('   ✅ AuthModule configurado correctamente')
    } else {
        console.log('   ❌ AuthModule no está configurado correctamente')
    }
} catch (error) {
    console.log('   ❌ Error leyendo AuthModule:', error.message)
}

console.log('\n📋 URLs que deberían estar configuradas en Supabase:')
console.log('   - http://localhost:3000/auth/callback')
console.log('   - http://localhost:3000/auth/reset-password')
console.log('   - http://localhost:3000/auth/auth-code-error')

console.log('\n💡 Próximos pasos:')
console.log('   1. Configura las URLs de redirección en Supabase Dashboard')
console.log('   2. Verifica que las variables de entorno estén en Vercel')
console.log('   3. Prueba el flujo completo')
console.log('   4. Revisa los logs del servidor para debugging')

console.log('\n🔧 Para configurar en Supabase:')
console.log('   1. Ve a https://supabase.com/dashboard')
console.log('   2. Selecciona tu proyecto')
console.log('   3. Ve a Authentication > URL Configuration')
console.log('   4. Agrega las URLs de arriba a "Redirect URLs"')
console.log('   5. Configura Site URL como http://localhost:3000')
console.log('   6. Guarda los cambios')
