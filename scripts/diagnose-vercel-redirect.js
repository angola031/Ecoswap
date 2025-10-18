#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de redirección en Vercel
 */

console.log('🔍 Diagnóstico de Redirección en Vercel\n')

console.log('✅ Estado actual:')
console.log('   - Localhost: Funciona correctamente')
console.log('   - Vercel: No redirige correctamente')
console.log('   - Variables de entorno: Configuradas en Vercel\n')

console.log('🔍 Posibles causas del problema en Vercel:\n')

console.log('1️⃣ VARIABLES DE ENTORNO EN VERCEL:')
console.log('   📍 Verifica que estas variables estén configuradas en Vercel:')
console.log('   - NEXT_PUBLIC_SUPABASE_URL')
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('   - SUPABASE_SERVICE_ROLE_KEY')
console.log('   - NEXT_PUBLIC_SITE_URL (debe ser https://ecoswap-lilac.vercel.app)')
console.log('')

console.log('2️⃣ URL DE SITE_URL EN VERCEL:')
console.log('   📍 La variable NEXT_PUBLIC_SITE_URL debe ser:')
console.log('   - https://ecoswap-lilac.vercel.app')
console.log('   - NO debe ser http://localhost:3000')
console.log('   - NO debe tener barra final')
console.log('')

console.log('3️⃣ URLs DE REDIRECCIÓN EN SUPABASE:')
console.log('   📍 Verifica que estas URLs estén configuradas en Supabase Dashboard:')
console.log('   - https://ecoswap-lilac.vercel.app/auth/callback')
console.log('   - https://ecoswap-lilac.vercel.app/auth/reset-password')
console.log('   - https://ecoswap-lilac.vercel.app/auth/auth-code-error')
console.log('')

console.log('4️⃣ SITE URL EN SUPABASE DASHBOARD:')
console.log('   📍 En Supabase Dashboard > Authentication > URL Configuration:')
console.log('   - Site URL debe ser: https://ecoswap-lilac.vercel.app')
console.log('   - NO debe ser http://localhost:3000')
console.log('')

console.log('🔧 PASOS PARA SOLUCIONAR:\n')

console.log('1️⃣ CONFIGURAR VARIABLES EN VERCEL:')
console.log('   📍 Ve a tu proyecto en Vercel Dashboard')
console.log('   📍 Ve a Settings > Environment Variables')
console.log('   📍 Asegúrate de que NEXT_PUBLIC_SITE_URL sea:')
console.log('      https://ecoswap-lilac.vercel.app')
console.log('   📍 Si no está configurada, agrégala')
console.log('   📍 Haz clic en "Save"')
console.log('')

console.log('2️⃣ REDEPLOY EN VERCEL:')
console.log('   📍 Después de cambiar las variables de entorno:')
console.log('   📍 Ve a Deployments en Vercel')
console.log('   📍 Haz clic en "Redeploy" en el último deployment')
console.log('   📍 O haz un nuevo push a GitHub para trigger un nuevo deployment')
console.log('')

console.log('3️⃣ VERIFICAR SUPABASE DASHBOARD:')
console.log('   📍 Ve a Supabase Dashboard > Authentication > URL Configuration')
console.log('   📍 Verifica que Site URL sea: https://ecoswap-lilac.vercel.app')
console.log('   📍 Verifica que las Redirect URLs incluyan:')
console.log('      - https://ecoswap-lilac.vercel.app/auth/callback')
console.log('      - https://ecoswap-lilac.vercel.app/auth/reset-password')
console.log('      - https://ecoswap-lilac.vercel.app/auth/auth-code-error')
console.log('')

console.log('🧪 CÓMO PROBAR LA SOLUCIÓN:\n')

console.log('1. Configura NEXT_PUBLIC_SITE_URL en Vercel')
console.log('2. Redeploy la aplicación en Vercel')
console.log('3. Verifica Site URL en Supabase Dashboard')
console.log('4. Prueba el restablecimiento desde https://ecoswap-lilac.vercel.app')
console.log('5. Revisa los logs de Vercel para debugging')
console.log('')

console.log('📊 FLUJO CORRECTO EN VERCEL:\n')

console.log('1. Usuario en https://ecoswap-lilac.vercel.app solicita restablecimiento')
console.log('2. Supabase envía email con enlace a:')
console.log('   https://ecoswap-lilac.vercel.app/auth/callback?code=TOKEN&next=/auth/reset-password')
console.log('3. Supabase verifica el token (sin error 303)')
console.log('4. Callback redirige a: https://ecoswap-lilac.vercel.app/auth/reset-password')
console.log('5. Usuario establece nueva contraseña')
console.log('')

console.log('⚠️ ERRORES COMUNES EN VERCEL:\n')

console.log('❌ NEXT_PUBLIC_SITE_URL incorrecta:')
console.log('   - http://localhost:3000 (debe ser https://ecoswap-lilac.vercel.app)')
console.log('   - https://ecoswap-lilac.vercel.app/ (con barra final)')
console.log('   - Variable no configurada')
console.log('')

console.log('❌ Site URL en Supabase incorrecta:')
console.log('   - http://localhost:3000 (debe ser https://ecoswap-lilac.vercel.app)')
console.log('   - https://ecoswap-lilac.vercel.app/ (con barra final)')
console.log('')

console.log('❌ No redeploy después de cambiar variables:')
console.log('   - Las variables de entorno no se aplican hasta el próximo deployment')
console.log('')

console.log('✅ CONFIGURACIÓN CORRECTA:\n')

console.log('Vercel Environment Variables:')
console.log('   NEXT_PUBLIC_SITE_URL = https://ecoswap-lilac.vercel.app')
console.log('   NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co')
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-clave-anonima')
console.log('   SUPABASE_SERVICE_ROLE_KEY = tu-clave-de-servicio')
console.log('')

console.log('Supabase Dashboard:')
console.log('   Site URL = https://ecoswap-lilac.vercel.app')
console.log('   Redirect URLs incluyen todas las URLs de Vercel')
console.log('')

console.log('🎯 RESUMEN:\n')

console.log('El problema más probable es que NEXT_PUBLIC_SITE_URL no está')
console.log('configurada correctamente en Vercel o que no se ha hecho')
console.log('redeploy después de configurarla. También verifica que')
console.log('Site URL en Supabase Dashboard sea la URL de Vercel.')
