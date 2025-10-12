#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando EcoSwap para desarrollo local...')

// Crear archivo .env.local si no existe
const envPath = path.join(__dirname, '..', '.env.local')
const envExamplePath = path.join(__dirname, '..', 'env.example')

if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env.local...')
  
  const envContent = `# Configuración para desarrollo local
NODE_ENV=development

# Supabase (opcional para desarrollo local)
# NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
# SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-aqui

# Configuración de desarrollo
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EcoSwap Colombia
`

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Archivo .env.local creado')
} else {
  console.log('✅ Archivo .env.local ya existe')
}

// Verificar dependencias
console.log('📦 Verificando dependencias...')
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredDeps = [
  'next',
  'react',
  'react-dom',
  '@supabase/supabase-js',
  '@supabase/ssr',
  'tailwindcss',
  'framer-motion'
]

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep])

if (missingDeps.length > 0) {
  console.log('⚠️  Dependencias faltantes:', missingDeps.join(', '))
  console.log('💡 Ejecuta: npm install')
} else {
  console.log('✅ Todas las dependencias están instaladas')
}

console.log('')
console.log('🎉 Configuración completada!')
console.log('')
console.log('Para iniciar el servidor de desarrollo:')
console.log('  npm run dev')
console.log('')
console.log('El proyecto estará disponible en: http://localhost:3000')
console.log('')
console.log('Nota: El proyecto está configurado para funcionar sin Supabase en modo desarrollo.')
console.log('Si necesitas funcionalidad completa, configura las variables de Supabase en .env.local')
