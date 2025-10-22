// Script para verificar el estado actual de la tabla validacion_intercambio
const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkValidationTable() {
  try {
    console.log('🔍 Verificando estado de la tabla validacion_intercambio...')
    
    // 1. Intentar consultar la tabla directamente
    const { data: validations, error: validationsError } = await supabase
      .from('validacion_intercambio')
      .select('*')
      .limit(5)
    
    if (validationsError) {
      if (validationsError.code === 'PGRST116') {
        console.log('❌ La tabla validacion_intercambio NO existe')
        console.log('📋 Necesitas ejecutar el script SQL para crearla')
        console.log('\n🔧 Para crear la tabla, ejecuta el script SQL en la consola de Supabase:')
        console.log('1. Ve a https://supabase.com/dashboard')
        console.log('2. Selecciona tu proyecto')
        console.log('3. Ve a SQL Editor')
        console.log('4. Ejecuta el contenido de update-validation-schema.sql')
        return
      } else {
        console.error('❌ Error consultando validaciones:', validationsError)
        return
      }
    }
    
    console.log('✅ La tabla validacion_intercambio existe')
    console.log(`📊 Validaciones existentes: ${validations?.length || 0}`)
    
    if (validations && validations.length > 0) {
      console.log('\nEjemplos de validaciones:')
      validations.forEach((val, index) => {
        console.log(`  ${index + 1}. Intercambio ${val.intercambio_id}, Usuario ${val.usuario_id}: ${val.es_exitoso ? '✅ Exitoso' : '❌ Fallido'} (${val.fecha_validacion})`)
      })
    }
    
    // 5. Verificar estados de intercambios
    console.log('\n🔄 Verificando estados de intercambios:')
    const { data: intercambios, error: intercambiosError } = await supabase
      .from('intercambio')
      .select('estado')
      .not('estado', 'is', null)
    
    if (intercambiosError) {
      console.error('❌ Error consultando intercambios:', intercambiosError)
    } else {
      const estados = {}
      intercambios?.forEach(intercambio => {
        estados[intercambio.estado] = (estados[intercambio.estado] || 0) + 1
      })
      
      console.log('Estados encontrados:')
      Object.entries(estados).forEach(([estado, count]) => {
        console.log(`  - ${estado}: ${count}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error)
  }
}

// Ejecutar verificación
checkValidationTable()
