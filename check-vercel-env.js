// Script para verificar variables de entorno en Vercel
console.log('🔍 Verificando variables de entorno disponibles...')

// Variables de Supabase
console.log('\n📊 Variables de Supabase:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No configurada')

// Variables de la aplicación
console.log('\n📱 Variables de la aplicación:')
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? '✅ Configurada' : '❌ No configurada')
console.log('VERCEL_URL:', process.env.VERCEL_URL ? '✅ Configurada' : '❌ No configurada')
console.log('VERCEL_ENV:', process.env.VERCEL_ENV ? '✅ Configurada' : '❌ No configurada')

// Variables de Node
console.log('\n🟢 Variables de Node:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('NODE_VERSION:', process.env.NODE_VERSION)

// Todas las variables que empiezan con NEXT_PUBLIC
console.log('\n🌐 Variables públicas (NEXT_PUBLIC_*):')
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ Configurada' : '❌ No configurada'}`)
  })

// Variables de Supabase específicas
console.log('\n🔐 Variables de Supabase específicas:')
Object.keys(process.env)
  .filter(key => key.includes('SUPABASE'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ Configurada' : '❌ No configurada'}`)
  })

console.log('\n✅ Verificación completada')
