-- Script para verificar la estructura de la tabla usuario
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla usuario
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar restricciones de la tabla usuario
SELECT 
    tc.constraint_name,
    tc.constraint_type,
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
    AND tc.table_schema = 'public';

-- 3. Verificar si existen índices únicos
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'usuario' 
    AND schemaname = 'public';

-- 4. Verificar datos de ejemplo en la tabla
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    telefono,
    auth_user_id,
    verificado,
    activo,
    fecha_registro
FROM usuario 
LIMIT 5;

-- 5. Verificar si hay usuarios con auth_user_id NULL
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(auth_user_id) as usuarios_con_auth_id,
    COUNT(*) - COUNT(auth_user_id) as usuarios_sin_auth_id
FROM usuario;

-- 6. Verificar si hay emails duplicados
SELECT 
    email,
    COUNT(*) as cantidad
FROM usuario 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 7. Verificar si hay teléfonos duplicados
SELECT 
    telefono,
    COUNT(*) as cantidad
FROM usuario 
WHERE telefono IS NOT NULL 
    AND telefono != ''
GROUP BY telefono 
HAVING COUNT(*) > 1;

-- 8. Verificar usuarios recientes (últimos 7 días)
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    telefono,
    auth_user_id,
    verificado,
    activo,
    fecha_registro
FROM usuario 
WHERE fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY fecha_registro DESC;

-- 9. Verificar estructura de tabla auth.users (si es accesible)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 10. Verificar si hay usuarios en auth.users sin correspondencia en usuario
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.email_confirmed_at,
    u.user_id,
    u.email as usuario_email
FROM auth.users au
LEFT JOIN public.usuario u ON au.id = u.auth_user_id
WHERE u.user_id IS NULL
LIMIT 10;
