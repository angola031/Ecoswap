#!/usr/bin/env node

/**
 * Script para configurar la base de datos de EcoSwap
 * Ejecuta todos los scripts SQL necesarios en orden
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

console.log('🗄️ Configurando base de datos de EcoSwap...')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Scripts SQL en orden de ejecución
const sqlScripts = [
  'create-admin-roles-system.sql',
  'supabase-policies.sql',
  'fix-usuario-rol-relationships.sql'
]

async function executeSQLScript(filename) {
  const scriptPath = path.join(__dirname, '..', 'database', filename)
  
  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️ Script no encontrado: ${filename}`)
    return
  }

  console.log(`📄 Ejecutando: ${filename}`)
  
  try {
    const sqlContent = fs.readFileSync(scriptPath, 'utf8')
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error(`❌ Error ejecutando ${filename}:`, error.message)
    } else {
      console.log(`✅ ${filename} ejecutado correctamente`)
    }
  } catch (error) {
    console.error(`💥 Error leyendo ${filename}:`, error.message)
  }
}

async function setupDatabase() {
  try {
    console.log('🔍 Verificando conexión a Supabase...')
    
    // Verificar conexión
    const { data, error } = await supabase.from('usuario').select('count').limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      process.exit(1)
    }
    
    console.log('✅ Conexión a Supabase establecida')
    
    // Ejecutar scripts en orden
    for (const script of sqlScripts) {
      await executeSQLScript(script)
    }
    
    console.log('\n🎉 Configuración de base de datos completada!')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Verificar que las tablas se crearon correctamente')
    console.log('2. Crear el primer usuario administrador')
    console.log('3. Configurar políticas de seguridad')
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message)
    process.exit(1)
  }
}

setupDatabase()
