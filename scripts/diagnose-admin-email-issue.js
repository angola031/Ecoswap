#!/usr/bin/env node

/**
 * Script para diagnosticar por qué no se envía el correo al crear administradores
 */

console.log('🔧 Diagnosticando problema de envío de emails al crear administradores...\n')

console.log('📋 Posibles causas del problema:')
console.log('1. ❌ Service Role Key no configurada en Vercel')
console.log('2. ❌ Configuración de email en Supabase Dashboard')
console.log('3. ❌ URL de redirección incorrecta')
console.log('4. ❌ Usuario ya existe en Supabase Auth')
console.log('5. ❌ Políticas de RLS bloqueando la operación')
console.log('6. ❌ Configuración de SMTP en Supabase')
console.log()

console.log('🔍 Verificaciones necesarias:')
console.log()

console.log('1. 📧 Configuración de Email en Supabase:')
console.log('   - Ve a Supabase Dashboard → Authentication → Settings')
console.log('   - Verifica que "Enable email confirmations" esté activado')
console.log('   - Verifica que "Enable email change confirmations" esté activado')
console.log('   - Verifica configuración de SMTP si usas proveedor personalizado')
console.log()

console.log('2. 🔑 Service Role Key en Vercel:')
console.log('   - Ve a Vercel Dashboard → Settings → Environment Variables')
console.log('   - Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada')
console.log('   - Verifica que no tenga espacios o caracteres extra')
console.log()

console.log('3. 🌐 URLs de Redirección en Supabase:')
console.log('   - Ve a Supabase Dashboard → Authentication → URL Configuration')
console.log('   - Site URL: https://ecoswap-lilac.vercel.app')
console.log('   - Redirect URLs debe incluir:')
console.log('     * https://ecoswap-lilac.vercel.app/auth/supabase-redirect')
console.log('     * https://ecoswap-lilac.vercel.app/auth/callback')
console.log()

console.log('4. 👤 Usuario ya existe:')
console.log('   - Si el usuario ya existe en Supabase Auth, resetPasswordForEmail puede fallar')
console.log('   - Verifica en Authentication → Users si el email ya está registrado')
console.log()

console.log('5. 🔒 Políticas RLS:')
console.log('   - Verifica que las políticas permitan crear usuarios')
console.log('   - Verifica que el service role key tenga permisos completos')
console.log()

console.log('📊 Logs esperados en Vercel:')
console.log('✅ API Create Admin: Cliente admin creado correctamente')
console.log('📧 API Create Admin: Enviando email a: [email]')
console.log('🔗 API Create Admin: URL de redirección: [url]')
console.log('✅ API Create Admin: Email de configuración enviado exitosamente')
console.log()

console.log('❌ Logs de error comunes:')
console.log('❌ API Create Admin: No se pudo crear cliente admin')
console.log('❌ API Create Admin: Error enviando email: [mensaje]')
console.log()

console.log('🛠️  Pasos para diagnosticar:')
console.log('1. Crear un administrador desde el dashboard')
console.log('2. Revisar logs en Vercel Dashboard → Functions')
console.log('3. Revisar logs en Supabase Dashboard → Logs')
console.log('4. Verificar configuración de email en Supabase')
console.log('5. Probar con un email que no exista en Supabase Auth')
console.log()

console.log('🧪 Prueba manual:')
console.log('1. Ve a Supabase Dashboard → Authentication → Users')
console.log('2. Busca si el email del administrador ya existe')
console.log('3. Si existe, elimínalo o usa un email diferente')
console.log('4. Intenta crear el administrador nuevamente')
console.log()

console.log('📞 Si el problema persiste:')
console.log('1. Verifica que el service role key sea correcto')
console.log('2. Verifica que las URLs de redirección estén configuradas')
console.log('3. Verifica que el email no esté en la lista de bloqueados')
console.log('4. Contacta soporte de Supabase si es problema de SMTP')
console.log()

console.log('🔗 URLs útiles:')
console.log('- Supabase Dashboard: https://supabase.com/dashboard')
console.log('- Vercel Dashboard: https://vercel.com/dashboard')
console.log('- Supabase Auth Settings: [Tu proyecto] → Authentication → Settings')
console.log('- Vercel Environment Variables: [Tu proyecto] → Settings → Environment Variables')
