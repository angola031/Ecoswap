#!/usr/bin/env node

/**
 * Script para diagnosticar el error GET/auth/v1/verify
 */

console.log('🔍 Diagnosticando error GET/auth/v1/verify...\n')

console.log('📋 ANÁLISIS DEL ERROR:')
console.log('')

console.log('❌ ERROR: GET/auth/v1/verify')
console.log('   - Este error ocurre cuando Supabase intenta verificar un token')
console.log('   - Generalmente es por configuración incorrecta de URLs')
console.log('   - Puede ser por Site URL o Redirect URLs mal configuradas')
console.log('')

console.log('🔧 CAUSAS COMUNES:')
console.log('')

console.log('1. 🚨 SITE URL INCORRECTA:')
console.log('   - Site URL en Supabase Dashboard está mal configurada')
console.log('   - Debe ser: https://ecoswap-lilac.vercel.app')
console.log('   - NO debe ser: http://localhost:3000')
console.log('')

console.log('2. 🚨 REDIRECT URLs NO CONFIGURADAS:')
console.log('   - Redirect URLs no incluyen la URL correcta')
console.log('   - Falta: https://ecoswap-lilac.vercel.app/auth/callback')
console.log('')

console.log('3. 🚨 TOKEN EXPIRADO O INVÁLIDO:')
console.log('   - El token del email ya expiró (24 horas)')
console.log('   - El token fue usado anteriormente')
console.log('   - El token está malformado')
console.log('')

console.log('4. 🚨 CONFIGURACIÓN DE EMAIL INCORRECTA:')
console.log('   - Email template mal configurado')
console.log('   - URL base incorrecta en el template')
console.log('')

console.log('🧪 PASOS PARA SOLUCIONAR:')
console.log('')

console.log('PASO 1: Verificar Supabase Dashboard')
console.log('   1. Ve a https://supabase.com/dashboard')
console.log('   2. Selecciona tu proyecto')
console.log('   3. Ve a Settings → Authentication → URL Configuration')
console.log('   4. Verifica:')
console.log('      - Site URL: https://ecoswap-lilac.vercel.app')
console.log('      - Redirect URLs: https://ecoswap-lilac.vercel.app/auth/callback')
console.log('      - Redirect URLs: https://ecoswap-lilac.vercel.app/**')
console.log('')

console.log('PASO 2: Verificar Email Templates')
console.log('   1. Ve a Authentication → Email Templates')
console.log('   2. Selecciona "Reset Password"')
console.log('   3. Verifica que use {{ .ConfirmationURL }}')
console.log('   4. Guarda los cambios')
console.log('')

console.log('PASO 3: Probar con nuevo email')
console.log('   1. Ve a https://ecoswap-lilac.vercel.app/login')
console.log('   2. Solicita un nuevo restablecimiento de contraseña')
console.log('   3. NO uses el enlace anterior (puede estar expirado)')
console.log('   4. Usa el nuevo enlace del email')
console.log('')

console.log('PASO 4: Verificar logs en Supabase')
console.log('   1. Ve a Supabase Dashboard → Logs')
console.log('   2. Busca errores relacionados con /auth/v1/verify')
console.log('   3. Revisa los detalles del error')
console.log('')

console.log('🚨 CONFIGURACIÓN ESPECÍFICA REQUERIDA:')
console.log('')

console.log('Supabase Dashboard → Authentication → URL Configuration:')
console.log('   Site URL: https://ecoswap-lilac.vercel.app')
console.log('   Redirect URLs:')
console.log('     - https://ecoswap-lilac.vercel.app/auth/callback')
console.log('     - https://ecoswap-lilac.vercel.app/auth/callback?next=/auth/reset-password')
console.log('     - https://ecoswap-lilac.vercel.app/auth/reset-password')
console.log('     - https://ecoswap-lilac.vercel.app/**')
console.log('')

console.log('📧 VERIFICAR EMAIL RECIBIDO:')
console.log('')

console.log('El enlace del email DEBE ser:')
console.log('   https://ecoswap-lilac.vercel.app/auth/callback?code=TOKEN&next=/auth/reset-password')
console.log('')

console.log('NO debe ser:')
console.log('   http://localhost:3000/?code=TOKEN')
console.log('   https://ecoswap-lilac.vercel.app/?code=TOKEN')
console.log('')

console.log('🔍 DEBUGGING ADICIONAL:')
console.log('')

console.log('1. Verificar en la consola del navegador:')
console.log('   - Abrir DevTools → Console')
console.log('   - Hacer clic en el enlace del email')
console.log('   - Revisar errores en la consola')
console.log('')

console.log('2. Verificar en Network tab:')
console.log('   - Abrir DevTools → Network')
console.log('   - Hacer clic en el enlace del email')
console.log('   - Buscar requests a /auth/v1/verify')
console.log('   - Revisar el status code y response')
console.log('')

console.log('3. Verificar en Supabase Logs:')
console.log('   - Ve a Supabase Dashboard → Logs')
console.log('   - Filtrar por "auth" o "verify"')
console.log('   - Revisar errores recientes')
console.log('')

console.log('📞 SI SIGUES TENIENDO PROBLEMAS:')
console.log('')

console.log('1. Comparte:')
console.log('   - Captura de pantalla de la configuración de Supabase')
console.log('   - El enlace exacto del email recibido')
console.log('   - Logs de la consola del navegador')
console.log('   - Logs de Supabase Dashboard')
console.log('')

console.log('2. Verifica:')
console.log('   - Que estés probando desde https://ecoswap-lilac.vercel.app')
console.log('   - Que el enlace del email sea nuevo (no expirado)')
console.log('   - Que la configuración de Supabase esté correcta')
console.log('')

console.log('🎯 RESUMEN:')
console.log('   - El error /auth/v1/verify indica problema de configuración')
console.log('   - Principalmente es Site URL o Redirect URLs incorrectas')
console.log('   - Verificar configuración en Supabase Dashboard')
console.log('   - Probar con nuevo email de restablecimiento')
console.log('   - Revisar logs para más detalles')
