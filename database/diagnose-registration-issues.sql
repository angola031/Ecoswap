-- Script para diagnosticar problemas de registro de usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla usuario tiene todos los campos requeridos
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ Tabla usuario no existe'
        ELSE '✅ Tabla usuario existe'
    END as tabla_usuario,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'user_id' THEN 1 END) > 0 THEN '✅ user_id'
        ELSE '❌ user_id faltante'
    END as campo_user_id,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'nombre' THEN 1 END) > 0 THEN '✅ nombre'
        ELSE '❌ nombre faltante'
    END as campo_nombre,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'apellido' THEN 1 END) > 0 THEN '✅ apellido'
        ELSE '❌ apellido faltante'
    END as campo_apellido,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'email' THEN 1 END) > 0 THEN '✅ email'
        ELSE '❌ email faltante'
    END as campo_email,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'telefono' THEN 1 END) > 0 THEN '✅ telefono'
        ELSE '❌ telefono faltante'
    END as campo_telefono,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'password_hash' THEN 1 END) > 0 THEN '✅ password_hash'
        ELSE '❌ password_hash faltante'
    END as campo_password_hash,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'auth_user_id' THEN 1 END) > 0 THEN '✅ auth_user_id'
        ELSE '❌ auth_user_id faltante'
    END as campo_auth_user_id,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'verificado' THEN 1 END) > 0 THEN '✅ verificado'
        ELSE '❌ verificado faltante'
    END as campo_verificado,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'activo' THEN 1 END) > 0 THEN '✅ activo'
        ELSE '❌ activo faltante'
    END as campo_activo
FROM information_schema.columns 
WHERE table_name = 'usuario' AND table_schema = 'public';

-- 2. Verificar restricciones NOT NULL
SELECT 
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
    AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. Verificar si hay usuarios con campos requeridos NULL
SELECT 
    'Usuarios con nombre NULL' as problema,
    COUNT(*) as cantidad
FROM usuario 
WHERE nombre IS NULL OR nombre = ''

UNION ALL

SELECT 
    'Usuarios con apellido NULL' as problema,
    COUNT(*) as cantidad
FROM usuario 
WHERE apellido IS NULL OR apellido = ''

UNION ALL

SELECT 
    'Usuarios con email NULL' as problema,
    COUNT(*) as cantidad
FROM usuario 
WHERE email IS NULL OR email = ''

UNION ALL

SELECT 
    'Usuarios con password_hash NULL' as problema,
    COUNT(*) as cantidad
FROM usuario 
WHERE password_hash IS NULL OR password_hash = '';

-- 4. Verificar usuarios recientes que fallaron en el registro
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    telefono,
    auth_user_id,
    verificado,
    activo,
    fecha_registro,
    CASE 
        WHEN auth_user_id IS NULL THEN '❌ Sin auth_user_id'
        WHEN nombre IS NULL OR nombre = '' THEN '❌ Sin nombre'
        WHEN apellido IS NULL OR apellido = '' THEN '❌ Sin apellido'
        WHEN email IS NULL OR email = '' THEN '❌ Sin email'
        WHEN password_hash IS NULL OR password_hash = '' THEN '❌ Sin password_hash'
        ELSE '✅ Datos completos'
    END as estado_registro
FROM usuario 
WHERE fecha_registro >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY fecha_registro DESC;

-- 5. Verificar si hay problemas con la foreign key auth_user_id
SELECT 
    'Usuarios con auth_user_id inválido' as problema,
    COUNT(*) as cantidad
FROM usuario u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.auth_user_id IS NOT NULL 
    AND au.id IS NULL;

-- 6. Verificar permisos de inserción (simular inserción)
-- NOTA: Este query solo verifica la estructura, no inserta datos reales
SELECT 
    'Estructura lista para inserción' as resultado,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ Todos los campos requeridos presentes'
        ELSE '❌ Faltan campos requeridos'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
    AND column_name IN (
        'user_id', 'nombre', 'apellido', 'email', 'telefono', 
        'password_hash', 'auth_user_id', 'verificado', 'activo', 'fecha_registro'
    );

-- 7. Verificar si hay usuarios duplicados por email
SELECT 
    email,
    COUNT(*) as cantidad_usuarios,
    STRING_AGG(user_id::text, ', ') as user_ids,
    STRING_AGG(auth_user_id::text, ', ') as auth_user_ids
FROM usuario 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 8. Verificar si hay usuarios duplicados por teléfono
SELECT 
    telefono,
    COUNT(*) as cantidad_usuarios,
    STRING_AGG(user_id::text, ', ') as user_ids
FROM usuario 
WHERE telefono IS NOT NULL 
    AND telefono != ''
GROUP BY telefono 
HAVING COUNT(*) > 1;
