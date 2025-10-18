#!/usr/bin/env node

/**
 * Script para diagnosticar por qué no aparece el botón de crear administrador
 * Verifica la lógica de detección de Super Admin
 */

console.log('🔧 Diagnosticando permisos de Super Admin...\n')

// Simular la lógica del componente AdminManagementModule
console.log('📋 Pasos de verificación:')
console.log('1. Obtener sesión del usuario')
console.log('2. Verificar si es admin en tabla usuario')
console.log('3. Obtener roles del usuario en usuario_rol')
console.log('4. Obtener nombres de roles en rol_usuario')
console.log('5. Verificar si tiene rol super_admin')
console.log()

console.log('🔍 Posibles problemas:')
console.log('❌ Usuario no tiene sesión activa')
console.log('❌ Usuario no está marcado como es_admin = true')
console.log('❌ Usuario no tiene roles asignados en usuario_rol')
console.log('❌ Roles no están activos (activo = true)')
console.log('❌ No existe rol super_admin en rol_usuario')
console.log('❌ Rol super_admin no está activo')
console.log()

console.log('🛠️  Soluciones:')
console.log('1. Verificar que el usuario esté logueado correctamente')
console.log('2. Verificar en Supabase Dashboard que el usuario tenga es_admin = true')
console.log('3. Verificar que tenga registros en usuario_rol con activo = true')
console.log('4. Verificar que exista el rol super_admin en rol_usuario')
console.log('5. Verificar que el rol super_admin esté activo')
console.log()

console.log('📊 Consultas SQL para verificar:')
console.log('-- 1. Verificar usuario admin:')
console.log('SELECT user_id, email, es_admin FROM usuario WHERE email = \'tu-email@ejemplo.com\';')
console.log()
console.log('-- 2. Verificar roles del usuario:')
console.log('SELECT ur.rol_id, ur.activo FROM usuario_rol ur')
console.log('JOIN usuario u ON ur.usuario_id = u.user_id')
console.log('WHERE u.email = \'tu-email@ejemplo.com\' AND ur.activo = true;')
console.log()
console.log('-- 3. Verificar roles disponibles:')
console.log('SELECT rol_id, nombre, activo FROM rol_usuario WHERE activo = true;')
console.log()
console.log('-- 4. Verificar si existe super_admin:')
console.log('SELECT * FROM rol_usuario WHERE nombre = \'super_admin\' AND activo = true;')
console.log()

console.log('🔧 Para probar en el navegador:')
console.log('1. Abre las herramientas de desarrollador (F12)')
console.log('2. Ve a la consola')
console.log('3. Busca el log: "✅ Verificación de permisos completada:"')
console.log('4. Verifica los valores de isSuperAdmin y roles')
console.log()

console.log('📝 Logs esperados en consola:')
console.log('✅ Verificación de permisos completada: {')
console.log('  isSuperAdmin: true,')
console.log('  userEmail: "tu-email@ejemplo.com",')
console.log('  roles: ["super_admin"]')
console.log('}')
console.log()

console.log('🚨 Si isSuperAdmin es false:')
console.log('- Verifica que el usuario tenga es_admin = true')
console.log('- Verifica que tenga roles asignados en usuario_rol')
console.log('- Verifica que el rol super_admin exista y esté activo')
console.log()

console.log('💡 Para crear un super admin manualmente:')
console.log('1. Ve a Supabase Dashboard')
console.log('2. Tabla usuario: marca es_admin = true')
console.log('3. Tabla rol_usuario: verifica que exista super_admin')
console.log('4. Tabla usuario_rol: inserta registro con rol_id del super_admin')
console.log()

console.log('🔗 URLs útiles:')
console.log('- Supabase Dashboard: https://supabase.com/dashboard')
console.log('- Tu proyecto: [URL de tu proyecto Supabase]')
console.log('- Tabla usuario: Authentication > Users')
console.log('- Tablas de roles: Table Editor > rol_usuario, usuario_rol')
