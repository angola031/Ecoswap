#!/usr/bin/env node

/**
 * Script para probar la creación de administradores con logs detallados
 * Ayuda a diagnosticar por qué no se envían los emails
 */

console.log('🧪 Probando creación de administradores con logs detallados...\n')

console.log('📋 INSTRUCCIONES PARA PROBAR:')
console.log()

console.log('1. 🎯 PREPARACIÓN:')
console.log('   - Ve a https://ecoswap-lilac.vercel.app/admin/verificaciones')
console.log('   - Asegúrate de estar logueado como Super Admin')
console.log('   - Abre las herramientas de desarrollador (F12)')
console.log('   - Ve a la pestaña "Console"')
console.log()

console.log('2. 📧 USAR EMAIL ÚNICO:')
console.log('   - Usa un email que NO exista en Supabase Auth')
console.log('   - Ejemplo: test-admin-' + Date.now() + '@ejemplo.com')
console.log('   - O usa tu email + timestamp: tu-email+' + Date.now() + '@gmail.com')
console.log()

console.log('3. 🔍 CREAR ADMINISTRADOR:')
console.log('   - Haz clic en "Nuevo Administrador"')
console.log('   - Completa el formulario con el email único')
console.log('   - Selecciona los roles que quieras asignar')
console.log('   - Haz clic en "Crear"')
console.log()

console.log('4. 📊 REVISAR LOGS EN CONSOLA:')
console.log('   Busca estos logs en la consola del navegador:')
console.log('   ✅ "✅ Verificación de permisos completada"')
console.log('   ✅ "📧 API Create Admin: Enviando email a: [email]"')
console.log('   ✅ "🔗 API Create Admin: URL de redirección: [url]"')
console.log('   ✅ "✅ API Create Admin: Email de configuración enviado exitosamente"')
console.log()

console.log('5. 📊 REVISAR LOGS EN VERCEL:')
console.log('   - Ve a Vercel Dashboard → Functions')
console.log('   - Busca la función que maneja /api/admin/roles')
console.log('   - Revisa los logs para ver errores detallados')
console.log()

console.log('6. 📊 REVISAR LOGS EN SUPABASE:')
console.log('   - Ve a Supabase Dashboard → Logs')
console.log('   - Filtra por "Auth" para ver logs de autenticación')
console.log('   - Busca errores relacionados con resetPasswordForEmail')
console.log()

console.log('❌ LOGS DE ERROR COMUNES:')
console.log('❌ "❌ API Create Admin: No se pudo crear cliente admin"')
console.log('   → Service Role Key no configurada en Vercel')
console.log()
console.log('❌ "⚠️ API Create Admin: Usuario ya existe en Supabase Auth"')
console.log('   → Usar un email diferente')
console.log()
console.log('❌ "❌ API Create Admin: Error enviando email: Invalid redirect URL"')
console.log('   → Verificar URLs en Supabase Dashboard')
console.log()
console.log('❌ "❌ API Create Admin: Error enviando email: User not found"')
console.log('   → Usuario no existe en Supabase Auth')
console.log()

console.log('✅ LOGS EXITOSOS:')
console.log('✅ "✅ API Create Admin: Usuario no existe en Supabase Auth"')
console.log('✅ "✅ API Create Admin: Email de configuración enviado exitosamente"')
console.log('✅ "✅ Administrador creado exitosamente!"')
console.log()

console.log('🔧 SOLUCIONES SEGÚN EL ERROR:')
console.log()

console.log('Si ves "Usuario ya existe en Supabase Auth":')
console.log('1. Ve a Supabase Dashboard → Authentication → Users')
console.log('2. Busca el email y elimínalo')
console.log('3. O usa un email completamente diferente')
console.log()

console.log('Si ves "No se pudo crear cliente admin":')
console.log('1. Ve a Vercel Dashboard → Settings → Environment Variables')
console.log('2. Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada')
console.log('3. Verifica que no tenga espacios o caracteres extra')
console.log()

console.log('Si ves "Invalid redirect URL":')
console.log('1. Ve a Supabase Dashboard → Authentication → URL Configuration')
console.log('2. Agrega: https://ecoswap-lilac.vercel.app/auth/supabase-redirect')
console.log('3. Agrega: https://ecoswap-lilac.vercel.app/auth/callback')
console.log()

console.log('Si ves "User not found":')
console.log('1. El usuario no existe en Supabase Auth')
console.log('2. resetPasswordForEmail requiere que el usuario exista')
console.log('3. Esto puede ser normal para emails nuevos')
console.log()

console.log('🧪 PRUEBA ESPECÍFICA:')
console.log('1. Usa este email: test-admin-' + Date.now() + '@ejemplo.com')
console.log('2. Crea el administrador')
console.log('3. Revisa todos los logs')
console.log('4. Verifica si llega el email')
console.log()

console.log('📞 SI NADA FUNCIONA:')
console.log('1. Copia todos los logs de error')
console.log('2. Verifica la configuración en Supabase Dashboard')
console.log('3. Verifica las variables de entorno en Vercel')
console.log('4. Prueba con un email completamente nuevo')
console.log()

console.log('💡 NOTA IMPORTANTE:')
console.log('Los logs mejorados ahora muestran:')
console.log('- Si el usuario ya existe en Supabase Auth')
console.log('- Si el email está confirmado o no')
console.log('- Errores específicos con sugerencias de solución')
console.log('- Información detallada para debugging')
