#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de eliminación de administradores
 */

console.log('🔍 DIAGNÓSTICO DE ELIMINACIÓN DE ADMINISTRADORES')
console.log('===============================================')

console.log('\n❌ Problema reportado:')
console.log('"No hay sesión activa" al intentar eliminar un administrador')

console.log('\n🔧 Correcciones implementadas:')
console.log('1. Corregido error tipográfico: setErrorMessageMessage → setErrorMessage')
console.log('2. Agregados logs detallados para debugging de sesión')
console.log('3. Mejorada verificación de token y sesión')
console.log('4. Agregados logs en la API para verificar super admin')
console.log('5. Manejo mejorado de errores en la verificación de sesión')

console.log('\n📊 Logs esperados en consola del navegador:')
console.log('🔍 Verificando sesión antes de eliminar administrador...')
console.log('📊 Estado de sesión: { hasSession: true, hasUser: true, userEmail: "admin@email.com", hasToken: true }')
console.log('✅ Sesión y token verificados correctamente')
console.log('🗑️ Eliminando administrador: [ID]')
console.log('📊 Respuesta de eliminación: { status: 200, data: { ok: true, message: "..." } }')

console.log('\n📊 Logs esperados en consola del servidor:')
console.log('🔍 Verificando super admin en API...')
console.log('📋 Authorization header: Presente')
console.log('🔑 Token extraído: Presente')
console.log('🔐 Verificando usuario con token...')
console.log('✅ Usuario verificado: admin@email.com')
console.log('🔍 Verificando permisos de super admin...')
console.log('📊 Consultando usuario en DB: admin@email.com')
console.log('📊 Usuario en DB: { user_id: X, es_admin: true }')
console.log('🔍 Usuario es admin, verificando roles...')
console.log('📊 Roles del usuario: [{ rol_id: X, activo: true }]')
console.log('📊 Nombres de roles: [{ rol_id: X, nombre: "super_admin", activo: true }]')
console.log('✅ Es super admin: true')
console.log('✅ Super admin verificado correctamente')

console.log('\n🚨 Posibles causas del error "No hay sesión activa":')
console.log('1. Sesión expirada o inválida')
console.log('2. Token de acceso no presente')
console.log('3. Problema con localStorage/sessionStorage')
console.log('4. Usuario no autenticado correctamente')
console.log('5. Problema con la configuración de Supabase')

console.log('\n🔍 Pasos para diagnosticar:')
console.log('1. Ve a: http://localhost:3000/admin/verificaciones')
console.log('2. Abre DevTools → Console')
console.log('3. Haz clic en "Gestionar Administradores"')
console.log('4. Intenta eliminar un administrador')
console.log('5. Revisa los logs en la consola del navegador')
console.log('6. Revisa los logs en la consola del servidor (terminal)')
console.log('7. Verifica en DevTools → Application → Storage que haya datos de sesión')

console.log('\n💡 Verificaciones adicionales:')
console.log('1. Confirma que estés logueado como super admin')
console.log('2. Verifica que tengas el rol "super_admin" asignado')
console.log('3. Revisa que la sesión no haya expirado')
console.log('4. Confirma que las variables de entorno estén configuradas')

console.log('\n🔧 Si el problema persiste:')
console.log('1. Revisa los logs detallados en ambas consolas')
console.log('2. Verifica el estado de la sesión en DevTools')
console.log('3. Confirma que el usuario tenga permisos de super admin')
console.log('4. Revisa la configuración de Supabase')
console.log('5. Intenta hacer logout y login nuevamente')

console.log('\n✅ ¡Diagnóstico completo implementado!')
console.log('Los logs detallados te ayudarán a identificar exactamente dónde está el problema.')
