#!/usr/bin/env node

/**
 * Script para diagnosticar el error específico en las notificaciones
 */

console.log('🔍 DIAGNÓSTICO DEL ERROR DE NOTIFICACIONES')
console.log('==========================================')

console.log('\n📋 POSIBLES CAUSAS DEL ERROR:')
console.log('')
console.log('1. 🔗 PROBLEMA DE RELACIÓN (JOIN):')
console.log('   • La consulta intenta hacer JOIN con tabla USUARIO')
console.log('   • Sintaxis: usuario:user_id (foreign key)')
console.log('   • Puede fallar si la relación no está configurada')
console.log('')
console.log('2. 📊 ESTRUCTURA DE TABLA:')
console.log('   • Columna user_id puede no existir')
console.log('   • Tipo de dato user_id puede ser incorrecto')
console.log('   • Índices pueden estar faltando')
console.log('')
console.log('3. 🔒 PERMISOS DE ACCESO:')
console.log('   • Row Level Security (RLS) puede estar bloqueando')
console.log('   • Políticas de seguridad incorrectas')
console.log('   • Usuario no tiene permisos para leer la tabla')
console.log('')
console.log('4. 📝 DATOS CORRUPTOS:')
console.log('   • Valores NULL en user_id')
console.log('   • Referencias a usuarios que no existen')
console.log('   • Datos inconsistentes entre tablas')

console.log('\n🧪 CONSULTAS DE DIAGNÓSTICO:')
console.log('')
console.log('Ejecuta estas consultas en Supabase SQL Editor para diagnosticar:')
console.log('')
console.log('1️⃣ VERIFICAR ESTRUCTURA DE LA TABLA:')
console.log('='.repeat(50))
console.log(`
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'notificacion'
ORDER BY ordinal_position;
`)
console.log('='.repeat(50))

console.log('\n2️⃣ VERIFICAR DATOS EN LA TABLA:')
console.log('='.repeat(50))
console.log(`
SELECT 
    notificacion_id,
    user_id,
    titulo,
    es_admin,
    fecha_creacion,
    leida
FROM notificacion 
LIMIT 5;
`)
console.log('='.repeat(50))

console.log('\n3️⃣ VERIFICAR RELACIÓN CON USUARIO:')
console.log('='.repeat(50))
console.log(`
SELECT 
    n.notificacion_id,
    n.user_id,
    n.titulo,
    u.nombre,
    u.apellido,
    u.email
FROM notificacion n
LEFT JOIN usuario u ON n.user_id = u.user_id
LIMIT 5;
`)
console.log('='.repeat(50))

console.log('\n4️⃣ VERIFICAR POLÍTICAS RLS:')
console.log('='.repeat(50))
console.log(`
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notificacion';
`)
console.log('='.repeat(50))

console.log('\n🔧 SOLUCIONES POSIBLES:')
console.log('')
console.log('A) SIMPLIFICAR LA CONSULTA:')
console.log('   • Quitar el JOIN con usuario')
console.log('   • Usar solo datos de la tabla notificacion')
console.log('   • Cargar datos de usuario por separado si es necesario')
console.log('')
console.log('B) CORREGIR LA RELACIÓN:')
console.log('   • Verificar que user_id sea INTEGER')
console.log('   • Asegurar que existan usuarios con esos IDs')
console.log('   • Crear foreign key constraint si es necesario')
console.log('')
console.log('C) AJUSTAR POLÍTICAS RLS:')
console.log('   • Simplificar políticas de seguridad')
console.log('   • Permitir acceso completo temporalmente')
console.log('   • Verificar permisos del usuario actual')

console.log('\n📝 CONSULTA SIMPLIFICADA (RECOMENDADA):')
console.log('')
console.log('En lugar de:')
console.log('```')
console.log('.select(`')
console.log('    *,')
console.log('    usuario:user_id (')
console.log('        user_id,')
console.log('        nombre,')
console.log('        apellido,')
console.log('        email,')
console.log('        foto_perfil')
console.log('    )')
console.log('`)')
console.log('```')
console.log('')
console.log('Usar:')
console.log('```')
console.log('.select(`')
console.log('    notificacion_id,')
console.log('    user_id,')
console.log('    titulo,')
console.log('    mensaje,')
console.log('    tipo,')
console.log('    es_admin,')
console.log('    url_accion,')
console.log('    datos_adicionales,')
console.log('    fecha_creacion,')
console.log('    leida')
console.log('`)')
console.log('```')

console.log('\n🚀 SIGUIENTE PASO:')
console.log('1. Ejecuta las consultas de diagnóstico en Supabase')
console.log('2. Identifica cuál es el problema específico')
console.log('3. Aplica la solución correspondiente')
console.log('4. Prueba el sistema de notificaciones')

console.log('\n💡 TIP: Si la tabla existe pero hay error,')
console.log('probablemente es un problema de JOIN o permisos.')
console.log('La solución más rápida es simplificar la consulta.')
