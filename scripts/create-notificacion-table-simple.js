#!/usr/bin/env node

/**
 * Script simplificado para crear la tabla NOTIFICACION usando Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno de Supabase no configuradas')
    console.log('Asegúrate de tener en tu archivo .env.local:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTable() {
    console.log('🔧 CREANDO TABLA NOTIFICACION')
    console.log('=============================')
    
    try {
        // SQL para crear la tabla
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS NOTIFICACION (
                notificacion_id SERIAL PRIMARY KEY,
                user_id INTEGER,
                titulo VARCHAR(255) NOT NULL,
                mensaje TEXT NOT NULL,
                tipo VARCHAR(50) DEFAULT 'info',
                es_admin BOOLEAN DEFAULT FALSE,
                url_accion VARCHAR(500),
                datos_adicionales JSONB,
                fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                leida BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `
        
        // Crear índices
        const createIndexesSQL = `
            CREATE INDEX IF NOT EXISTS idx_notificacion_user_id ON NOTIFICACION(user_id);
            CREATE INDEX IF NOT EXISTS idx_notificacion_es_admin ON NOTIFICACION(es_admin);
            CREATE INDEX IF NOT EXISTS idx_notificacion_leida ON NOTIFICACION(leida);
            CREATE INDEX IF NOT EXISTS idx_notificacion_fecha_creacion ON NOTIFICACION(fecha_creacion);
        `
        
        // Habilitar RLS
        const enableRLSSQL = `ALTER TABLE NOTIFICACION ENABLE ROW LEVEL SECURITY;`
        
        // Crear políticas
        const createPoliciesSQL = `
            DROP POLICY IF EXISTS "Notificaciones son visibles" ON NOTIFICACION;
            CREATE POLICY "Notificaciones son visibles" ON NOTIFICACION FOR SELECT USING (true);
            
            DROP POLICY IF EXISTS "Notificaciones pueden ser creadas" ON NOTIFICACION;
            CREATE POLICY "Notificaciones pueden ser creadas" ON NOTIFICACION FOR INSERT WITH CHECK (true);
            
            DROP POLICY IF EXISTS "Notificaciones pueden ser actualizadas" ON NOTIFICACION;
            CREATE POLICY "Notificaciones pueden ser actualizadas" ON NOTIFICACION FOR UPDATE USING (true);
        `
        
        console.log('1. Creando tabla NOTIFICACION...')
        const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
        
        if (tableError) {
            console.log('⚠️ No se pudo usar RPC, intentando método alternativo...')
            
            // Método alternativo: intentar insertar y ver si la tabla existe
            const { data: testData, error: testError } = await supabase
                .from('notificacion')
                .select('notificacion_id')
                .limit(1)
            
            if (testError && testError.message.includes('relation "notificacion" does not exist')) {
                console.log('❌ La tabla NOTIFICACION no existe y no se pudo crear automáticamente')
                console.log('\n📝 INSTRUCCIONES MANUALES:')
                console.log('1. Ve a tu Supabase Dashboard')
                console.log('2. Ve a SQL Editor')
                console.log('3. Copia y pega el siguiente SQL:')
                console.log('\n' + '='.repeat(50))
                console.log(createTableSQL)
                console.log(createIndexesSQL)
                console.log(enableRLSSQL)
                console.log(createPoliciesSQL)
                console.log('='.repeat(50))
                return
            }
        } else {
            console.log('✅ Tabla creada exitosamente')
        }
        
        console.log('2. Creando índices...')
        const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })
        if (indexError) {
            console.log('⚠️ Error creando índices:', indexError.message)
        } else {
            console.log('✅ Índices creados')
        }
        
        console.log('3. Habilitando Row Level Security...')
        const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL })
        if (rlsError) {
            console.log('⚠️ Error habilitando RLS:', rlsError.message)
        } else {
            console.log('✅ RLS habilitado')
        }
        
        console.log('4. Creando políticas de seguridad...')
        const { error: policiesError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL })
        if (policiesError) {
            console.log('⚠️ Error creando políticas:', policiesError.message)
        } else {
            console.log('✅ Políticas creadas')
        }
        
        // Probar la tabla
        console.log('\n5. Probando la tabla...')
        const { data: testData, error: testError } = await supabase
            .from('notificacion')
            .select('notificacion_id')
            .limit(1)
        
        if (testError) {
            console.error('❌ Error probando la tabla:', testError)
            return
        }
        
        console.log('✅ Tabla funcionando correctamente')
        
        // Insertar notificación de prueba
        console.log('\n6. Insertando notificación de prueba...')
        const { data: insertData, error: insertError } = await supabase
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
        
        if (insertError) {
            console.error('❌ Error insertando notificación:', insertError)
            return
        }
        
        console.log('✅ Notificación de prueba insertada')
        console.log(`   ID: ${insertData[0]?.notificacion_id}`)
        
        // Eliminar notificación de prueba
        await supabase
            .from('notificacion')
            .delete()
            .eq('notificacion_id', insertData[0]?.notificacion_id)
        
        console.log('✅ Notificación de prueba eliminada')
        
        console.log('\n🎉 CONFIGURACIÓN COMPLETA')
        console.log('=========================')
        console.log('✅ Tabla NOTIFICACION creada y configurada')
        console.log('✅ Sistema de notificaciones funcionando')
        console.log('✅ Listo para usar en el dashboard de administradores')
        
    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

createTable()
