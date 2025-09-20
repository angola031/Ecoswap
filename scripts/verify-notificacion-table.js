#!/usr/bin/env node

/**
 * Script para verificar que la tabla notificacion existe y tiene la estructura correcta
 */

console.log('🔍 VERIFICANDO TABLA NOTIFICACION')
console.log('=================================')

console.log('\n📋 INFORMACIÓN DE LA TABLA:')
console.log('')
console.log('• Nombre: notificacion (minúsculas)')
console.log('• Ubicación: Supabase Database')
console.log('• Esquema: public')
console.log('• Tipo: Tabla de notificaciones del sistema')

console.log('\n📊 ESTRUCTURA ESPERADA:')
console.log('')
console.log('Columnas principales:')
console.log('• notificacion_id (SERIAL PRIMARY KEY)')
console.log('• user_id (INTEGER, opcional)')
console.log('• titulo (VARCHAR(255))')
console.log('• mensaje (TEXT)')
console.log('• tipo (VARCHAR(50))')
console.log('• es_admin (BOOLEAN)')
console.log('• url_accion (VARCHAR(500), opcional)')
console.log('• datos_adicionales (JSONB, opcional)')
console.log('• fecha_creacion (TIMESTAMP WITH TIME ZONE)')
console.log('• leida (BOOLEAN)')
console.log('• created_at (TIMESTAMP WITH TIME ZONE)')
console.log('• updated_at (TIMESTAMP WITH TIME ZONE)')

console.log('\n🔍 CONSULTAS DE VERIFICACIÓN:')
console.log('')
console.log('Ejecuta estas consultas en Supabase SQL Editor para verificar:')
console.log('')
console.log('1️⃣ VERIFICAR QUE LA TABLA EXISTE:')
console.log('='.repeat(50))
console.log(`
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'notificacion';
`)
console.log('='.repeat(50))

console.log('\n2️⃣ VERIFICAR ESTRUCTURA DE COLUMNAS:')
console.log('='.repeat(50))
console.log(`
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'notificacion'
ORDER BY ordinal_position;
`)
console.log('='.repeat(50))

console.log('\n3️⃣ VERIFICAR DATOS DE PRUEBA:')
console.log('='.repeat(50))
console.log(`
SELECT 
    notificacion_id,
    user_id,
    titulo,
    tipo,
    es_admin,
    leida,
    fecha_creacion
FROM notificacion 
ORDER BY fecha_creacion DESC
LIMIT 5;
`)
console.log('='.repeat(50))

console.log('\n4️⃣ VERIFICAR ÍNDICES:')
console.log('='.repeat(50))
console.log(`
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'notificacion';
`)
console.log('='.repeat(50))

console.log('\n5️⃣ VERIFICAR POLÍTICAS RLS:')
console.log('='.repeat(50))
console.log(`
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'notificacion';
`)
console.log('='.repeat(50))

console.log('\n✅ INDICADORES DE TABLA CORRECTA:')
console.log('')
console.log('🟢 TABLA EXISTE:')
console.log('• La consulta 1 devuelve una fila con table_name = "notificacion"')
console.log('')
console.log('🟢 ESTRUCTURA CORRECTA:')
console.log('• Debe tener al menos las columnas principales')
console.log('• notificacion_id debe ser PRIMARY KEY')
console.log('• fecha_creacion debe ser TIMESTAMP')
console.log('')
console.log('🟢 DATOS ACCESIBLES:')
console.log('• La consulta 3 debe ejecutarse sin errores')
console.log('• Puede devolver 0 filas si no hay datos')
console.log('')
console.log('🟢 ÍNDICES CREADOS:')
console.log('• Debe haber índices en user_id, es_admin, leida')
console.log('• Índice en fecha_creacion para ordenamiento')
console.log('')
console.log('🟢 POLÍTICAS RLS:')
console.log('• Debe tener políticas para SELECT, INSERT, UPDATE')
console.log('• Políticas deben permitir acceso autenticado')

console.log('\n🧪 PROBAR INSERCIÓN:')
console.log('')
console.log('Si quieres probar que la tabla funciona, ejecuta:')
console.log('='.repeat(50))
console.log(`
INSERT INTO notificacion (
    titulo,
    mensaje,
    tipo,
    es_admin,
    fecha_creacion,
    leida
) VALUES (
    'Prueba de Sistema',
    'Esta es una notificación de prueba',
    'info',
    true,
    NOW(),
    false
);
`)
console.log('='.repeat(50))

console.log('\n🚀 DESPUÉS DE VERIFICAR:')
console.log('')
console.log('Si todas las consultas funcionan correctamente:')
console.log('• La tabla está bien configurada')
console.log('• El sistema de notificaciones debería funcionar')
console.log('• No deberías ver "Error cargando notificaciones"')
console.log('')
console.log('Si hay errores en las consultas:')
console.log('• La tabla puede no existir')
console.log('• La estructura puede estar incompleta')
console.log('• Las políticas RLS pueden estar mal configuradas')

console.log('\n💡 RECORDATORIO:')
console.log('• Nombre de tabla: notificacion (minúsculas)')
console.log('• Esquema: public')
console.log('• Todas las consultas del código usan el nombre correcto')
console.log('• Si el error persiste, revisa permisos de usuario')
