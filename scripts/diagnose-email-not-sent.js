#!/usr/bin/env node

/**
 * Script para diagnosticar por qué no llega el correo de configuración de contraseña
 */

console.log('📧 Diagnosticando problema de envío de correo...\n')

console.log('✅ PROBLEMAS RESUELTOS:')
console.log('1. ✅ Usuario se crea en Supabase Auth')
console.log('2. ✅ Usuario se crea en tabla usuario')
console.log('3. ✅ Error de tipo de dato corregido')
console.log()

console.log('❌ PROBLEMA ACTUAL:')
console.log('El correo de configuración de contraseña no llega')
console.log()

console.log('🔍 CAUSAS MÁS PROBABLES:')
console.log('1. ❌ Configuración de email deshabilitada en Supabase')
console.log('2. ❌ URLs de redirección no configuradas correctamente')
console.log('3. ❌ Error en resetPasswordForEmail()')
console.log('4. ❌ Configuración de SMTP incorrecta')
console.log('5. ❌ Email en carpeta de spam')
console.log()

console.log('🛠️  SOLUCIONES PASO A PASO:')
console.log()

console.log('PASO 1: Verificar configuración de Email en Supabase')
console.log('1. Ve a: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/emails')
console.log('2. Verifica que esté activado:')
console.log('   ✅ "Enable email confirmations"')
console.log('   ✅ "Enable email change confirmations"')
console.log('   ✅ "Enable password resets"')
console.log('3. Si usas proveedor personalizado, verifica configuración SMTP')
console.log()

console.log('PASO 2: Verificar URLs de redirección')
console.log('1. Ve a: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/url-configuration')
console.log('2. Site URL debe ser: https://ecoswap-lilac.vercel.app')
console.log('3. Redirect URLs debe incluir:')
console.log('   ✅ https://ecoswap-lilac.vercel.app/auth/supabase-redirect')
console.log('   ✅ https://ecoswap-lilac.vercel.app/auth/callback')
console.log('   ✅ https://ecoswap-lilac.vercel.app/auth/reset-password')
console.log()

console.log('PASO 3: Verificar logs en Vercel')
console.log('1. Ve a: Vercel Dashboard → Functions')
console.log('2. Busca la función que maneja /api/admin/roles')
console.log('3. Revisa los logs para ver errores específicos')
console.log('4. Busca estos logs:')
console.log('   ✅ "📧 API Create Admin: Enviando email de configuración a: ..."')
console.log('   ❌ "❌ API Create Admin: Error enviando email: [error]"')
console.log()

console.log('PASO 4: Verificar en Supabase Auth')
console.log('1. Ve a: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/users')
console.log('2. Busca el usuario creado')
console.log('3. Verifica que esté en estado "Unconfirmed"')
console.log('4. Si está "Confirmed", el email ya fue procesado')
console.log()

console.log('PASO 5: Verificar carpeta de spam')
console.log('1. Revisa la carpeta de spam del email')
console.log('2. Busca emails de "noreply@supabase.com" o similar')
console.log('3. Marca como "No es spam" si lo encuentras')
console.log()

console.log('🧪 PRUEBA ESPECÍFICA:')
console.log()

const testEmail = `test-admin-${Date.now()}@ejemplo.com`
console.log(`📧 EMAIL DE PRUEBA: ${testEmail}`)
console.log()

console.log('📋 PASOS PARA PROBAR:')
console.log()

console.log('1. 🎯 PREPARACIÓN:')
console.log('   - Ve a: https://ecoswap-lilac.vercel.app/admin/verificaciones')
console.log('   - Asegúrate de estar logueado como Super Admin')
console.log('   - Abre herramientas de desarrollador (F12) → Console')
console.log()

console.log('2. 📝 CREAR ADMINISTRADOR:')
console.log('   - Haz clic en "Nuevo Administrador"')
console.log('   - Completa el formulario:')
console.log(`     * Email: ${testEmail}`)
console.log('     * Nombre: Test Admin')
console.log('     * Apellido: Prueba')
console.log('     * Teléfono: 1234567890')
console.log('     * Roles: super_admin, admin_soporte')
console.log('     * Enviar invitación: ✅ (activado)')
console.log('   - Haz clic en "Crear"')
console.log()

