#!/usr/bin/env node

/**
 * Script para diagnosticar el error 303 de Supabase
 */

console.log('🔍 Diagnóstico del Error 303 de Supabase\n')

console.log('❌ Error identificado: GET/auth/v1/verify 303')
console.log('📋 Este error indica que Supabase está intentando verificar el token pero está siendo redirigido incorrectamente.\n')

console.log('🔍 Causas posibles:')
console.log('   1. URLs de redirección no configuradas en Supabase Dashboard')
console.log('   2. Site URL incorrecta en la configuración de Supabase')
console.log('   3. Mismatch entre las URLs configuradas y las que se están usando\n')

console.log('✅ Solución paso a paso:\n')

console.log('1️⃣ CONFIGURAR URLs DE REDIRECCIÓN EN SUPABASE DASHBOARD:')
console.log('   📍 Ve a: https://supabase.com/dashboard')
console.log('   📍 Selecciona tu proyecto')
console.log('   📍 Ve a: Authentication > URL Configuration')
console.log('   📍 En "Redirect URLs", agrega estas URLs exactas:')
console.log('')
console.log('   Para Desarrollo Local:')
console.log('   - http://localhost:3000/auth/callback')
console.log('   - http://localhost:3000/auth/reset-password')
console.log('   - http://localhost:3000/auth/auth-code-error')
console.log('')
console.log('   Para Producción (Vercel):')
console.log('   - https://tu-dominio.vercel.app/auth/callback')
console.log('   - https://tu-dominio.vercel.app/auth/reset-password')
console.log('   - https://tu-dominio.vercel.app/auth/auth-code-error')
console.log('')

console.log('2️⃣ CONFIGURAR SITE URL:')
console.log('   📍 En la sección "Site URL":')
console.log('   - Desarrollo: http://localhost:3000')
console.log('   - Producción: https://tu-dominio.vercel.app')
console.log('')

console.log('3️⃣ VERIFICAR VARIABLES DE ENTORNO EN VERCEL:')
console.log('   📍 Asegúrate de que estas variables estén configuradas:')
console.log('   - NEXT_PUBLIC_SUPABASE_URL')
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('   - SUPABASE_SERVICE_ROLE_KEY')
console.log('   - NEXT_PUBLIC_SITE_URL')
console.log('')

console.log('4️⃣ GUARDAR CAMBIOS:')
console.log('   📍 Haz clic en "Save" en Supabase Dashboard')
console.log('   📍 Espera unos segundos para que se apliquen los cambios')
console.log('')

console.log('🧪 CÓMO PROBAR LA SOLUCIÓN:')
console.log('   1. Configura las URLs en Supabase Dashboard (paso crítico)')
console.log('   2. Reinicia el servidor de desarrollo')
console.log('   3. Prueba el restablecimiento de contraseña')
console.log('   4. Revisa los logs del servidor para ver el flujo')
console.log('')

console.log('📊 FLUJO CORRECTO DESPUÉS DE LA CONFIGURACIÓN:')
console.log('   1. Usuario solicita restablecimiento de contraseña')
console.log('   2. Supabase envía email con enlace a: /auth/callback?code=TOKEN&next=/auth/reset-password')
console.log('   3. Supabase verifica el token (sin error 303)')
console.log('   4. Callback procesa el token y redirige a: /auth/reset-password')
console.log('   5. Usuario establece nueva contraseña')
console.log('')

console.log('⚠️ ERRORES COMUNES:')
console.log('   ❌ URLs sin protocolo: localhost:3000/auth/callback')
console.log('   ❌ URLs con barra final: http://localhost:3000/auth/callback/')
console.log('   ❌ URLs con espacios: http://localhost:3000/auth/callback ')
console.log('   ✅ URL correcta: http://localhost:3000/auth/callback')
console.log('')

console.log('🔧 VERIFICACIÓN ADICIONAL:')
console.log('   - Revisa los logs de Vercel para ver el error completo')
console.log('   - Confirma que las variables de entorno estén configuradas')
console.log('   - Prueba con un enlace nuevo (los enlaces viejos pueden estar corruptos)')
console.log('')

console.log('✅ ESTADO DESPUÉS DE LA CONFIGURACIÓN:')
console.log('   - Error 303 desaparecerá')
console.log('   - Redirección funcionará correctamente')
console.log('   - Restablecimiento de contraseña funcionará')
console.log('   - Logs mostrarán el flujo correcto')
console.log('')

console.log('📞 SI SIGUES TENIENDO PROBLEMAS:')
console.log('   1. Revisa los logs de Vercel para el error completo')
console.log('   2. Verifica que las URLs estén configuradas exactamente')
console.log('   3. Confirma que las variables de entorno estén en Vercel')
console.log('   4. Prueba con un email registrado en tu aplicación')
console.log('   5. Genera un nuevo enlace de restablecimiento')
console.log('')

console.log('🎯 RESUMEN:')
console.log('   El error 303 se soluciona configurando las URLs de redirección')
console.log('   en Supabase Dashboard. El código está correcto, solo falta')
console.log('   la configuración en el dashboard de Supabase.')
