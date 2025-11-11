-- Analizar la función handle_new_user para entender qué está causando el error

-- 1. Ver el código completo de la función handle_new_user
SELECT 
    'FUNCIÓN: ' || p.proname as info,
    p.prosrc as codigo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- 2. Ver las dependencias de esta función
SELECT 
    'DEPENDENCIAS: ' as info,
    pg_get_functiondef(p.oid) as definicion_completa
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- 3. Verificar si hay errores en la función
-- (Esto mostrará si hay problemas de sintaxis o referencias)
SELECT 
    'ESTADO DE LA FUNCIÓN:' as info,
    CASE 
        WHEN p.prosrc IS NULL THEN 'FUNCIÓN SIN CÓDIGO'
        WHEN p.prosrc = '' THEN 'FUNCIÓN VACÍA'
        ELSE 'FUNCIÓN TIENE CÓDIGO (' || length(p.prosrc) || ' caracteres)'
    END as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- 4. Ver si hay problemas con la tabla usuario que podría estar causando el error
SELECT 
    'ESTRUCTURA TABLA USUARIO:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'usuario'
ORDER BY ordinal_position;













































