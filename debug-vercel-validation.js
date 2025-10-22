// Script mejorado para debuggear validaciones en Vercel
const { getEnvConfig, validateConfig, getSupabaseConfig } = require('./lib/vercel-env-config')
const { createClient } = require('@supabase/supabase-js')

async function debugVercelValidation() {
  try {
    console.log('🔍 Iniciando debug de validación en entorno Vercel...')
    
    // 1. Verificar configuración
    console.log('\n📋 1. Verificando configuración de entorno...')
    const validation = validateConfig()
    
    if (!validation.isValid) {
      console.error('❌ Configuración inválida:')
      validation.errors.forEach(error => console.error(`  - ${error}`))
      return
    }
    
    console.log('✅ Configuración válida')
    if (validation.warnings.length > 0) {
      console.log('⚠️ Advertencias:')
      validation.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    // 2. Mostrar información del entorno
    console.log('\n🌐 2. Información del entorno:')
    const config = validation.config
    console.log(`  - Entorno: ${config.app.vercelEnv}`)
    console.log(`  - Es Vercel: ${config.app.isVercel ? 'Sí' : 'No'}`)
    console.log(`  - URL de la app: ${config.app.url || 'No configurada'}`)
    
    // 3. Configurar Supabase
    console.log('\n🔧 3. Configurando cliente de Supabase...')
    const supabaseConfig = getSupabaseConfig()
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)
    
    console.log('✅ Cliente de Supabase configurado')
    
    // 4. Verificar tabla de validaciones
    console.log('\n📊 4. Verificando tabla de validaciones...')
    const { data: validations, error: validationsError } = await supabase
      .from('validacion_intercambio')
      .select('*')
      .limit(5)
    
    if (validationsError) {
      if (validationsError.code === 'PGRST116') {
        console.log('❌ La tabla validacion_intercambio NO existe')
        console.log('📋 Necesitas ejecutar el script SQL en Supabase:')
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
    console.log(`📊 Validaciones encontradas: ${validations?.length || 0}`)
    
    // 5. Verificar intercambios con estado en_progreso
    console.log('\n🔄 5. Verificando intercambios en progreso...')
    const { data: intercambiosEnProgreso, error: intercambiosError } = await supabase
      .from('intercambio')
      .select('intercambio_id, estado, usuario_propone_id, usuario_recibe_id, fecha_propuesta')
      .eq('estado', 'en_progreso')
      .order('fecha_propuesta', { ascending: false })
      .limit(5)
    
    if (intercambiosError) {
      console.error('❌ Error consultando intercambios:', intercambiosError)
    } else {
      console.log(`📊 Intercambios en progreso: ${intercambiosEnProgreso?.length || 0}`)
      
      if (intercambiosEnProgreso && intercambiosEnProgreso.length > 0) {
        console.log('\n🔍 Analizando intercambios en progreso:')
        
        for (const intercambio of intercambiosEnProgreso) {
          console.log(`\n  Intercambio ${intercambio.intercambio_id}:`)
          console.log(`    Estado: ${intercambio.estado}`)
          console.log(`    Usuario propone: ${intercambio.usuario_propone_id}`)
          console.log(`    Usuario recibe: ${intercambio.usuario_recibe_id}`)
          
          // Verificar validaciones para este intercambio
          const { data: validacionesIntercambio, error: validacionesError } = await supabase
            .from('validacion_intercambio')
            .select('usuario_id, es_exitoso, fecha_validacion')
            .eq('intercambio_id', intercambio.intercambio_id)
            .order('fecha_validacion', { ascending: false })
          
          if (validacionesError) {
            console.log(`    ❌ Error consultando validaciones: ${validacionesError.message}`)
          } else {
            console.log(`    📊 Validaciones: ${validacionesIntercambio?.length || 0}`)
            
            if (validacionesIntercambio && validacionesIntercambio.length > 0) {
              validacionesIntercambio.forEach((val, index) => {
                console.log(`      ${index + 1}. Usuario ${val.usuario_id}: ${val.es_exitoso ? '✅ Exitoso' : '❌ Fallido'} (${val.fecha_validacion})`)
              })
              
              // Analizar si debería cambiar el estado
              if (validacionesIntercambio.length >= 2) {
                const a = validacionesIntercambio[0]?.es_exitoso === true
                const b = validacionesIntercambio[1]?.es_exitoso === true
                
                console.log(`    🎯 Análisis:`)
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
      }
    }
    
    // 6. Verificar intercambios completados recientemente
    console.log('\n✅ 6. Verificando intercambios completados recientemente...')
    const { data: intercambiosCompletados, error: completadosError } = await supabase
      .from('intercambio')
      .select('intercambio_id, estado, fecha_completado, fecha_actualizacion')
      .eq('estado', 'completado')
      .order('fecha_completado', { ascending: false })
      .limit(5)
    
    if (completadosError) {
      console.error('❌ Error consultando intercambios completados:', completadosError)
    } else {
      console.log(`📊 Intercambios completados: ${intercambiosCompletados?.length || 0}`)
      if (intercambiosCompletados && intercambiosCompletados.length > 0) {
        intercambiosCompletados.forEach(intercambio => {
          console.log(`  - ID: ${intercambio.intercambio_id}, Completado: ${intercambio.fecha_completado}`)
        })
      }
    }
    
    console.log('\n✅ Debug completado')
    
  } catch (error) {
    console.error('❌ Error en el debug:', error)
  }
}

// Ejecutar el debug
debugVercelValidation()
