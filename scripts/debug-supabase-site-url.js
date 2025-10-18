#!/usr/bin/env node

/**
 * Script para debuggear el problema de Site URL en Supabase
 */

console.log('🔍 Debug: Problema de Site URL en Supabase\n')

console.log('❌ Problema actual:')
console.log('   - Vercel envía enlaces con: http://localhost:3000/?code=...')
console.log('   - Debería enviar: https://ecoswap-lilac.vercel.app/auth/callback?code=...&next=/auth/reset-password')
console.log('')

console.log('🔍 Posibles causas:\n')

console.log('1️⃣ SITE URL EN SUPABASE DASHBOARD:')
console.log('   📍 Ve a: https://supabase.com/dashboard')
console.log('   📍 Selecciona tu proyecto')
console.log('   📍 Ve a: Authentication > URL Configuration')
console.log('   📍 Busca la sección "Site URL" (no Redirect URLs)')
console.log('   📍 Debe estar configurada como: https://ecoswap-lilac.vercel.app')
console.log('   📍 NO debe ser: http://localhost:3000')
console.log('')

console.log('2️⃣ CACHÉ DE SUPABASE:')
console.log('   📍 Supabase puede tener caché de la configuración anterior')
console.log('   📍 Espera 5-10 minutos después de cambiar la Site URL')
console.log('   📍 O prueba con un email diferente')
console.log('')

console.log('3️⃣ CONFIGURACIÓN DE ENTORNO EN SUPABASE:')
console.log('   📍 Verifica que estés en el entorno correcto (Production)')
console.log('   📍 Algunos proyectos tienen múltiples entornos')
console.log('')

console.log('4️⃣ VARIABLE NEXT_PUBLIC_SITE_URL EN CÓDIGO:')
console.log('   📍 El código puede estar usando window.location.origin en lugar de la variable')
console.log('   📍 Esto haría que use localhost en desarrollo')
console.log('')

console.log('🔧 SOLUCIONES A PROBAR:\n')

console.log('1️⃣ VERIFICAR SITE URL EN SUPABASE:')
console.log('   - Ve a Supabase Dashboard > Authentication > URL Configuration')
console.log('   - Busca "Site URL" (no Redirect URLs)')
console.log('   - Debe ser: https://ecoswap-lilac.vercel.app')
console.log('   - Si está como localhost, cámbiala y guarda')
console.log('')

console.log('2️⃣ ESPERAR Y PROBAR:')
console.log('   - Espera 5-10 minutos después de cambiar')
console.log('   - Solicita un nuevo enlace de restablecimiento')
console.log('   - Usa un email diferente si es posible')
console.log('')

console.log('3️⃣ VERIFICAR CÓDIGO:')
console.log('   - Revisa que el código use process.env.NEXT_PUBLIC_SITE_URL')
console.log('   - No debe usar window.location.origin en producción')
console.log('')

console.log('4️⃣ SOLUCIÓN ALTERNATIVA - MODIFICAR CÓDIGO:')
console.log('   - Podemos modificar el código para forzar la URL correcta')
console.log('   - Usar lógica condicional para detectar el entorno')
console.log('')

console.log('🧪 CÓMO VERIFICAR LA CONFIGURACIÓN:\n')

console.log('1. Ve a Supabase Dashboard')
console.log('2. Authentication > URL Configuration')
console.log('3. Busca "Site URL" (debe estar separada de Redirect URLs)')
console.log('4. Verifica que sea: https://ecoswap-lilac.vercel.app')
console.log('5. Si no es así, cámbiala y guarda')
console.log('6. Espera 5-10 minutos')
console.log('7. Prueba con un nuevo enlace')
console.log('')

console.log('📊 CONFIGURACIÓN CORRECTA:\n')

console.log('Supabase Dashboard:')
console.log('   Site URL = https://ecoswap-lilac.vercel.app')
console.log('   Redirect URLs = Todas las URLs de callback configuradas')
console.log('')

console.log('Vercel Environment Variables:')
console.log('   NEXT_PUBLIC_SITE_URL = https://ecoswap-lilac.vercel.app')
console.log('')

console.log('🎯 PRÓXIMOS PASOS:\n')

console.log('1. Verifica la Site URL en Supabase Dashboard')
console.log('2. Si está correcta, espera 5-10 minutos')
console.log('3. Prueba con un nuevo enlace')
console.log('4. Si sigue fallando, podemos modificar el código')
console.log('')

console.log('💡 NOTA IMPORTANTE:')
console.log('   La Site URL en Supabase Dashboard es independiente de')
console.log('   las variables de entorno en Vercel. Ambas deben estar')
console.log('   configuradas correctamente para que funcione.')