console.log('3. 📊 VERIFICAR LOGS EN CONSOLA:')
console.log('   Busca estos logs en la consola del navegador:')
console.log('   ✅ "📧 API Create Admin: Enviando email de configuración a: ..."')
console.log('   ✅ "🔗 API Create Admin: URL de redirección: ..."')
console.log('   ✅ "✅ API Create Admin: Email de configuración enviado exitosamente"')
console.log('   ❌ "❌ API Create Admin: Error enviando email: [error]"')
console.log()

console.log('4. 📊 VERIFICAR LOGS EN VERCEL:')
console.log('   - Ve a: Vercel Dashboard → Functions')
console.log('   - Busca la función que maneja /api/admin/roles')
console.log('   - Revisa los logs para ver el proceso completo')
console.log()

console.log('5. 📧 VERIFICAR EMAIL:')
console.log('   - Revisa la bandeja de entrada')
console.log('   - Revisa la carpeta de spam')
console.log('   - Busca emails de Supabase')
console.log()

console.log('❌ LOGS DE ERROR COMUNES:')
console.log()

console.log('Si ves "❌ API Create Admin: Error enviando email: Invalid redirect URL":')
console.log('1. URLs de redirección no configuradas en Supabase')
console.log('2. Verificar en Authentication → URL Configuration')
console.log('3. Agregar las URLs faltantes')
console.log()

console.log('Si ves "❌ API Create Admin: Error enviando email: Email rate limit":')
console.log('1. Límite de emails alcanzado')
console.log('2. Esperar antes de enviar otro email')
console.log('3. Verificar configuración de rate limits en Supabase')
console.log()

console.log('Si ves "❌ API Create Admin: Error enviando email: User not found":')
console.log('1. El usuario no existe en Supabase Auth')
console.log('2. Verificar que se haya creado correctamente')
console.log('3. Revisar logs de creación de usuario')
console.log()

console.log('Si NO ves logs de error pero el email no llega:')
console.log('1. Verificar configuración de email en Supabase')
console.log('2. Verificar carpeta de spam')
console.log('3. Verificar configuración de SMTP si es personalizada')
console.log()

console.log('✅ LOGS DE ÉXITO ESPERADOS:')
console.log()

console.log('📧 API Create Admin: Enviando email de configuración a: [email]')
console.log('🔗 API Create Admin: URL de redirección: [URL]')
console.log('✅ API Create Admin: Email de configuración enviado exitosamente')
console.log()

console.log('🔧 SOLUCIÓN ALTERNATIVA:')
console.log()

console.log('Si el problema persiste, podemos:')
console.log('1. Verificar configuración de email en Supabase Dashboard')
console.log('2. Probar con un email diferente')
console.log('3. Verificar logs detallados en Vercel')
console.log('4. Contactar soporte de Supabase si es problema de email')
console.log()

console.log('📞 SI NADA FUNCIONA:')
console.log('1. Verificar logs detallados en Vercel y Supabase')
console.log('2. Probar con un email completamente nuevo')
console.log('3. Verificar que el Service Role Key tenga permisos completos')
console.log('4. Contactar soporte de Supabase si es problema de email')
console.log()

console.log('💡 NOTA IMPORTANTE:')
console.log('El usuario se está creando correctamente en Supabase Auth y en la tabla usuario.')
console.log('El problema es específicamente con el envío del email de configuración.')
console.log('Esto sugiere un problema de configuración de email o URLs de redirección.')
console.log()

console.log('🔗 URLs ÚTILES:')
console.log('- Dashboard Admin: https://ecoswap-lilac.vercel.app/admin/verificaciones')
console.log('- Supabase Auth Users: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/users')
console.log('- Supabase Auth Emails: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/emails')
console.log('- Supabase URL Config: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/url-configuration')
console.log('- Vercel Dashboard: https://vercel.com/dashboard')
