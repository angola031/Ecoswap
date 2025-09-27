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
    created_at
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
