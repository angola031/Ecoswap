#!/usr/bin/env node

/**
 * Script para probar el flujo corregido de creación de administradores
 */

console.log('🧪 Probando flujo corregido de creación de administradores...\n')

console.log('✅ CORRECCIONES IMPLEMENTADAS:')
console.log('1. ✅ Usuario se crea en Supabase Auth PRIMERO')
console.log('2. ✅ Se usa el ID real de Supabase Auth en tabla usuario')
console.log('3. ✅ Email de configuración se envía correctamente')
console.log('4. ✅ Limpieza automática si falla la creación en tabla usuario')
console.log()

console.log('🔧 FLUJO CORREGIDO:')
console.log('1. 🔍 Verificar si usuario existe en Supabase Auth')
console.log('2. ➕ Si no existe, crear con adminSupabase.auth.admin.createUser()')
console.log('3. 📝 Crear registro en tabla usuario con user_id real')
console.log('4. 🎭 Asignar roles en usuario_rol')
console.log('5. 📍 Crear ubicación y configuración')
console.log('6. 📧 Enviar email de configuración de contraseña')
console.log('7. 🔔 Crear notificación')
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
console.log('   ✅ "🔧 API Create Admin: Creando usuario en Supabase Auth..."')
console.log('   ✅ "✅ API Create Admin: Usuario creado en Supabase Auth"')
console.log('   ✅ "📧 API Create Admin: Enviando email de configuración a: ..."')
console.log('   ✅ "✅ API Create Admin: Email de configuración enviado exitosamente"')
console.log()

console.log('4. 📊 VERIFICAR LOGS EN VERCEL:')
console.log('   - Ve a: Vercel Dashboard → Functions')
console.log('   - Busca la función que maneja /api/admin/roles')
console.log('   - Revisa los logs para ver el proceso completo')
console.log()

console.log('5. ✅ VERIFICAR RESULTADO:')
console.log('   - El usuario debe aparecer en la lista de administradores')
console.log('   - Debe tener los roles asignados correctamente')
console.log('   - Debe recibir el email de configuración')
console.log('   - Debe aparecer en Supabase Auth → Users')
console.log()

console.log('6. 🔍 VERIFICAR EN SUPABASE:')
console.log('   - Ve a: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/users')
console.log('   - Busca el email:', testEmail)
console.log('   - Verifica que el usuario esté creado')
console.log('   - Verifica que tenga user_metadata con es_admin: true')
console.log()

console.log('❌ LOGS DE ERROR ESPERADOS (si algo falla):')
console.log()

console.log('Si ves "❌ API Create Admin: No se pudo crear cliente admin":')
console.log('1. Service Role Key no configurada en Vercel')
console.log('2. Verificar en Vercel Dashboard → Settings → Environment Variables')
console.log()

console.log('Si ves "❌ API Create Admin: Error creando usuario en Supabase Auth":')
console.log('1. Verificar permisos de Service Role Key')
console.log('2. Verificar configuración de Supabase')
console.log()

console.log('Si ves "❌ API Create Admin: Error enviando email":')
console.log('1. Verificar configuración de email en Supabase')
console.log('2. Verificar URLs de redirección')
console.log('3. Verificar que el usuario exista en Supabase Auth')
console.log()

console.log('✅ LOGS DE ÉXITO ESPERADOS:')
console.log()

console.log('🔧 API Create Admin: Creando usuario en Supabase Auth...')
console.log('✅ API Create Admin: Usuario creado en Supabase Auth')
console.log('   ID: [UUID del usuario]')
console.log('   Email: [email del usuario]')
console.log('📧 API Create Admin: Enviando email de configuración a: [email]')
console.log('🔗 API Create Admin: URL de redirección: [URL]')
console.log('✅ API Create Admin: Email de configuración enviado exitosamente')
console.log()

console.log('🎯 RESULTADO ESPERADO:')
console.log()

console.log('✅ Usuario creado en Supabase Auth')
console.log('✅ Usuario creado en tabla usuario')
console.log('✅ Roles asignados correctamente')
console.log('✅ Email de configuración enviado')
console.log('✅ Notificación creada')
console.log('✅ Administrador aparece en la lista')
console.log()

console.log('🔗 URLs ÚTILES:')
console.log('- Dashboard Admin: https://ecoswap-lilac.vercel.app/admin/verificaciones')
console.log('- Supabase Auth Users: https://supabase.com/dashboard/project/vaqdzualcteljmivtoka/auth/users')
console.log('- Vercel Dashboard: https://vercel.com/dashboard')
console.log()

console.log('💡 NOTA IMPORTANTE:')
console.log('El flujo ahora crea el usuario en Supabase Auth PRIMERO,')
console.log('luego en la tabla usuario, y finalmente envía el email.')
console.log('Esto asegura que resetPasswordForEmail() funcione correctamente.')
console.log()

console.log('🚀 ¡PRUEBA EL FLUJO CORREGIDO!')
console.log('El problema de "usuario no se registra en Supabase Auth"')
console.log('y "no llega el correo" debería estar resuelto.')
