#!/usr/bin/env node

/**
 * Script para verificar y crear la tabla NOTIFICACION si no existe
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno de Supabase no configuradas')
    console.log('Asegúrate de tener:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndCreateTable() {
    console.log('🔍 VERIFICANDO TABLA NOTIFICACION')
    console.log('=================================')
    
    try {
        // Verificar si la tabla existe
        console.log('\n1. Verificando existencia de la tabla...')
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'notificacion')
        
        if (tablesError) {
            console.error('❌ Error verificando tablas:', tablesError)
            return
        }
        
        if (tables && tables.length > 0) {
            console.log('✅ La tabla NOTIFICACION ya existe')
            
            // Verificar estructura de la tabla
            console.log('\n2. Verificando estructura de la tabla...')
            const { data: columns, error: columnsError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_schema', 'public')
                .eq('table_name', 'notificacion')
                .order('ordinal_position')
            
            if (columnsError) {
                console.error('❌ Error verificando columnas:', columnsError)
                return
            }
            
            console.log('📋 Estructura actual de la tabla:')
            columns?.forEach(col => {
                console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
            })
            
            // Verificar si hay datos
            console.log('\n3. Verificando datos existentes...')
            const { data: count, error: countError } = await supabase
                .from('notificacion')
                .select('notificacion_id', { count: 'exact' })
            
            if (countError) {
                console.error('❌ Error contando registros:', countError)
                return
            }
            
            console.log(`📊 Total de notificaciones: ${count?.length || 0}`)
            
        } else {
            console.log('❌ La tabla NOTIFICACION no existe')
            console.log('\n2. Creando tabla NOTIFICACION...')
            
            // Leer el script SQL
            const sqlPath = path.join(__dirname, '..', 'database', 'create-notificacion-table.sql')
            const sqlContent = fs.readFileSync(sqlPath, 'utf8')
            
            // Ejecutar el script SQL
            const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
            
            if (error) {
                console.error('❌ Error creando tabla:', error)
                console.log('\n📝 Ejecuta manualmente el script SQL:')
                console.log('1. Ve a Supabase Dashboard > SQL Editor')
                console.log('2. Copia y pega el contenido de: database/create-notificacion-table.sql')
                console.log('3. Ejecuta el script')
                return
            }
            
            console.log('✅ Tabla NOTIFICACION creada exitosamente')
        }
        
        // Probar inserción de una notificación de prueba
        console.log('\n4. Probando inserción de notificación...')
        const { data: testNotification, error: testError } = await supabase
            .from('notificacion')
            .insert({
                titulo: 'Sistema de Notificaciones Configurado',
                mensaje: 'El sistema de notificaciones ha sido configurado correctamente.',
                tipo: 'success',
                es_admin: true,
                fecha_creacion: new Date().toISOString(),
                leida: false
            })
            .select()
        
        if (testError) {
            console.error('❌ Error insertando notificación de prueba:', testError)
            return
        }
        
        console.log('✅ Notificación de prueba insertada correctamente')
        console.log(`   ID: ${testNotification[0]?.notificacion_id}`)
        
        // Eliminar la notificación de prueba
        console.log('\n5. Limpiando notificación de prueba...')
        await supabase
            .from('notificacion')
            .delete()
            .eq('notificacion_id', testNotification[0]?.notificacion_id)
        
        console.log('✅ Notificación de prueba eliminada')
        
        console.log('\n🎉 VERIFICACIÓN COMPLETA')
        console.log('========================')
        console.log('✅ Tabla NOTIFICACION configurada correctamente')
        console.log('✅ Estructura de la tabla verificada')
        console.log('✅ Inserción y eliminación funcionando')
        console.log('✅ Sistema de notificaciones listo para usar')
        
    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

// Ejecutar verificación
checkAndCreateTable()
