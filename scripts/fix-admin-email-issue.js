#!/usr/bin/env node

/**
 * Script para diagnosticar y solucionar el problema de envío de emails al crear administradores
 * El problema: Se crea el usuario en la tabla usuario pero no se envía el email
 */

console.log('🔧 Diagnosticando problema de envío de emails al crear administradores...\n')

console.log('📋 PROBLEMA IDENTIFICADO:')
console.log('✅ Usuario se crea en tabla usuario')
console.log('❌ No se envía email para registrar contraseña')
console.log()

console.log('🔍 CAUSAS MÁS PROBABLES:')
console.log('1. ❌ Usuario ya existe en Supabase Auth')
console.log('2. ❌ Service Role Key no configurada en Vercel')
console.log('3. ❌ URLs de redirección no configuradas en Supabase')
console.log('4. ❌ Configuración de email deshabilitada en Supabase')
console.log('5. ❌ Error en resetPasswordForEmail()')
console.log()

console.log('🛠️  SOLUCIONES PASO A PASO:')
console.log()

console.log('PASO 1: Verificar si el usuario ya existe en Supabase Auth')
console.log('1. Ve a Supabase Dashboard → Authentication → Users')
console.log('2. Busca el email del administrador que intentaste crear')
console.log('3. Si existe, elimínalo o usa un email diferente')
console.log()

console.log('PASO 2: Verificar Service Role Key en Vercel')
console.log('1. Ve a Vercel Dashboard → Settings → Environment Variables')
console.log('2. Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada')
console.log('3. Verifica que no tenga espacios o caracteres extra')
console.log()

console.log('PASO 3: Verificar URLs de redirección en Supabase')
console.log('1. Ve a Supabase Dashboard → Authentication → URL Configuration')
console.log('2. Site URL: https://ecoswap-lilac.vercel.app')
console.log('3. Redirect URLs debe incluir:')
console.log('   - https://ecoswap-lilac.vercel.app/auth/supabase-redirect')
console.log('   - https://ecoswap-lilac.vercel.app/auth/callback')
console.log()

console.log('PASO 4: Verificar configuración de email en Supabase')
console.log('1. Ve a Supabase Dashboard → Authentication → Settings')
console.log('2. Verifica que "Enable email confirmations" esté activado')
console.log('3. Verifica que "Enable email change confirmations" esté activado')
console.log()

console.log('PASO 5: Probar con email completamente nuevo')
console.log('1. Usa un email que definitivamente no existe en Supabase Auth')
console.log('2. Crea el administrador desde el dashboard')
console.log('3. Verifica que llegue el email')
console.log()

console.log('📊 LOGS A REVISAR EN VERCEL:')
console.log('Ve a Vercel Dashboard → Functions → [función] → Logs')
console.log()
console.log('✅ Logs exitosos:')
console.log('✅ API Create Admin: Cliente admin creado correctamente')
console.log('📧 API Create Admin: Enviando email a: [email]')
console.log('🔗 API Create Admin: URL de redirección: [url]')
console.log('✅ API Create Admin: Email de configuración enviado exitosamente')
console.log()
console.log('❌ Logs de error:')
console.log('❌ API Create Admin: No se pudo crear cliente admin')
console.log('❌ API Create Admin: Error enviando email: [mensaje]')
console.log()

console.log('🧪 PRUEBA ESPECÍFICA:')
console.log('1. Usa un email como: test-admin-' + Date.now() + '@ejemplo.com')
console.log('2. Crea el administrador desde el dashboard')
console.log('3. Revisa los logs en Vercel')
console.log('4. Verifica que llegue el email')
console.log()

console.log('🔧 SOLUCIÓN ALTERNATIVA - Crear usuario en Supabase Auth primero:')
console.log('Si el problema persiste, podemos modificar el código para:')
console.log('1. Crear el usuario en Supabase Auth primero')
console.log('2. Luego crear el registro en la tabla usuario')
console.log('3. Esto asegura que resetPasswordForEmail funcione')
console.log()

console.log('📞 SI NADA FUNCIONA:')
console.log('1. Verificar logs detallados en Vercel y Supabase')
console.log('2. Probar con un email completamente nuevo')
console.log('3. Verificar que el Service Role Key tenga permisos completos')
console.log('4. Contactar soporte de Supabase si es problema de email')
console.log()

console.log('💡 NOTA IMPORTANTE:')
console.log('El problema más común es que el usuario ya existe en Supabase Auth.')
console.log('resetPasswordForEmail() falla si el usuario ya está registrado.')
console.log('Solución: Usar un email diferente o eliminar el usuario existente.')
console.log()

console.log('🔗 URLs ÚTILES:')
console.log('- Supabase Dashboard: https://supabase.com/dashboard')
console.log('- Vercel Dashboard: https://vercel.com/dashboard')
console.log('- Authentication Users: [Tu proyecto] → Authentication → Users')
console.log('- URL Configuration: [Tu proyecto] → Authentication → URL Configuration')
