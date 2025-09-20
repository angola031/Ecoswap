#!/usr/bin/env node

/**
 * Script para probar cookies con configuración alternativa
 */

console.log('🍪 PROBANDO CONFIGURACIÓN ALTERNATIVA DE COOKIES')
console.log('=================================================')

console.log('\n✅ Cambios realizados:')
console.log('1. Configurado localStorage como storage en Supabase')
console.log('2. Habilitado persistSession y autoRefreshToken')
console.log('3. Configurado detectSessionInUrl')

console.log('\n🧪 Pasos para probar:')
console.log('1. Reinicia el servidor:')
console.log('   - Presiona Ctrl+C en la terminal')
console.log('   - Ejecuta: npm run dev')
console.log('2. Ve a: http://localhost:3000/login')
console.log('3. Haz login con:')
console.log('   📧 Email: c.angola@utp.edu.co')
console.log('   🔑 Contraseña: admin123')

console.log('\n🔍 Verificación en el navegador:')
console.log('1. Abre herramientas de desarrollador (F12)')
console.log('2. Ve a Application → Local Storage → http://localhost:3000')
console.log('3. Busca claves que empiecen con "sb-vaqdzualcteljmivtoka"')
console.log('4. También verifica Application → Cookies → http://localhost:3000')

console.log('\n📊 Logs esperados en la consola del servidor:')
console.log('🍪 Cookies recibidas: X (donde X > 0)')
console.log('🔑 Cookies de Supabase: X (donde X > 0)')
console.log('✅ Admin autorizado: c.angola@utp.edu.co')

console.log('\n🚨 Si sigue sin funcionar:')
console.log('1. Limpia localStorage del navegador')
console.log('2. Limpia cookies del navegador')
console.log('3. Prueba en modo incógnito')
console.log('4. Verifica que no tengas extensiones bloqueando')

console.log('\n💡 Configuración alternativa aplicada:')
console.log('- Usando localStorage en lugar de cookies')
console.log('- Manteniendo persistencia de sesión')
console.log('- Habilitando detección de sesión en URL')
