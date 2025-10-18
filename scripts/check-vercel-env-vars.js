#!/usr/bin/env node

/**
 * Script para verificar las variables de entorno en Vercel
 * Este script simula lo que sucede en el navegador cuando se ejecuta el código
 */

console.log('🔍 Verificando variables de entorno para Vercel...\n')

// Simular diferentes escenarios
const scenarios = [
  {
    name: 'Escenario 1: Variable de entorno configurada correctamente',
    env: {
      NEXT_PUBLIC_SITE_URL: 'https://ecoswap-lilac.vercel.app',
      NODE_ENV: 'production'
    },
    window: {
      hostname: 'ecoswap-lilac.vercel.app',
      origin: 'https://ecoswap-lilac.vercel.app'
    }
  },
  {
    name: 'Escenario 2: Variable de entorno NO configurada (problema actual)',
    env: {
      NEXT_PUBLIC_SITE_URL: undefined,
      NODE_ENV: 'production'
    },
    window: {
      hostname: 'ecoswap-lilac.vercel.app',
      origin: 'https://ecoswap-lilac.vercel.app'
    }
  },
  {
    name: 'Escenario 3: Variable de entorno vacía',
    env: {
      NEXT_PUBLIC_SITE_URL: '',
      NODE_ENV: 'production'
    },
    window: {
      hostname: 'ecoswap-lilac.vercel.app',
      origin: 'https://ecoswap-lilac.vercel.app'
    }
  },
  {
    name: 'Escenario 4: Variable de entorno con valor incorrecto',
    env: {
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NODE_ENV: 'production'
    },
    window: {
      hostname: 'ecoswap-lilac.vercel.app',
      origin: 'https://ecoswap-lilac.vercel.app'
    }
  }
]

function simulateSiteUrlLogic(env, window) {
  // Simular la lógica actual del código
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 
    (window.hostname === 'localhost' 
      ? window.origin 
      : 'https://ecoswap-lilac.vercel.app')
  
  return {
    siteUrl,
    envVar: env.NEXT_PUBLIC_SITE_URL,
    windowOrigin: window.origin,
    windowHostname: window.hostname,
    isLocalhost: window.hostname === 'localhost'
  }
}

scenarios.forEach((scenario, index) => {
  console.log(`📋 ${scenario.name}`)
  console.log('─'.repeat(60))
  
  const result = simulateSiteUrlLogic(scenario.env, scenario.window)
  
  console.log(`   Variable de entorno: ${result.envVar || 'undefined'}`)
  console.log(`   window.location.hostname: ${result.windowHostname}`)
  console.log(`   window.location.origin: ${result.windowOrigin}`)
  console.log(`   Es localhost: ${result.isLocalhost}`)
  console.log(`   URL final calculada: ${result.siteUrl}`)
  
  // Verificar si el resultado es correcto
  const isCorrect = result.siteUrl === 'https://ecoswap-lilac.vercel.app'
  console.log(`   ✅ Resultado correcto: ${isCorrect ? 'SÍ' : 'NO'}`)
  
  if (!isCorrect) {
    console.log(`   ❌ PROBLEMA: Debería ser 'https://ecoswap-lilac.vercel.app'`)
  }
  
  console.log('')
})

console.log('🔧 SOLUCIONES RECOMENDADAS:\n')

console.log('1. Verificar en Vercel Dashboard:')
console.log('   - Ve a tu proyecto en Vercel')
console.log('   - Settings → Environment Variables')
console.log('   - Asegúrate de que NEXT_PUBLIC_SITE_URL esté configurada como:')
console.log('     https://ecoswap-lilac.vercel.app')
console.log('')

console.log('2. Si la variable está configurada pero sigue fallando:')
console.log('   - Hacer redeploy del proyecto')
console.log('   - Verificar que la variable esté en el entorno correcto (Production)')
console.log('')

console.log('3. Alternativa: Modificar el código para ser más explícito:')
console.log('   - Cambiar la lógica para detectar mejor el entorno de producción')
console.log('   - Usar NODE_ENV para determinar el entorno')
console.log('')

console.log('4. Verificar en el navegador:')
console.log('   - Abrir DevTools → Console')
console.log('   - Ejecutar: console.log(process.env.NEXT_PUBLIC_SITE_URL)')
console.log('   - Verificar que muestre la URL correcta')
console.log('')

console.log('🎯 PRÓXIMOS PASOS:')
console.log('1. Verificar la configuración en Vercel Dashboard')
console.log('2. Hacer redeploy si es necesario')
console.log('3. Probar el restablecimiento de contraseña nuevamente')
console.log('4. Revisar los logs en la consola del navegador')
