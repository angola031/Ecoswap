#!/usr/bin/env node

/**
 * Script para probar la nueva lógica mejorada de determinación de URL del sitio
 */

console.log('🧪 Probando la nueva lógica mejorada de URL del sitio...\n')

function testSiteUrlLogic(env, window) {
  // Simular la nueva lógica del código
  let siteUrl = 'https://ecoswap-lilac.vercel.app' // Valor por defecto para producción
  
  if (typeof window !== 'undefined') {
    const hostname = window.hostname
    const origin = window.origin
    
    // Si estamos en localhost, usar localhost
    if (hostname === 'localhost') {
      siteUrl = origin
    }
    // Si la variable de entorno está configurada y no es localhost, usarla
    else if (env.NEXT_PUBLIC_SITE_URL && !env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
      siteUrl = env.NEXT_PUBLIC_SITE_URL
    }
    // Si estamos en Vercel pero la variable no está configurada, usar el dominio actual
    else if (hostname.includes('vercel.app')) {
      siteUrl = origin
    }
  }
  
  return {
    siteUrl,
    envVar: env.NEXT_PUBLIC_SITE_URL,
    windowOrigin: window.origin,
    windowHostname: window.hostname,
    isLocalhost: window.hostname === 'localhost',
    isVercel: window.hostname.includes('vercel.app')
  }
}

const testCases = [
  {
    name: 'Caso 1: Localhost (desarrollo)',
    env: { NEXT_PUBLIC_SITE_URL: undefined },
    window: { hostname: 'localhost', origin: 'http://localhost:3000' },
    expected: 'http://localhost:3000'
  },
  {
    name: 'Caso 2: Vercel con variable de entorno correcta',
    env: { NEXT_PUBLIC_SITE_URL: 'https://ecoswap-lilac.vercel.app' },
    window: { hostname: 'ecoswap-lilac.vercel.app', origin: 'https://ecoswap-lilac.vercel.app' },
    expected: 'https://ecoswap-lilac.vercel.app'
  },
  {
    name: 'Caso 3: Vercel con variable de entorno incorrecta (localhost)',
    env: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
    window: { hostname: 'ecoswap-lilac.vercel.app', origin: 'https://ecoswap-lilac.vercel.app' },
    expected: 'https://ecoswap-lilac.vercel.app'
  },
  {
    name: 'Caso 4: Vercel sin variable de entorno',
    env: { NEXT_PUBLIC_SITE_URL: undefined },
    window: { hostname: 'ecoswap-lilac.vercel.app', origin: 'https://ecoswap-lilac.vercel.app' },
    expected: 'https://ecoswap-lilac.vercel.app'
  },
  {
    name: 'Caso 5: Vercel con variable de entorno vacía',
    env: { NEXT_PUBLIC_SITE_URL: '' },
    window: { hostname: 'ecoswap-lilac.vercel.app', origin: 'https://ecoswap-lilac.vercel.app' },
    expected: 'https://ecoswap-lilac.vercel.app'
  },
  {
    name: 'Caso 6: Dominio personalizado',
    env: { NEXT_PUBLIC_SITE_URL: 'https://mi-dominio.com' },
    window: { hostname: 'mi-dominio.com', origin: 'https://mi-dominio.com' },
    expected: 'https://mi-dominio.com'
  }
]

let passedTests = 0
let totalTests = testCases.length

testCases.forEach((testCase, index) => {
  console.log(`📋 ${testCase.name}`)
  console.log('─'.repeat(60))
  
  const result = testSiteUrlLogic(testCase.env, testCase.window)
  
  console.log(`   Variable de entorno: ${result.envVar || 'undefined'}`)
  console.log(`   window.location.hostname: ${result.windowHostname}`)
  console.log(`   window.location.origin: ${result.windowOrigin}`)
  console.log(`   Es localhost: ${result.isLocalhost}`)
  console.log(`   Es Vercel: ${result.isVercel}`)
  console.log(`   URL calculada: ${result.siteUrl}`)
  console.log(`   URL esperada: ${testCase.expected}`)
  
  const isCorrect = result.siteUrl === testCase.expected
  console.log(`   ✅ Resultado: ${isCorrect ? 'CORRECTO' : 'INCORRECTO'}`)
  
  if (isCorrect) {
    passedTests++
  } else {
    console.log(`   ❌ ERROR: Esperaba '${testCase.expected}' pero obtuve '${result.siteUrl}'`)
  }
  
  console.log('')
})

console.log('📊 RESUMEN DE PRUEBAS:')
console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`)
console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`)

if (passedTests === totalTests) {
  console.log('\n🎉 ¡Todas las pruebas pasaron! La nueva lógica debería funcionar correctamente.')
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisar la lógica.')
}

console.log('\n🔧 MEJORAS IMPLEMENTADAS:')
console.log('1. ✅ Valor por defecto robusto para producción')
console.log('2. ✅ Detección mejorada de localhost')
console.log('3. ✅ Validación de variable de entorno (no debe contener localhost)')
console.log('4. ✅ Fallback a dominio actual si estamos en Vercel')
console.log('5. ✅ Logging detallado para debugging')

console.log('\n🎯 PRÓXIMOS PASOS:')
console.log('1. Hacer commit y push de los cambios')
console.log('2. Esperar el despliegue en Vercel')
console.log('3. Probar el restablecimiento de contraseña')
console.log('4. Revisar los logs en la consola del navegador')
