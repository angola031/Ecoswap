#!/usr/bin/env node

/**
 * Script para debuggear cookies en el navegador
 */

console.log('🍪 Debug de Cookies en el Navegador')
console.log('=====================================')

console.log('\n📋 Pasos para verificar cookies:')
console.log('1. Abre el navegador y ve a: http://localhost:3000/login')
console.log('2. Abre las herramientas de desarrollador (F12)')
console.log('3. Ve a la pestaña "Application" o "Aplicación"')
console.log('4. En el lado izquierdo, busca "Cookies"')
console.log('5. Selecciona "http://localhost:3000"')

console.log('\n🔐 Haz login con estas credenciales:')
console.log('Email: c.angola@utp.edu.co')
console.log('Contraseña: admin123')

console.log('\n🍪 Después del login, deberías ver estas cookies:')
console.log('- sb-vaqdzualcteljmivtoka-auth-token')
console.log('- sb-vaqdzualcteljmivtoka-auth-token.0')
console.log('- sb-vaqdzualcteljmivtoka-auth-token.1')

console.log('\n🔍 Si NO ves las cookies, verifica:')
console.log('1. Configuración de Supabase Dashboard:')
console.log('   - Site URL: http://localhost:3000')
console.log('   - SameSite: lax')
console.log('   - Secure: false')
console.log('   - HttpOnly: false')
console.log('2. No estés en modo incógnito')
console.log('3. No tengas extensiones bloqueando cookies')

console.log('\n📊 Para ver logs del middleware:')
console.log('Mira la consola del servidor (donde corre npm run dev)')
console.log('Deberías ver:')
console.log('🍪 Cookies recibidas: X (donde X > 0)')
console.log('🔑 Cookies de Supabase: X (donde X > 0)')

console.log('\n✅ Si todo está configurado correctamente:')
console.log('1. Las cookies aparecerán en el navegador')
console.log('2. El middleware detectará la sesión')
console.log('3. Te redirigirá automáticamente al dashboard')
