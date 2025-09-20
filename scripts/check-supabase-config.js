#!/usr/bin/env node

/**
 * Script para verificar la configuración de Supabase
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verificando configuración de Supabase...')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n📋 Variables de entorno:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante')

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Error: Variables de entorno de Supabase no configuradas')
    process.exit(1)
}

console.log('\n🔗 URL de Supabase:', supabaseUrl)
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...')

// Verificar configuración de cookies en Supabase
console.log('\n🍪 Configuración de cookies recomendada:')
console.log('1. Ve al Dashboard de Supabase')
console.log('2. Settings → Authentication')
console.log('3. Site URL: http://localhost:3000')
console.log('4. Redirect URLs:')
console.log('   - http://localhost:3000/auth/callback')
console.log('   - http://localhost:3000/auth/supabase-redirect')
console.log('5. Cookie Settings:')
console.log('   - SameSite: lax')
console.log('   - Secure: false (para desarrollo)')
console.log('   - HttpOnly: false')

console.log('\n📱 Para verificar cookies en el navegador:')
console.log('1. Abre las herramientas de desarrollador (F12)')
console.log('2. Ve a Application → Cookies → http://localhost:3000')
console.log('3. Busca cookies que empiecen con "sb-" o "supabase"')
console.log('4. Deberías ver algo como:')
console.log('   - sb-vaqdzualcteljmivtoka-auth-token')
console.log('   - sb-vaqdzualcteljmivtoka-auth-token.0')
console.log('   - sb-vaqdzualcteljmivtoka-auth-token.1')

console.log('\n✅ Configuración básica verificada')
