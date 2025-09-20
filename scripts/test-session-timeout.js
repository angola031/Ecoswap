#!/usr/bin/env node

/**
 * Script para probar el sistema de timeout de sesión
 */

console.log('⏰ SISTEMA DE TIMEOUT DE SESIÓN')
console.log('==============================')

console.log('\n✅ Características implementadas:')
console.log('1. Timeout automático después de 5 minutos de inactividad')
console.log('2. Limpieza completa de cookies y localStorage')
console.log('3. Advertencia 1 minuto antes del timeout')
console.log('4. Opción de extender sesión')
console.log('5. Redirección automática según el tipo de usuario')
console.log('6. Mensajes informativos en login y página principal')

console.log('\n🔧 Flujo del sistema:')
console.log('1. Usuario accede a páginas protegidas (/admin, /profile, /chat, /interactions)')
console.log('2. Se inicia el timer de 5 minutos')
console.log('3. Se detecta actividad del usuario (mouse, teclado, scroll, etc.)')
console.log('4. Timer se reinicia con cada actividad (mínimo 30 segundos entre reinicios)')
console.log('5. A los 4 minutos (1 minuto antes) aparece advertencia')
console.log('6. Usuario puede extender sesión o cerrar manualmente')
console.log('7. Si no hay actividad, sesión se cierra automáticamente a los 5 minutos')

console.log('\n📋 Páginas protegidas:')
console.log('- /admin/* (Dashboard de administrador)')
console.log('- /profile/* (Página de perfil)')
console.log('- /chat/* (Chat del usuario)')
console.log('- /interactions/* (Interacciones del usuario)')

console.log('\n📋 Páginas NO protegidas:')
console.log('- / (Página principal)')
console.log('- /login (Página de login)')
console.log('- /productos (Lista de productos)')
console.log('- Otras páginas públicas')

console.log('\n🔍 Eventos que reinician el timer:')
console.log('- mousedown (clic del mouse)')
console.log('- mousemove (movimiento del mouse)')
console.log('- keypress (presión de tecla)')
console.log('- scroll (desplazamiento)')
console.log('- touchstart (toque en dispositivos táctiles)')
console.log('- click (clic en cualquier elemento)')

console.log('\n📊 Pasos para probar:')
console.log('1. Inicia sesión como administrador:')
console.log('   - Ve a: http://localhost:3000/login')
console.log('   - Usa credenciales de admin')
console.log('   - Deberías ser redirigido a /admin/verificaciones')

console.log('\n2. Prueba el timeout (recomendado en modo incógnito):')
console.log('   - No muevas el mouse ni presiones teclas')
console.log('   - Espera 4 minutos (aparecerá advertencia)')
console.log('   - Espera 1 minuto más (sesión se cerrará)')
console.log('   - Deberías ser redirigido a /login?timeout=true')

console.log('\n3. Prueba extender sesión:')
console.log('   - Cuando aparezca la advertencia')
console.log('   - Haz clic en "Extender Sesión"')
console.log('   - El timer debería reiniciarse')

console.log('\n4. Prueba actividad del usuario:')
console.log('   - Mueve el mouse o presiona teclas')
console.log('   - El timer debería reiniciarse automáticamente')

console.log('\n📊 Logs esperados en consola del navegador:')
console.log('🔄 Timeout de sesión reiniciado (5 minutos)')
console.log('⏰ Sesión expirada por inactividad, cerrando sesión...')
console.log('🧹 Limpiando localStorage...')
console.log('✅ localStorage limpiado por timeout')
console.log('🍪 Limpiando cookies de Supabase...')
console.log('🧹 Limpiando cookie por timeout: sb-vaqdzualcteljmivtoka-auth-token')
console.log('✅ Cookies de Supabase limpiadas')
console.log('🔐 Cerrando sesión en Supabase...')
console.log('✅ Sesión cerrada por timeout')

console.log('\n📊 Logs esperados en consola del servidor:')
console.log('⏰ Timeout detectado en página principal, limpiando sesión del servidor...')
console.log('✅ Sesión del servidor cerrada por timeout en página principal')
console.log('⏰ Timeout detectado, limpiando sesión del servidor...')
console.log('✅ Sesión del servidor cerrada por timeout')

console.log('\n💡 Características técnicas:')
console.log('- Timer se ejecuta solo en páginas protegidas')
console.log('- Limpieza de cookies con múltiples dominios')
console.log('- Redirección inteligente según tipo de usuario')
console.log('- Mensajes informativos con opción de cerrar')
console.log('- Parámetro ?timeout=true para identificar logout automático')

console.log('\n🚨 Solución de problemas:')
console.log('1. Si el timeout no funciona:')
console.log('   - Verifica que estés en una página protegida')
console.log('   - Revisa la consola del navegador para errores')
console.log('   - Asegúrate de que no haya errores de JavaScript')

console.log('\n2. Si las cookies no se limpian:')
console.log('   - Verifica que las cookies de Supabase se estén limpiando')
console.log('   - Revisa los logs del middleware')
console.log('   - Prueba en modo incógnito')

console.log('\n3. Si no aparece la advertencia:')
console.log('   - Verifica que el componente SessionTimeoutWarning se esté renderizando')
console.log('   - Revisa que el hook useSessionTimeout esté funcionando')
console.log('   - Comprueba que no haya errores en la consola')

console.log('\n✅ ¡Sistema de timeout completamente implementado!')
console.log('Ahora las sesiones se cerrarán automáticamente después de 5 minutos de inactividad.')
