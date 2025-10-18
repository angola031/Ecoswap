#!/usr/bin/env node

/**
 * Script para probar el restablecimiento de contraseña desde el cliente
 * Este script simula lo que hace el navegador
 */

console.log('🧪 Probando restablecimiento de contraseña desde el cliente...\n')

// Simular el entorno del navegador
const mockWindow = {
  location: {
    hostname: 'ecoswap-lilac.vercel.app',
    origin: 'https://ecoswap-lilac.vercel.app'
  }
}

// Simular process.env (en el navegador, las variables NEXT_PUBLIC_ están disponibles)
const mockProcess = {
  env: {
    NEXT_PUBLIC_SITE_URL: undefined, // Simular que no está configurada
    NODE_ENV: 'production'
  }
}

console.log('📋 Simulando entorno del navegador:')
console.log(`   window.location.hostname: ${mockWindow.location.hostname}`)
console.log(`   window.location.origin: ${mockWindow.location.origin}`)
console.log(`   process.env.NEXT_PUBLIC_SITE_URL: ${mockProcess.env.NEXT_PUBLIC_SITE_URL}`)
console.log(`   NODE_ENV: ${mockProcess.env.NODE_ENV}`)
console.log('')

// Simular la lógica actual del código
function simulateClientLogic() {
  // Lógica actual del AuthModule.tsx
  const siteUrl = 'https://ecoswap-lilac.vercel.app'
  
  console.log('🔗 URL de redirección configurada:', `${siteUrl}/auth/callback?next=/auth/reset-password`)
  console.log('🔍 Configuración Vercel:', {
    siteUrl: siteUrl,
    isVercel: true
  })
  
  return siteUrl
}

const result = simulateClientLogic()

console.log('\n📊 Resultado:')
console.log(`✅ URL final: ${result}`)
console.log(`✅ Es correcta: ${result === 'https://ecoswap-lilac.vercel.app'}`)

if (result === 'https://ecoswap-lilac.vercel.app') {
  console.log('\n🎉 La lógica del cliente es correcta!')
  console.log('💡 El problema podría ser:')
  console.log('   1. El código no se ha desplegado aún en Vercel')
  console.log('   2. Hay cache del navegador')
  console.log('   3. El usuario está probando desde localhost')
  console.log('   4. Hay algún otro lugar en el código que esté enviando localhost')
} else {
  console.log('\n❌ La lógica del cliente tiene problemas!')
}

console.log('\n🔍 Para verificar en el navegador:')
console.log('1. Ve a https://ecoswap-lilac.vercel.app/login')
console.log('2. Abre DevTools → Console')
console.log('3. Haz clic en "¿Olvidaste tu contraseña?"')
console.log('4. Revisa los logs en la consola')
console.log('5. Verifica que muestre:')
console.log('   🔗 URL de redirección configurada: https://ecoswap-lilac.vercel.app/auth/callback?next=/auth/reset-password')
console.log('   🔍 Configuración Vercel: { siteUrl: "https://ecoswap-lilac.vercel.app", isVercel: true }')

console.log('\n🚨 Si sigue mostrando localhost:')
console.log('1. Verifica que estés en https://ecoswap-lilac.vercel.app (no localhost)')
console.log('2. Haz Ctrl+F5 para refrescar sin cache')
console.log('3. Espera 2-3 minutos para que Vercel termine el despliegue')
console.log('4. Revisa si hay otros archivos que puedan estar enviando localhost')

console.log('\n🔧 Comandos para verificar:')
console.log('1. Verificar despliegue: git log --oneline -5')
console.log('2. Verificar que no hay localhost: grep -r "localhost" components/')
console.log('3. Verificar variables de entorno en Vercel Dashboard')

