// Script para debuggear con carga manual de variables de entorno
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno manualmente
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          envVars[key] = value
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Error cargando archivo .env:', error.message)
    return {}
  }
}

// Cargar variables de entorno
const envVars = loadEnvFile('.env.local')

// Aplicar variables al proceso
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key]
})

console.log('🔍 Variables de entorno cargadas:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')

// Ahora ejecutar el debug
const { createClient } = require('@supabase/supabase-js')

async function debugWithEnv() {
  try {
    console.log('\n🔍 Iniciando debug con variables de entorno cargadas...')
    
    // Verificar que tenemos las variables necesarias
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Variables de Supabase no configuradas')
      return
    }
    
    // Configurar Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    console.log('✅ Cliente de Supabase configurado')
    
    // Verificar tabla de validaciones
    console.log('\n📊 Verificando tabla de validaciones...')
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
    
    // Verificar intercambios en progreso
    console.log('\n🔄 Verificando intercambios en progreso...')
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
    
    console.log('\n✅ Debug completado')
    
  } catch (error) {
    console.error('❌ Error en el debug:', error)
  }
}

// Ejecutar el debug
debugWithEnv()
