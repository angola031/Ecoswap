// Script para ejecutar la actualización del esquema de validación
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSchemaUpdate() {
  try {
    console.log('🚀 Iniciando actualización del esquema de validación...')
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('update-validation-schema.sql', 'utf8')
    
    // Dividir el contenido en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Ejecutando ${statements.length} statements SQL...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim()) {
        try {
          console.log(`\n🔄 Ejecutando statement ${i + 1}/${statements.length}...`)
          
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          })
          
          if (error) {
            console.error(`❌ Error en statement ${i + 1}:`, error.message)
            errorCount++
          } else {
            console.log(`✅ Statement ${i + 1} ejecutado correctamente`)
            successCount++
          }
        } catch (err) {
          console.error(`❌ Excepción en statement ${i + 1}:`, err.message)
          errorCount++
        }
      }
    }
    
    console.log('\n📊 Resumen de la ejecución:')
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Esquema actualizado correctamente!')
      console.log('📋 Próximos pasos:')
      console.log('1. Verificar que la tabla validacion_intercambio existe')
      console.log('2. Probar la funcionalidad de validación')
      console.log('3. Verificar que los triggers funcionan correctamente')
    } else {
      console.log('\n⚠️ Hubo algunos errores. Revisar los logs arriba.')
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando actualización del esquema:', error)
  }
}

// Ejecutar la actualización
runSchemaUpdate()
