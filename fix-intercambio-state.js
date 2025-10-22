// Script para corregir manualmente el estado del intercambio
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

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
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key]
})

async function fixIntercambioState() {
  try {
    console.log('🔧 Corrigiendo estado del intercambio...')
    
    // Configurar Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Intercambio que necesita corrección
    const intercambioId = 8
    
    console.log(`\n🔄 Actualizando intercambio ${intercambioId} de 'en_progreso' a 'completado'...`)
    
    // Actualizar el estado del intercambio
    const { data, error } = await supabase
      .from('intercambio')
      .update({ 
        estado: 'completado',
        fecha_completado: new Date().toISOString()
      })
      .eq('intercambio_id', intercambioId)
      .select()
    
    if (error) {
      console.error('❌ Error actualizando intercambio:', error)
      return
    }
    
    console.log('✅ Intercambio actualizado correctamente')
    console.log('📊 Datos actualizados:', data)
    
    // Verificar que se actualizó correctamente
    console.log('\n🔍 Verificando el cambio...')
    const { data: intercambioActualizado, error: verifyError } = await supabase
      .from('intercambio')
      .select('intercambio_id, estado, fecha_completado')
      .eq('intercambio_id', intercambioId)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verificando intercambio:', verifyError)
    } else {
      console.log('✅ Verificación exitosa:')
      console.log(`  - Estado: ${intercambioActualizado.estado}`)
      console.log(`  - Fecha completado: ${intercambioActualizado.fecha_completado}`)
    }
    
    // Verificar si hay otros intercambios con el mismo problema
    console.log('\n🔍 Verificando otros intercambios con el mismo problema...')
    const { data: otrosIntercambios, error: otrosError } = await supabase
      .from('intercambio')
      .select('intercambio_id, estado')
      .eq('estado', 'en_progreso')
    
    if (otrosError) {
      console.error('❌ Error consultando otros intercambios:', otrosError)
    } else {
      console.log(`📊 Otros intercambios en progreso: ${otrosIntercambios?.length || 0}`)
      
      if (otrosIntercambios && otrosIntercambios.length > 0) {
        console.log('⚠️ Hay otros intercambios que podrían tener el mismo problema:')
        otrosIntercambios.forEach(intercambio => {
          console.log(`  - Intercambio ${intercambio.intercambio_id}: ${intercambio.estado}`)
        })
      }
    }
    
    console.log('\n✅ Corrección completada')
    
  } catch (error) {
    console.error('❌ Error en la corrección:', error)
  }
}

// Ejecutar la corrección
fixIntercambioState()
