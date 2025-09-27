-- Script para simular diferentes errores de registro
-- ⚠️ ADVERTENCIA: Este script es solo para diagnóstico, NO ejecutar en producción
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura actual de la tabla usuario
SELECT '=== ESTRUCTURA DE TABLA USUARIO ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar restricciones NOT NULL
SELECT '=== CAMPOS NOT NULL ===' as info;

SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
    AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. Verificar restricciones UNIQUE
SELECT '=== RESTRICCIONES UNIQUE ===' as info;

SELECT 
    tc.constraint_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'usuario' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE';

-- 4. Verificar foreign keys
SELECT '=== FOREIGN KEYS ===' as info;

SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'usuario' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 5. Verificar si hay usuarios existentes
SELECT '=== USUARIOS EXISTENTES ===' as info;

SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as con_auth_id,
    COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as sin_auth_id
FROM usuario;

-- 6. Verificar emails existentes
SELECT '=== EMAILS EXISTENTES ===' as info;

SELECT 
    email,
    user_id,
    auth_user_id,
    verificado,
    activo
FROM usuario 
ORDER BY fecha_registro DESC 
LIMIT 5;

-- 7. Verificar teléfonos existentes
SELECT '=== TELÉFONOS EXISTENTES ===' as info;

SELECT 
    telefono,
    user_id,
    email
FROM usuario 
WHERE telefono IS NOT NULL 
    AND telefono != ''
ORDER BY fecha_registro DESC 
LIMIT 5;

-- 8. Verificar usuarios en auth.users (si es accesible)
SELECT '=== USUARIOS EN AUTH.USERS ===' as info;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Verificar correspondencia entre auth.users y usuario
SELECT '=== CORRESPONDENCIA AUTH-USUARIO ===' as info;

SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.email_confirmed_at,
    u.user_id,
    u.email as usuario_email,
    u.auth_user_id,
    CASE 
        WHEN u.user_id IS NULL THEN '❌ Usuario en auth.users sin registro en usuario'
        WHEN au.id IS NULL THEN '❌ Usuario en usuario sin registro en auth.users'
        WHEN au.id = u.auth_user_id THEN '✅ Correspondencia correcta'
        ELSE '❌ Correspondencia incorrecta'
    END as estado
FROM auth.users au
FULL OUTER JOIN public.usuario u ON au.id = u.auth_user_id
ORDER BY au.created_at DESC 
LIMIT 10;

-- 10. Simular inserción (solo verificar estructura, no insertar)
SELECT '=== SIMULACIÓN DE INSERCIÓN ===' as info;

-- Verificar si todos los campos requeridos están presentes
SELECT 
    'Campos requeridos para inserción' as descripcion,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ Todos los campos requeridos presentes'
        ELSE '❌ Faltan campos requeridos'
    END as estado,
    COUNT(*) as campos_encontrados
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
    AND column_name IN (
        'user_id', 'nombre', 'apellido', 'email', 'telefono', 
        'password_hash', 'auth_user_id', 'verificado', 'activo', 'fecha_registro'
    );

-- 11. Verificar permisos de inserción (simular)
SELECT '=== VERIFICACIÓN DE PERMISOS ===' as info;

-- Verificar si la tabla es accesible
SELECT 
    'Acceso a tabla usuario' as descripcion,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Tabla accesible'
        ELSE '❌ Tabla no accesible'
    END as estado
FROM information_schema.tables 
WHERE table_name = 'usuario' 
    AND table_schema = 'public';

-- 12. Verificar secuencias (auto-increment)
SELECT '=== SECUENCIAS ===' as info;

SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_name LIKE '%usuario%'
    AND sequence_schema = 'public';
