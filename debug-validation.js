// Script para debuggear el problema de validación de intercambios
// Ejecutar con: node debug-validation.js

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usar las mismas variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugValidation() {
  try {
    console.log('🔍 [DEBUG] Iniciando análisis de validaciones...')
    
    // 1. Buscar intercambios con estado 'en_progreso'
    console.log('\n📊 1. Intercambios con estado "en_progreso":')
    const { data: intercambiosEnProgreso, error: error1 } = await supabase
      .from('intercambio')
      .select('intercambio_id, estado, fecha_creacion, usuario_propone_id, usuario_recibe_id')
      .eq('estado', 'en_progreso')
      .order('fecha_creacion', { ascending: false })
      .limit(5)
    
    if (error1) {
      console.error('❌ Error consultando intercambios:', error1)
      return
    }
    
    console.log('Encontrados:', intercambiosEnProgreso?.length || 0)
    intercambiosEnProgreso?.forEach(intercambio => {
      console.log(`  - ID: ${intercambio.intercambio_id}, Estado: ${intercambio.estado}, Fecha: ${intercambio.fecha_creacion}`)
    })
    
    // 2. Para cada intercambio en progreso, verificar sus validaciones
    if (intercambiosEnProgreso && intercambiosEnProgreso.length > 0) {
      console.log('\n🔍 2. Validaciones por intercambio:')
      
      for (const intercambio of intercambiosEnProgreso) {
        const { data: validaciones, error: error2 } = await supabase
          .from('validacion_intercambio')
          .select('usuario_id, es_exitoso, fecha_validacion, calificacion')
          .eq('intercambio_id', intercambio.intercambio_id)
          .order('fecha_validacion', { ascending: false })
        
        if (error2) {
          console.error(`❌ Error consultando validaciones para intercambio ${intercambio.intercambio_id}:`, error2)
          continue
        }
        
        console.log(`\n  Intercambio ${intercambio.intercambio_id}:`)
        console.log(`    Estado actual: ${intercambio.estado}`)
        console.log(`    Validaciones encontradas: ${validaciones?.length || 0}`)
        
        if (validaciones && validaciones.length > 0) {
          validaciones.forEach((val, index) => {
            console.log(`      ${index + 1}. Usuario ${val.usuario_id}: ${val.es_exitoso ? '✅ Exitoso' : '❌ Fallido'} (${val.fecha_validacion})`)
          })
          
          // Analizar si debería cambiar el estado
          if (validaciones.length >= 2) {
            const a = validaciones[0]?.es_exitoso === true
            const b = validaciones[1]?.es_exitoso === true
            
            console.log(`    Análisis:`)
            console.log(`      Validación 1: ${a}`)
            console.log(`      Validación 2: ${b}`)
            
            if (a && b) {
              console.log(`      🎯 DEBERÍA SER: completado`)
            } else if (a !== b) {
              console.log(`      🎯 DEBERÍA SER: pendiente_revision`)
            } else {
              console.log(`      🎯 DEBERÍA SER: fallido`)
            }
          } else {
            console.log(`    ⏳ Esperando más validaciones...`)
          }
        } else {
          console.log(`    ❌ No hay validaciones registradas`)
        }
      }
    }
    
    // 3. Verificar intercambios completados recientemente
    console.log('\n✅ 3. Intercambios completados recientemente:')
    const { data: intercambiosCompletados, error: error3 } = await supabase
      .from('intercambio')
      .select('intercambio_id, estado, fecha_completado, fecha_actualizacion')
      .eq('estado', 'completado')
      .order('fecha_completado', { ascending: false })
      .limit(5)
    
    if (error3) {
      console.error('❌ Error consultando intercambios completados:', error3)
    } else {
      console.log('Encontrados:', intercambiosCompletados?.length || 0)
      intercambiosCompletados?.forEach(intercambio => {
        console.log(`  - ID: ${intercambio.intercambio_id}, Completado: ${intercambio.fecha_completado}`)
      })
    }
    
    console.log('\n✅ [DEBUG] Análisis completado')
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error)
  }
}

// Ejecutar el análisis
debugValidation()
