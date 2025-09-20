#!/usr/bin/env node

/**
 * Guía paso a paso para configurar Supabase Dashboard
 */

console.log('🔧 CONFIGURACIÓN DEL DASHBOARD DE SUPABASE')
console.log('===========================================')

console.log('\n📍 PASO 1: Acceder al Dashboard')
console.log('1. Ve a: https://supabase.com/dashboard')
console.log('2. Inicia sesión con tu cuenta')
console.log('3. Selecciona tu proyecto: vaqdzualcteljmivtoka')

console.log('\n📍 PASO 2: Ir a Authentication')
console.log('1. En el menú lateral izquierdo, busca "Settings"')
console.log('2. Haz clic en "Settings"')
console.log('3. Busca la sección "Authentication" y haz clic')

console.log('\n📍 PASO 3: Configurar Site URL')
console.log('En la sección "General":')
console.log('📝 Site URL: http://localhost:3000')

console.log('\n📍 PASO 4: Configurar Redirect URLs')
console.log('En la sección "URL Configuration":')
console.log('📝 Redirect URLs (agrega cada una por separado):')
console.log('   - http://localhost:3000/auth/callback')
console.log('   - http://localhost:3000/auth/supabase-redirect')
console.log('   - http://localhost:3000/admin/verificaciones')
console.log('   - http://localhost:3000/login')

console.log('\n📍 PASO 5: Configurar Cookie Settings')
console.log('En la sección "Cookie Settings":')
console.log('📝 SameSite: lax')
console.log('📝 Secure: false')
console.log('📝 HttpOnly: false')

console.log('\n📍 PASO 6: Configurar JWT Settings')
console.log('En la sección "JWT Settings":')
console.log('📝 JWT expiry limit: 3600')
console.log('📝 Refresh token rotation: Enabled')

console.log('\n📍 PASO 7: Guardar Cambios')
console.log('1. Haz clic en "Save" o "Update" al final de la página')
console.log('2. Espera a que se confirmen los cambios')

console.log('\n📍 PASO 8: Reiniciar Servidor')
console.log('1. En tu terminal, presiona Ctrl+C para detener el servidor')
console.log('2. Ejecuta: npm run dev')
console.log('3. Ve a: http://localhost:3000/login')

console.log('\n✅ RESULTADO ESPERADO')
console.log('Después de configurar todo:')
console.log('1. Login exitoso')
console.log('2. Cookies visibles en el navegador')
console.log('3. Middleware detecta la sesión')
console.log('4. Redirección automática al dashboard')

console.log('\n🚨 SI ALGO NO FUNCIONA')
console.log('1. Verifica que todas las URLs sean exactas')
console.log('2. Asegúrate de que no haya espacios extra')
console.log('3. Reinicia el servidor después de cada cambio')
console.log('4. Limpia las cookies del navegador')

console.log('\n📞 AYUDA ADICIONAL')
console.log('Si necesitas ayuda:')
console.log('- Revisa la documentación: docs/CONFIGURACION_SUPABASE_DASHBOARD.md')
console.log('- Ejecuta: node scripts/debug-cookies-browser.js')
